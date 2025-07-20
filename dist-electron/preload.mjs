"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
});
electron.contextBridge.exposeInMainWorld("desktopSort", {
  scanDesktop: () => electron.ipcRenderer.invoke("scan-desktop"),
  classifyApps: () => electron.ipcRenderer.invoke("classify-apps"),
  getApps: () => electron.ipcRenderer.invoke("get-apps"),
  getCategories: () => electron.ipcRenderer.invoke("get-categories"),
  openApp: (appPath) => electron.ipcRenderer.invoke("open-app", appPath),
  saveConfig: () => electron.ipcRenderer.invoke("save-config"),
  resetConfig: () => electron.ipcRenderer.invoke("reset-config"),
  getClassificationStatus: () => electron.ipcRenderer.invoke("get-classification-status")
});
