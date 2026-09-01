@echo off
title Starting POS System
color 0A
echo ========================================================
echo             POS System Server Launcher
echo ========================================================
echo.
cd /d "c:\xampp\htdocs\pos"

echo Opening browser at http://127.0.0.1:8000 ...
start "" "http://127.0.0.1:8000/#/app/products/create"

echo.
echo Starting Laravel Server on Port 8000...
echo (Keep this window open while using the application)
echo.

c:\xampp\php\php.exe artisan serve --port=8000

pause
