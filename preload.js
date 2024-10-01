// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose une API sécurisée à votre processus de rendu
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer,
});
