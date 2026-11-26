// LYRICX Visualizer desktop host — follows an external player through the local Now Playing service.
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

const WS_URL = process.env.LYRICX_VIS_WS_URL || 'ws://localhost:9863/api/ws/lyric';
const RECONNECT_MS = 2500;

let window = null;
let socket = null;
let reconnectTimer = null;
let stopped = false;
let status = 'connecting';
let snapshot = { title: '', artist: '', album: '', durationMs: 0, progressMs: 0, playing: false };

function log(...parts) {
    console.log('[Visualizer]', ...parts);
}

function send(channel, payload) {
    if (window && !window.isDestroyed()) window.webContents.send(channel, payload);
}

function setStatus(next) {
    status = next;
    send('vis:status', next);
}

function normalizeDuration(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    return numeric < 10000 ? Math.floor(numeric * 1000) : Math.floor(numeric);
}

function applyMessage(raw) {
    let payload;
    try {
        payload = JSON.parse(raw);
    } catch (error) {
        log('could not parse now-playing message', error && error.message);
        return;
    }

    const data = payload.data && typeof payload.data === 'object' ? payload.data : {};
    switch (payload.event) {
        case 'Track': {
            const title = typeof data.title === 'string' ? data.title.trim() : '';
            const artist = (typeof data.author === 'string' ? data.author : '').trim();
            const album = typeof data.album === 'string' ? data.album.trim() : '';
            if (!title && !artist) break;
            snapshot = {
                ...snapshot,
                title,
                artist,
                album,
                durationMs: normalizeDuration(data.duration)
            };
            break;
        }
        case 'PlayerPauseState': {
            const progress = Number(data.seekbarCurrentPosition);
            snapshot = {
                ...snapshot,
                playing: !Boolean(data.isPaused),
                progressMs: Number.isFinite(progress)
                    ? (progress <= snapshot.durationMs / 1000 + 1 ? Math.floor(progress * 1000) : Math.floor(progress))
                    : (Number(data.statePercent) > 0 && Number(data.statePercent) < 1
                        ? Math.floor(snapshot.durationMs * Number(data.statePercent))
                        : snapshot.progressMs)
            };
            break;
        }
        case 'PlayerProgress': {
            const progress = Number(data.progress);
            if (Number.isFinite(progress)) snapshot.progressMs = Math.max(0, Math.floor(progress));
            break;
        }
        case 'PlayerProgressReplay':
            snapshot.progressMs = 0;
            break;
        default:
            break;
    }
    send('vis:track', getTrack());
}

function connect() {
    if (stopped || socket) return;
    setStatus('connecting');
    try {
        socket = new WebSocket(WS_URL);
    } catch (error) {
        log('now-playing socket failed', error && error.message);
        scheduleReconnect();
        return;
    }
    socket.onopen = () => setStatus('connected');
    socket.onmessage = (event) => applyMessage(event.data);
    socket.onerror = () => setStatus('error');
    socket.onclose = () => {
        socket = null;
        if (!stopped) {
            setStatus('error');
            scheduleReconnect();
        }
    };
}

function scheduleReconnect() {
    if (reconnectTimer || stopped) return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
    }, RECONNECT_MS);
}

function getTrack() {
    return { ...snapshot, status };
}

async function fetchLyrics(query) {
    const artist = String((query && query.artist) || '').trim();
    const title = String((query && query.title) || '').trim();
    const album = String((query && query.album) || '').trim();
    if (!artist || !title) throw new Error('missing artist or title');
    const url = new URL('https://lrclib.net/api/get');
    url.searchParams.set('artist_name', artist);
    url.searchParams.set('track_name', title);
    if (album) url.searchParams.set('album_name', album);
    const response = await fetch(url, {
        headers: { 'User-Agent': 'LYRICX-Visualizer/1.0.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error('lyrics service returned ' + response.status);
    const body = await response.json();
    return {
        syncedLyrics: body.syncedLyrics || '',
        plainLyrics: body.plainLyrics || '',
        title: body.trackName || title,
        artist: body.artistName || artist
    };
}

function registerIpc() {
    ipcMain.handle('vis:get-track', () => getTrack());
    ipcMain.handle('vis:status', () => status);
    ipcMain.handle('vis:fetch-lyrics', (event, query) => fetchLyrics(query));
}

function createWindow() {
    window = new BrowserWindow({
        width: 1120,
        height: 860,
        minWidth: 420,
        minHeight: 560,
        backgroundColor: '#0b0b0f',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });
    window.setMenuBarVisibility(false);
    window.loadFile(path.join(__dirname, '..', '..', 'visualizer', 'index.html'));
    window.on('closed', () => { window = null; });
}

app.whenReady().then(() => {
    registerIpc();
    createWindow();
    connect();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    stopped = true;
    if (socket) socket.close();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (process.platform !== 'darwin') app.quit();
});
