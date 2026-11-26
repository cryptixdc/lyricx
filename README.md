<div align="center">

# LYRICX

**Lyrics, reimagined.**

A beautiful, AI-themed lyric player for the desktop — built around **YouTube Music**.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![Platforms](https://img.shields.io/badge/Platforms-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Android-lightgrey.svg)](#download)
[![Version](https://img.shields.io/badge/version-1.0.0-7c3aed.svg)](../../releases/latest)

<br>

| [<img src="docs/assets/apple.svg" width="34" alt="macOS"><br>**macOS**<br><sub>Apple Silicon & Intel</sub>](../../releases/latest) | [<img src="docs/assets/windows.svg" width="32" alt="Windows"><br>**Windows**<br><sub>64-bit installer</sub>](../../releases/latest) | [<img src="docs/assets/linux.svg" width="34" alt="Linux"><br>**Linux**<br><sub>AppImage & .deb</sub>](../../releases/latest) | [<img src="docs/assets/os/android.svg" width="30" alt="Android"><br>**Android**<br><sub>APK sideload</sub>](https://github.com/cryptixdc/lyricx/releases/download/v1.0.0/LYRICX-1.0.0-android.apk) |
|:---:|:---:|:---:|:---:|

**[Download the latest release →](../../releases/latest)** · **[Visit the website →](https://cryptixdc.github.io/)**

</div>

---

## ✨ What makes LYRICX special

- 🎵 **YouTube Music only** — a focused build with one clean source for music, lyrics, and playlists.
- 🎨 **20+ lyric animation styles** — from calm still frames to full motion-graphics PVs.
- 🌊 **Live audio visualizers** — shaders, fluid glow, and cover-driven colour themes.
- 🗣️ **Real multilingual support** — English, Malayalam, Indonesian, Vietnamese, with bundled fonts.
- 🧠 **AI themes & word segmentation** — optional, configurable, and local-friendly.
- 🪟 **Desktop lyrics** — a Chrome/OBS display window, wallpaper mode, and a system tray.
- 🌐 **Works offline** — every font and asset the interface needs ships with the app.

## 📥 Download

Grab the installer for your platform from the [latest release](../../releases/latest):

| Platform | File |
|---|---|
| Windows | `LYRICX-Setup-*.exe` |
| macOS (Apple Silicon) | `LYRICX-*-arm64.dmg` |
| macOS (Intel) | `LYRICX-*-x64.dmg` |
| Linux | `LYRICX-*.AppImage`, `*.deb` |
| Android | `LYRICX-*-android.apk` |

> **macOS tip:** the build is ad-hoc signed. If macOS blocks it, right-click the app → **Open** → **Open** again.

> **Android tip:** the APK is debug-signed. Allow installs from your browser or file manager, then install. Playback uses the official YouTube embed.

### Visualizer edition (Spotify)

A second, co-installable build that follows whatever is playing in Spotify and opens straight into the lyrics visualizer. The YouTube Music build above is unchanged.

| Platform | File |
|---|---|
| Windows | `LYRICX-VIS-Setup-1.0.0.exe` |
| macOS (Apple Silicon) | `LYRICX-VIS-1.0.0-arm64.dmg` |
| macOS (Intel) | `LYRICX-VIS-1.0.0-x64.dmg` |
| Linux | `LYRICX-VIS-1.0.0-linux-x86_64.AppImage`, `*.deb` |
| Android | `LYRICX-VIS-1.0.0-android.apk` |

Downloads live on the [Visualizer release](../../releases/tag/v1.0.0-visualizer) and on the [website](https://cryptixdc.github.io/download.html#visualizer).

- **Android:** grant notification access once; the app reads Spotify's media session in the background and uses playback timing for the visualizer (Android blocks cross-app audio capture).
- **Desktop:** follows Spotify through the local [Now Playing](https://github.com/Widdit/now-playing-service/) service, uses real loopback audio when a loopback input device exists, and otherwise follows playback timing. macOS loopback needs a virtual device such as BlackHole.
- **Lyrics:** fetched online from LRCLIB on every track change; there is no offline lyrics cache in this edition.

## 🛠️ Building from source

Requirements: Node.js 24+ (22 works in practice), npm, and the platform tooling for `electron-builder`.

```bash
git clone https://github.com/cryptixdc/lyricx.git
cd lyricx
npm install
$env:VITE_YTM_ONLY='true'   # PowerShell — use VITE_YTM_ONLY=true on macOS/Linux
npm run typecheck
npm run build
npx electron-builder --win --x64
```

The `VITE_YTM_ONLY=true` flag makes the build register only the YouTube Music provider.

To build the Visualizer edition instead:

```bash
# Desktop (plain HTML/CSS/JS — no renderer build needed)
npx electron-builder --config electron-builder.visualizer.yml --win --x64

# Android (copy the visualizer web assets, then build the flavor)
cp -R visualizer/. android/app/src/main/assets/public/
cd android && ./gradlew assembleVisualizerDebug
```

## 📁 Project layout

- `src/` — renderer: UI, visualizers, i18n, stores, services
- `electron/` — main process, native IPC, tray, updater
- `docs/` — four-page LYRICX website: home, music, about, download
- `visualizer/` — standalone Spotify Visualizer edition web UI
- `electron/visualizer/` — desktop host and preload for the Visualizer edition
- `android/app/src/visualizer/` — Android flavor: notification listener and native bridge
- `.github/workflows/` — cross-platform release builds

## 📄 License

AGPL-3.0. See [LICENSE](LICENSE).

---

<div align="center">

Made with care for people who love lyrics.

**[⬇ Download LYRICX](../../releases/latest)**

</div>
