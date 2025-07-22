import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { DesktopScanner } from './utils/desktopScanner'
import { AIClassifier } from './utils/aiClassifier'
import { ConfigManager } from './utils/configManager'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

// 初始化工具类
const desktopScanner = new DesktopScanner()
const aiClassifier = new AIClassifier()
const configManager = new ConfigManager()

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 700,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // 添加以下配置实现沉浸式体验
    frame: false,  // 移除窗口边框
    transparent: true, // 支持透明背景
    titleBarStyle: 'hidden', // 隐藏标题栏
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// 设置IPC通信
function setupIPC() {
  // 扫描桌面应用
  ipcMain.handle('scan-desktop', async () => {
    const apps = await desktopScanner.scanDesktop()
    configManager.saveApps(apps)
    return apps
  })

  // AI分类应用
  ipcMain.handle('classify-apps', async () => {
    const apps = configManager.getApps()
    const appNames = apps.map(app => app.name)
    const result = await aiClassifier.classifyApps(appNames)
    configManager.saveCategories(result.categories)
    
    // 更新应用的分类信息
    const updatedApps = apps.map(app => {
      for (const [category, appsInCategory] of Object.entries(result.categories)) {
        if (appsInCategory.includes(app.name)) {
          app.category = category
          break
        }
      }
      return app
    })
    
    configManager.saveApps(updatedApps)
    return {
      apps: updatedApps,
      categories: result.categories
    }
  })

  // 获取应用信息
  ipcMain.handle('get-apps', () => {
    return configManager.getApps()
  })

  // 获取分类信息
  ipcMain.handle('get-categories', () => {
    return configManager.getCategories()
  })

  // 打开应用
  ipcMain.handle('open-app', (_, appPath) => {
    shell.openPath(appPath)
    configManager.incrementAppOpenCount(appPath)
    return true
  })

  // 保存配置
  ipcMain.handle('save-config', () => {
    return true // 配置已经在其他操作中保存
  })

  // 重置配置
  ipcMain.handle('reset-config', () => {
    configManager.resetConfig()
    return true
  })

  // 获取AI分类状态
  ipcMain.handle('get-classification-status', () => {
    return aiClassifier.isInProgress();
  });

  // 添加窗口控制功能
  ipcMain.on('minimize-window', () => {
    if (win) win.minimize();
  });
  
  ipcMain.on('maximize-window', () => {
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });
  
  ipcMain.on('close-window', () => {
    if (win) win.close();
  });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  setupIPC()
  createWindow()
})
