@echo off
title Create INFY-POS Desktop App Shortcut
color 0A
echo Creating INFY-POS Enterprise Desktop Shortcut...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0make-shortcut.ps1"
echo.
pause
