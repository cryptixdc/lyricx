<div align="center">

# LYRICX

**Lyrics, reimagined.**

A beautiful, AI-themed lyric player for the desktop — built around **YouTube Music**.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![Platforms](https://img.shields.io/badge/Platforms-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](#download)
[![Version](https://img.shields.io/badge/version-1.0.0-7c3aed.svg)](../../releases/latest)

<br>

| [<img src="docs/assets/apple.svg" width="34" alt="macOS"><br>**macOS**<br><sub>Apple Silicon & Intel</sub>](../../releases/latest) | [<img src="docs/assets/windows.svg" width="32" alt="Windows"><br>**Windows**<br><sub>64-bit installer</sub>](../../releases/latest) | [<img src="docs/assets/linux.svg" width="34" alt="Linux"><br>**Linux**<br><sub>AppImage & .deb</sub>](../../releases/latest) |
|:---:|:---:|:---:|

**[Download the latest release →](../../releases/latest)** · **[Visit the download page →](../..)**

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

> **macOS tip:** the build is ad-hoc signed. If macOS blocks it, right-click the app → **Open** → **Open** again.

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

## 📁 Project layout

- `src/` — renderer: UI, visualizers, i18n, stores, services
- `electron/` — main process, native IPC, tray, updater
- `docs/` — GitHub Pages download site
- `.github/workflows/` — cross-platform release builds

## 📄 License

AGPL-3.0. See [LICENSE](LICENSE).

---

<div align="center">

Made with care for people who love lyrics.

**[⬇ Download LYRICX](../../releases/latest)**

</div>
