@echo off
chcp 65001 >nul
title LYRICX - Open Display in Chrome
set "EXE=%~dp0release\win-unpacked\LYRICX.exe"
set "URL=http://127.0.0.1:32108/obs?obs=1&token=lyricx-display"
echo Starting LYRICX...
start "" "%EXE%"
echo Waiting for the display server...
:waitloop
powershell -NoProfile -Command "try { (New-Object Net.Sockets.TcpClient).Connect('127.0.0.1',32108); exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 goto ready
timeout /t 1 /nobreak >nul
goto waitloop
:ready
echo Opening the lyrics display in Chrome...
start chrome "%URL%"
echo Done. The display follows whatever plays in LYRICX.
timeout /t 3 /nobreak >nul
