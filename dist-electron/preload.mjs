"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("desktopSort", {
  ipcRenderer: {
    on: (channel, callback) => {
      electron.ipcRenderer.on(channel, (_, ...args) => callback(...args));
    },
    off: (channel, callback) => {
      electron.ipcRenderer.removeListener(channel, callback);
    },
    send: (channel, ...args) => {
      electron.ipcRenderer.send(channel, ...args);
    },
    invoke: (channel, ...args) => {
      return electron.ipcRenderer.invoke(channel, ...args);
    }
  },
  scanDesktop: () => electron.ipcRenderer.invoke("scan-desktop"),
  classifyApps: () => electron.ipcRenderer.invoke("classify-apps"),
  getApps: () => electron.ipcRenderer.invoke("get-apps"),
  getCategories: () => electron.ipcRenderer.invoke("get-categories"),
  openApp: (path) => electron.ipcRenderer.invoke("open-app", path),
  saveConfig: () => electron.ipcRenderer.invoke("save-config"),
  resetConfig: () => electron.ipcRenderer.invoke("reset-config"),
  getClassificationStatus: () => electron.ipcRenderer.invoke("get-classification-status"),
  minimizeWindow: () => electron.ipcRenderer.send("minimize-window"),
  maximizeWindow: () => electron.ipcRenderer.send("maximize-window"),
  closeWindow: () => electron.ipcRenderer.send("close-window")
});
