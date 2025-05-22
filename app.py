import pythoncom
from flask import Flask, render_template, jsonify
import os
import winshell
import subprocess
import logging # Ensure logging is imported
import base64
from io import BytesIO

# Attempt to import necessary imaging and icon libraries
try:
    from PIL import Image
except ImportError:
    logging.warning("Pillow library (PIL) not found. Icon extraction will be limited or may fail.")
    Image = None

try:
    import win32gui
    import win32ui
    import win32con
    import win32api
except ImportError:
    logging.warning("pywin32 library not found. Icon extraction will be limited or may fail.")
    win32gui = None
    win32ui = None
    win32con = None
    win32api = None

app = Flask(__name__)
logging.basicConfig(level=logging.INFO) # Initialize logging

DESKTOP_PATH = os.path.join(os.path.expanduser("~"), "Desktop")

CATEGORIES = {
    "Productivity": ["word", "excel", "powerpoint", "outlook", "onenote", "editor", "vscode", "pycharm", "idea", "todo", "notion", "evernote", "obsidian"],
    "Development": ["visual studio", "git", "docker", "terminal", "powershell", "cmd", "android studio", "xcode", "jetbrains", "sublime text", "atom"],
    "Web Browsers": ["chrome", "firefox", "edge", "safari", "opera", "browser", "brave", "vivaldi"],
    "Communication": ["slack", "teams", "zoom", "discord", "skype", "telegram", "whatsapp", "messenger"],
    "Graphics & Design": ["photoshop", "illustrator", "figma", "gimp", "blender", "autocad", "adobe", "coreldraw", "inkscape"],
    "Games": ["steam", "epic games", "origin", "battle.net", "gog galaxy", "game", "uplay", "riot games"],
    "Utilities": ["settings", "control panel", "explorer", "calculator", "notepad", "utility", "driver", "manager"],
    "Media": ["vlc", "spotify", "itunes", "netflix", "plex", "youtube music", "winamp", "audacity"],
    "System": ["task manager", "regedit", "msconfig", "defrag", "backup", "antivirus", "firewall"],
    "Finance": ["quickbooks", "xero", "money", "finance", "trading"],
    # Add more categories and keywords as needed
}
DEFAULT_CATEGORY = "Other"


def classify_shortcut(shortcut_info):
    """Classifies a shortcut based on its name, path, and description."""
    if not shortcut_info:
        return DEFAULT_CATEGORY

    name = shortcut_info.get("name", "").lower()
    path = shortcut_info.get("path", "").lower()
    description = shortcut_info.get("description", "").lower()

    # Combine relevant text fields for searching
    search_text = f"{name} {os.path.basename(path)} {description}" # Include filename from path

    for category, keywords in CATEGORIES.items():
        for keyword in keywords:
            if keyword.lower() in search_text:
                return category
    return DEFAULT_CATEGORY


def get_icon_base64(shortcut):
    """Extracts icon from shortcut and returns base64 encoded string."""
    if not (win32gui and win32ui and win32con and win32api):
        logging.warning("Skipping icon extraction because pywin32 is not fully available.")
        return None

    icon_path_idx = shortcut.icon_location
    if not icon_path_idx or not icon_path_idx[0]:
        logging.info(f"No icon location for shortcut pointing to {shortcut.path}")
        return None

    icon_path = os.path.expandvars(icon_path_idx[0])
    icon_index = icon_path_idx[1]

    if not os.path.exists(icon_path):
        # Check if the path is a system resource (e.g., %SystemRoot%\System32\...)
        # This is a simplified check; robustly finding system DLLs can be complex.
        if not icon_path.lower().startswith(os.path.expandvars("%systemroot%").lower()):
             logging.warning(f"Icon path {icon_path} does not exist for shortcut {shortcut.path}")
             return None
        # If it looks like a system path, it might be valid even if os.path.exists is false (e.g. inside a DLL)
        logging.info(f"Icon path {icon_path} for shortcut {shortcut.path} might be a system resource.")


    large_icons, small_icons = [None], [None] # Default to avoid reference before assignment
    try:
        # Attempt to extract icons. This can fail if the file is not an icon container or index is out of bounds.
        # Number of icons = 1, to get only the specified one.
        num_icons = win32gui.ExtractIconEx(icon_path, -1, 0, 0, 0) # Get total number of icons
        if icon_index >= num_icons :
            logging.warning(f"Icon index {icon_index} out of bounds for {icon_path} (total icons: {num_icons}). Trying index 0.")
            icon_index = 0 # Default to first icon if index is bad

        large_icons, small_icons = win32gui.ExtractIconEx(icon_path, icon_index, 1)
        
        icon_handle = None
        destroy_icon_func = win32gui.DestroyIcon # Prepare to destroy icons later

        if large_icons and large_icons[0]:
            icon_handle = large_icons[0]
        elif small_icons and small_icons[0]:
            icon_handle = small_icons[0]
        else:
            logging.warning(f"No icons found in {icon_path} at index {icon_index}")
            return None
        
        if not icon_handle:
            logging.warning(f"Could not extract icon handle from {icon_path} at index {icon_index}")
            # Clean up any icons that might have been partially extracted
            if large_icons: [destroy_icon_func(h) for h in large_icons if h]
            if small_icons: [destroy_icon_func(h) for h in small_icons if h and (not large_icons or h not in large_icons)]
            return None

        try:
            icon_info = win32gui.GetIconInfo(icon_handle)
            if not icon_info: # Should have hbmColor and hbmMask
                logging.warning(f"GetIconInfo failed for icon from {icon_path}")
                return None # icon_handle will be destroyed in finally

            # Create a device context (DC) and a memory DC
            hdc_screen = win32gui.GetDC(0) # Get DC for the screen
            hdc_mem = win32ui.CreateDCFromHandle(hdc_screen)
            mem_dc = hdc_mem.CreateCompatibleDC()
            
            icon_x = win32api.GetSystemMetrics(win32con.SM_CXICON)
            icon_y = win32api.GetSystemMetrics(win32con.SM_CYICON)

            # Create a bitmap compatible with the screen DC
            bitmap = win32ui.CreateBitmap()
            bitmap.CreateCompatibleBitmap(hdc_mem, icon_x, icon_y)
            mem_dc.SelectObject(bitmap)

            # Draw the icon onto the bitmap in the memory DC
            # DI_NORMAL draws the icon using its normal size
            win32gui.DrawIconEx(mem_dc.GetSafeHdc(), 0, 0, icon_handle, icon_x, icon_y, 0, None, win32con.DI_NORMAL)

            base64_str = None
            if Image: # Pillow is needed to convert to PNG
                # Get bitmap bits and create PIL Image
                # The following conversion logic is complex and depends on the icon's bit depth and transparency type.
                # This is a common path for 32-bit icons with alpha.
                
                bmp_info = bitmap.GetInfo()
                bmp_bits = bitmap.GetBitmapBits(True)
                
                pil_img = None
                if icon_info.hbmColor: # Color bitmap usually means 24-bit or less, mask is separate
                    # For icons with hbmColor and hbmMask (typically older/simpler icons)
                    # This path is more complex to get transparency right with PIL.
                    # A simpler approach for now: create an RGBA image and hope for the best.
                    # Proper handling would involve using the mask (hbmMask).
                    pil_img = Image.frombuffer(
                        'RGB',
                        (bmp_info['bmWidth'], bmp_info['bmHeight']),
                        bmp_bits, 'raw', 'BGRX', 0, 1) # BGRX assumes 32-bit with an unused alpha, common for DrawIconEx output into a compatible bitmap

                    # If there's a mask bitmap, try to apply it. This is tricky.
                    if icon_info.hbmMask:
                        # Convert mask to an Image, then use as alpha.
                        # This part requires careful handling of bitmap formats.
                        # For simplicity, we'll assume the main drawing already handled transparency if it was an alpha icon.
                        # If not, this part would need to reconstruct the alpha channel.
                        pass # Placeholder for more complex mask handling

                elif icon_info.hbmBitmap: # Deprecated, but some icons might use this.
                     pil_img = Image.frombuffer(
                        'RGB',
                        (bmp_info['bmWidth'], bmp_info['bmHeight']),
                        bmp_bits, 'raw', 'BGRX', 0, 1)


                if pil_img:
                    # Convert to RGBA if not already, to ensure alpha channel for PNG
                    pil_img = pil_img.convert("RGBA")
                    
                    # Make background transparent (heuristic: if alpha is 0 from BGRX, or make white transparent)
                    # This is a common simplification. Real icon transparency can be complex.
                    datas = pil_img.getdata()
                    newData = []
                    for item in datas:
                        # If alpha is 0 (fully transparent from BGRX) or pixel is pure white, make it transparent PNG
                        if item[3] == 0 or (item[0] > 250 and item[1] > 250 and item[2] > 250 and item[3] == 255) :
                            newData.append((255, 255, 255, 0))
                        else:
                            newData.append(item)
                    pil_img.putdata(newData)

                    buffered = BytesIO()
                    pil_img.save(buffered, format="PNG")
                    base64_str = base64.b64encode(buffered.getvalue()).decode()
                else:
                    logging.warning(f"Could not create PIL image from bitmap for {shortcut.path}, possibly due to unknown bitmap format from icon_info.")

            else: # Pillow not available
                logging.warning("Pillow (PIL) not available, cannot convert icon to PNG. Returning None for icon.")
            
            return base64_str

        finally:
            # Release GDI resources
            if 'hdc_screen' in locals() and hdc_screen: win32gui.ReleaseDC(0, hdc_screen) # hdc_screen from GetDC(0)
            if 'mem_dc' in locals() and mem_dc: mem_dc.DeleteDC()
            if 'bitmap' in locals() and bitmap: win32gui.DeleteObject(bitmap.GetHandle())
            if 'icon_info' in locals() and icon_info:
                if icon_info.hbmColor: win32gui.DeleteObject(icon_info.hbmColor)
                if icon_info.hbmMask: win32gui.DeleteObject(icon_info.hbmMask)
            
            # Destroy all icons obtained from ExtractIconEx
            # Check if the handles are valid before trying to destroy
            if large_icons: 
                for h_icon in large_icons:
                    if h_icon:
                        try: destroy_icon_func(h_icon)
                        except pywintypes.error: pass # Icon might have already been destroyed or invalid
            if small_icons:
                for h_icon in small_icons:
                    if h_icon and (not large_icons or h_icon not in large_icons): # Avoid double destroy
                        try: destroy_icon_func(h_icon)
                        except pywintypes.error: pass


    except Exception as e: # Catch errors from ExtractIconEx or other operations
        # pywintypes.error is a common exception type from pywin32
        logging.error(f"Error extracting icon for {shortcut.path} (from {icon_path} idx {icon_index}): {e}")
        # Ensure any partially extracted icons are cleaned up if possible
        if large_icons and large_icons[0]: [destroy_icon_func(h) for h in large_icons if h]
        if small_icons and small_icons[0]: [destroy_icon_func(h) for h in small_icons if h and (not large_icons or h not in large_icons)]
        return None


def get_shortcut_info(shortcut_path):
    """获取快捷方式的信息"""
    try:
        with winshell.shortcut(shortcut_path) as shortcut:
            return {
                "name": os.path.splitext(os.path.basename(shortcut_path))[0],
                "path": shortcut.path,
                "arguments": shortcut.arguments,
                "description": shortcut.description,
                "icon_base64": get_icon_base64(shortcut), # Add icon data
            }
    except Exception as e:
        # Log specific error from winshell or general shortcut processing
        logging.error(f"Error processing shortcut file {shortcut_path}: {e}")
        return None


@app.route("/")
def index():
    """主页，展示快捷方式列表"""
    pythoncom.CoInitialize()  # 初始化 COM
    try:
        shortcuts_data = []
        for filename in os.listdir(DESKTOP_PATH):
            if filename.endswith(".lnk"):
                shortcut_path = os.path.join(DESKTOP_PATH, filename)
                info = get_shortcut_info(shortcut_path)
                if info:
                    info['category'] = classify_shortcut(info)
                    shortcuts_data.append(info)

        # Group shortcuts by category for the template
        grouped_shortcuts = {}
        for sc in shortcuts_data:
            cat = sc['category']
            if cat not in grouped_shortcuts:
                grouped_shortcuts[cat] = []
            grouped_shortcuts[cat].append(sc)
        
        # Sort categories, putting DEFAULT_CATEGORY last
        sorted_categories = sorted(grouped_shortcuts.keys(), key=lambda x: (x == DEFAULT_CATEGORY, x))
        
        # Create a list of tuples (category_name, list_of_shortcuts) for ordered iteration in template
        # Or pass grouped_shortcuts and handle sorting/ordering in template if preferred
        # For simplicity here, let's pass the grouped dictionary and the sorted keys separately
        # However, a list of (category, items) tuples is often easier for Jinja
        
        categorized_shortcuts_list = []
        for category_name in sorted_categories:
            categorized_shortcuts_list.append({
                "name": category_name,
                "shortcuts": grouped_shortcuts[category_name]
            })

        return render_template("index.html", categorized_shortcuts=categorized_shortcuts_list, default_category_name=DEFAULT_CATEGORY)
    finally:
        pythoncom.CoUninitialize()  # 释放 COM 资源


@app.route("/open_shortcut/<shortcut_name>")
def open_shortcut(shortcut_name):
    """打开快捷方式"""
    for filename in os.listdir(DESKTOP_PATH):
        if filename.startswith(shortcut_name) and filename.endswith(".lnk"):
            shortcut_path = os.path.join(DESKTOP_PATH, filename)
            try:
                # 使用 subprocess.Popen 代替 os.startfile
                subprocess.Popen(['start', '', shortcut_path], shell=True)
                logging.info(f"Successfully launched shortcut: {shortcut_path}")
                return jsonify({"status": "success", "message": f"Launched {os.path.basename(shortcut_path)}"})
            except Exception as e:
                logging.error(f"Error opening shortcut {shortcut_path}: {e}")
                return jsonify({"status": "error", "message": f"Failed to launch {os.path.basename(shortcut_path)}: {str(e)}"})
    logging.warning(f"Shortcut starting with '{shortcut_name}' not found in {DESKTOP_PATH}")
    return jsonify({"status": "error", "message": f"Shortcut '{shortcut_name}' not found."})


if __name__ == "__main__":
    app.run(debug=True)