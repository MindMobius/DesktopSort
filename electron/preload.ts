import { contextBridge, ipcRenderer } from 'electron'

// 暴露 ipcRenderer 给渲染进程
contextBridge.exposeInMainWorld('desktopSort', {
  ipcRenderer: {
    on: (channel: string, callback: Function) => {
      ipcRenderer.on(channel, (_, ...args) => callback(...args))
    },
    off: (channel: string, callback: Function) => {
      ipcRenderer.removeListener(channel, callback as any)
    },
    send: (channel: string, ...args: any[]) => {
      ipcRenderer.send(channel, ...args)
    },
    invoke: (channel: string, ...args: any[]) => {
      return ipcRenderer.invoke(channel, ...args)
    }
  },
  scanDesktop: () => ipcRenderer.invoke('scan-desktop'),
  classifyApps: () => ipcRenderer.invoke('classify-apps'),
  getApps: () => ipcRenderer.invoke('get-apps'),
  getCategories: () => ipcRenderer.invoke('get-categories'),
  openApp: (path: string) => ipcRenderer.invoke('open-app', path),
  saveConfig: () => ipcRenderer.invoke('save-config'),
  resetConfig: () => ipcRenderer.invoke('reset-config'),
  getClassificationStatus: () => ipcRenderer.invoke('get-classification-status'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
})
