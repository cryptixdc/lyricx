// LYRICX Visualizer preload — the narrow renderer-to-main bridge for now-playing and lyrics.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('visualizerBridge', {
    getTrack: () => ipcRenderer.invoke('vis:get-track'),
    getStatus: () => ipcRenderer.invoke('vis:status'),
    fetchLyrics: (query) => ipcRenderer.invoke('vis:fetch-lyrics', query),
    onTrack: (callback) => {
        ipcRenderer.on('vis:track', (event, payload) => callback(payload));
    },
    onStatus: (callback) => {
        ipcRenderer.on('vis:status', (event, payload) => callback(payload));
    }
});
