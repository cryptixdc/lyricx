<div align="center">

# LYRICX

**Lyrics, reimagined.**

A focused desktop and Android music experience built around **YouTube Music**, plus a separate Spotify-driven visualizer edition that follows whatever is playing in the background.

Website: **[https://lyricxy.github.io/](https://lyricxy.github.io/)** · Organization: **[lyricxy](https://github.com/lyricxy)**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![Platforms](https://img.shields.io/badge/Platforms-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Android-lightgrey.svg)](#download)
[![Version](https://img.shields.io/badge/version-1.0.0-7c3aed.svg)](../../releases/latest)
[![Website](https://img.shields.io/badge/website-lyricxy.github.io-7c3aed.svg)](https://lyricxy.github.io/)

<br>

| [<img src="docs/assets/apple.svg" width="34" alt="macOS"><br>**macOS**<br><sub>Apple Silicon & Intel</sub>](../../releases/latest) | [<img src="docs/assets/windows.svg" width="32" alt="Windows"><br>**Windows**<br><sub>64-bit installer</sub>](../../releases/latest) | [<img src="docs/assets/linux.svg" width="34" alt="Linux"><br>**Linux**<br><sub>AppImage & .deb</sub>](../../releases/latest) | [<img src="docs/assets/os/android.svg" width="30" alt="Android"><br>**Android**<br><sub>APK sideload</sub>](https://github.com/cryptixdc/lyricx/releases/download/v1.0.0/LYRICX-1.0.0-android.apk) |
|:---:|:---:|:---:|:---:|

**[Download the latest release →](../../releases/latest)** · **[Visit the website →](https://lyricxy.github.io/)**

</div>

---

## What is LYRICX?

LYRICX is a music player and lyric visualizer with two independent builds:

| Edition | Music source | What it does |
|---|---|---|
| **LYRICX** | YouTube Music only | Search, play, and follow lyrics with animated visualizers, themes, and desktop extras. |
| **LYRICX Visualizer** | Spotify (background playback) | Follows the current Spotify track and opens straight into a lyrics visualizer. |

Both editions are version **1.0.0**, are open source under **AGPL-3.0**, and can be installed side by side on Android.

## Highlights

- 🎵 **YouTube Music only** — the main build keeps one clean source for music, lyrics, and playlists.
- 🎨 **20+ lyric animation styles** — from calm still frames to full motion-graphics presentations.
- 🌊 **Live audio visualizers** — shaders, fluid glow, and cover-driven colour themes.
- 🗣️ **Multilingual interface and fonts** — English, Malayalam, Indonesian, and Vietnamese.
- 🧠 **AI themes and word segmentation** — optional and local-friendly.
- 🪟 **Desktop lyrics** — Chrome/OBS display window, wallpaper mode, and a system tray.
- 📱 **Dedicated Android apps** — the YouTube Music player and the Spotify visualizer are native Capacitor apps, not wrapped desktop windows.
- 🌐 **Works offline** — the main build ships the fonts and assets it needs.
- 🔄 **Continuous delivery** — CI builds desktop and Android installers directly into GitHub Releases.

## Download

### YouTube Music edition

Installers are published on the [v1.0.0 release](../../releases/latest):

| Platform | File |
|---|---|
| Windows | `LYRICX-Setup-1.0.0.exe` |
| macOS (Apple Silicon) | `LYRICX-1.0.0-arm64.dmg` |
| macOS (Intel) | `LYRICX-1.0.0-x64.dmg` |
| Linux | `LYRICX-1.0.0-linux-x86_64.AppImage`, `LYRICX-1.0.0-linux-amd64.deb` |
| Android | `LYRICX-1.0.0-android.apk` |

> **macOS tip:** the build is ad-hoc signed. If macOS blocks it, right-click the app → **Open** → **Open** again.

> **Android tip:** the APK is debug-signed. Allow installs from your browser or file manager, then install. Playback uses the official YouTube embed. Requires Android 8.0 or newer.

### Visualizer edition (Spotify)

A separate, co-installable build that follows whatever is playing in Spotify and opens directly into the lyrics visualizer. The YouTube Music build above is unchanged.

| Platform | File |
|---|---|
| Windows | `LYRICX-VIS-Setup-1.0.0.exe` |
| macOS (Apple Silicon) | `LYRICX-VIS-1.0.0-arm64.dmg` |
| macOS (Intel) | `LYRICX-VIS-1.0.0-x64.dmg` |
| Linux | `LYRICX-VIS-1.0.0-linux-x86_64.AppImage`, `LYRICX-VIS-1.0.0-linux-amd64.deb` |
| Android | `LYRICX-VIS-1.0.0-android.apk` |

Get them from the [Visualizer release](../../releases/tag/v1.0.0-visualizer) or the [download page](https://lyricxy.github.io/download.html#visualizer).

- **Android:** grant notification access once. A native media-session listener reads Spotify's track metadata; the visualizer follows playback timing because Android does not allow one app to capture another app's audio.
- **Desktop:** follows Spotify through the local [Now Playing](https://github.com/Widdit/now-playing-service/) service (`ws://localhost:9863/api/ws/lyric`). When a loopback input device exists, the visualizer uses real system audio; otherwise it follows playback timing. macOS loopback needs a virtual device such as BlackHole.
- **Lyrics:** looked up online from LRCLIB on every track change. This edition has no offline lyrics cache.
- **Languages:** English, Malayalam, Simplified Chinese, and Indonesian.

## Website

The four-page site lives at **[https://lyricxy.github.io/](https://lyricxy.github.io/)**:

| Page | URL |
|---|---|
| Home | https://lyricxy.github.io/ |
| Music | https://lyricxy.github.io/music.html |
| About | https://lyricxy.github.io/about.html |
| Download | https://lyricxy.github.io/download.html |

It is a static site with a shared retro arcade design system, a light/dark switch, twelve curated English tracks with official artwork, and separate download sections for both editions. The old `/lyricx/` address redirects to the new home.

## Building from source

Requirements: **Node.js 24+**, npm, and the platform tooling used by `electron-builder`. Android builds also need JDK 21 and the Android SDK.

```bash
git clone https://github.com/cryptixdc/lyricx.git
cd lyricx
npm install
$env:VITE_YTM_ONLY='true'   # PowerShell — use VITE_YTM_ONLY=true on macOS/Linux
npm run typecheck
npm run test:unit
npm run build
npx electron-builder --win --x64
```

`VITE_YTM_ONLY=true` registers only the YouTube Music provider.

Visualizer edition:

```bash
# Desktop — plain HTML/CSS/JS, no renderer build required
npx electron-builder --config electron-builder.visualizer.yml --win --x64 --publish never

# Android — in a separate checkout: this replaces the YTM web assets in place
cp -R visualizer/. android/app/src/main/assets/public/
cd android && ./gradlew assembleVisualizerDebug
```

Useful checks:

```bash
npm run typecheck
npm run dedicatus
npm run test:unit
```

## Release automation

| Workflow | Output |
|---|---|
| `.github/workflows/release.yml` | YouTube Music desktop installers for Windows, macOS (x64/arm64), and Linux |
| `.github/workflows/android.yml` | YouTube Music Android APK (`assembleYtmDebug`) |
| `.github/workflows/visualizer-release.yml` | Visualizer desktop installers and Android APK (`assembleVisualizerDebug`) |

All three publish assets into the `cryptixdc/lyricx` GitHub Releases.

## Project layout

- `src/` — renderer: UI, visualizers, i18n, stores, and services
- `electron/` — desktop main process, native IPC, tray, and updater
- `electron/visualizer/` — desktop host and preload for the Visualizer edition
- `visualizer/` — standalone Visualizer edition web UI
- `mobile/` — YouTube Music Android web UI
- `android/app/src/main/java/.../` — YouTube Music native HTTP bridge
- `android/app/src/visualizer/` — Visualizer flavor: notification listener and native bridge
- `android/app/src/ytm/` — YouTube Music flavor entry point
- `docs/` — four-page LYRICX website
- `.github/workflows/` — release automation

## Troubleshooting

- **macOS says the app is damaged:** right-click → **Open** → **Open** again. The build is ad-hoc signed.
- **Android blocks the APK:** allow installs from your browser or file manager, then choose **More details → Install anyway**.
- **Visualizer shows no track on desktop:** install and start the local Now Playing service; the app reads `ws://localhost:9863/api/ws/lyric`.
- **Visualizer bars are timing-driven:** no loopback input device was found. Add a virtual loopback device for real system audio.
- **Visualizer has no lyrics:** LRCLIB has no synced entry for that exact title/artist, or the network is unavailable. Tap **Refresh lyrics** to retry.

## Credits

Developer: **Aaron**.

LYRICX is built and maintained for people who love lyrics and music discovery.

## License

[AGPL-3.0](LICENSE). See the license file for the full terms.

---

<div align="center">

Made with care for people who love lyrics.

**[⬇ Download LYRICX](../../releases/latest)** · **[🌐 Visit the website](https://lyricxy.github.io/)**

</div>
