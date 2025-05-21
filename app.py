import pythoncom
from flask import Flask, render_template, jsonify
import os
import winshell
import subprocess

app = Flask(__name__)

DESKTOP_PATH = os.path.join(os.path.expanduser("~"), "Desktop")


def get_shortcut_info(shortcut_path):
    """获取快捷方式的信息"""
    try:
        with winshell.shortcut(shortcut_path) as shortcut:
            return {
                "name": os.path.splitext(os.path.basename(shortcut_path))[0],
                "path": shortcut.path,
                "arguments": shortcut.arguments,
                "description": shortcut.description,
            }
    except Exception as e:
        print(f"Error getting info for {shortcut_path}: {e}")
        return None


@app.route("/")
def index():
    """主页，展示快捷方式列表"""
    pythoncom.CoInitialize()  # 初始化 COM
    try:
        shortcuts = []
        for filename in os.listdir(DESKTOP_PATH):
            if filename.endswith(".lnk"):
                shortcut_path = os.path.join(DESKTOP_PATH, filename)
                info = get_shortcut_info(shortcut_path)
                if info:
                    shortcuts.append(info)
        return render_template("index.html", shortcuts=shortcuts)
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
                return jsonify({"status": "success"})
            except Exception as e:
                print(f"Error opening {shortcut_path}: {e}")
                return jsonify({"status": "error", "message": str(e)})
    return jsonify({"status": "error", "message": "Shortcut not found"})


if __name__ == "__main__":
    app.run(debug=True)