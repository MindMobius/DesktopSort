import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// 暴露应用相关API
contextBridge.exposeInMainWorld('desktopSort', {
  scanDesktop: () => ipcRenderer.invoke('scan-desktop'),
  classifyApps: () => ipcRenderer.invoke('classify-apps'),
  getApps: () => ipcRenderer.invoke('get-apps'),
  getCategories: () => ipcRenderer.invoke('get-categories'),
  openApp: (appPath: string) => ipcRenderer.invoke('open-app', appPath),
  saveConfig: () => ipcRenderer.invoke('save-config'),
  resetConfig: () => ipcRenderer.invoke('reset-config'),
  getClassificationStatus: () => ipcRenderer.invoke('get-classification-status'),
})
