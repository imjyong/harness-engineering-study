const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listDocuments: () => ipcRenderer.invoke('documents:list'),
  readDocument: (name) => ipcRenderer.invoke('documents:read', name),
  askQuestion: (question) => ipcRenderer.invoke('qa:ask', question),
});
