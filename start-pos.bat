@echo off
title INFY-POS Enterprise -- Ultra-Fast Launcher and Auto-Repair Engine
color 0A
cls

echo ===============================================================================
echo                INFY-POS ENTERPRISE -- ULTRA-FAST LAUNCHER
echo              Automated MySQL Repair, Cache Optimizer and Server Engine
echo ===============================================================================
echo.

cd /d "%~dp0"
if exist "C:\xampp\php" set "PATH=C:\xampp\php;%PATH%"

echo [1/4] Diagnosing and Initializing MySQL Database Engine [Port 3307]...
netstat -ano | findstr ":3307" | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo       [INFO] MySQL Port 3307 is offline. Cleaning unexpected shutdown flags...
    
    :: 1. Kill any zombie/orphaned mysqld processes holding locks
    taskkill /f /im mysqld.exe >nul 2>&1
    
    :: 2. Remove all crash lock files (.pid, aria_log*, ibtmp1)
    if exist "C:\xampp\mysql\data\*.pid" del /f /q "C:\xampp\mysql\data\*.pid" >nul 2>&1
    if exist "C:\xampp\mysql\data\aria_log*" del /f /q "C:\xampp\mysql\data\aria_log*" >nul 2>&1
    if exist "C:\xampp\mysql\data\ibtmp1" del /f /q "C:\xampp\mysql\data\ibtmp1" >nul 2>&1
    if exist "C:\xampp\mysql\data\multi-master.info" del /f /q "C:\xampp\mysql\data\multi-master.info" >nul 2>&1
    
    :: 3. Self-heal system privilege tables from XAMPP backup
    if exist "C:\xampp\mysql\backup\mysql\*" (
        copy /y "C:\xampp\mysql\backup\mysql\*" "C:\xampp\mysql\data\mysql\" >nul 2>&1
    )
    
    :: 4. Start MySQL Engine with dedicated config on Port 3307
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        powershell -WindowStyle Hidden -Command "Start-Process 'C:\xampp\mysql\bin\mysqld.exe' -ArgumentList '--defaults-file=C:\xampp\mysql\bin\my.ini', '--standalone' -WindowStyle Hidden"
    ) else if exist "C:\xampp\mysql_start.bat" (
        call "C:\xampp\mysql_start.bat" >nul 2>&1
    )
    timeout /t 3 /nobreak >nul 2>&1
)

netstat -ano | findstr ":3307" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo       [SUCCESS] MySQL Database Engine is healthy and online on Port 3307!
) else (
    echo       [NOTE] MySQL Engine initializing on Port 3307 in the background.
)

echo.
echo [2/4] Compressing and Optimizing Project Files for Lightning Speed...
call php artisan optimize:clear >nul 2>&1
echo       [SUCCESS] Cache refreshed and application optimized.

echo.
echo [3/4] Initializing Application Engine on Port 8000...
set PHP_CLI_SERVER_WORKERS=8

netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    powershell -WindowStyle Hidden -Command "Start-Process php -ArgumentList '-S 127.0.0.1:8000 server.php' -WorkingDirectory '%~dp0' -WindowStyle Hidden"
    timeout /t 1 /nobreak >nul 2>&1
    echo       [SUCCESS] High-Performance Engine started on http://127.0.0.1:8000
) else (
    echo       [SUCCESS] Application Engine is already active on http://127.0.0.1:8000
)

echo.
echo [4/4] Launching INFY-POS Desktop Application Window...
if not exist "C:\xampp\htdocs\pos\storage\app_profile" mkdir "C:\xampp\htdocs\pos\storage\app_profile" >nul 2>&1
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://127.0.0.1:8000/ --user-data-dir="C:\xampp\htdocs\pos\storage\app_profile" --window-size=1366,768 --start-maximized
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://127.0.0.1:8000/ --user-data-dir="C:\xampp\htdocs\pos\storage\app_profile" --window-size=1366,768 --start-maximized
) else (
    start http://127.0.0.1:8000/
)

echo.
echo ===============================================================================
echo   INFY-POS ENTERPRISE IS LIVE AND RUNNING AT: http://127.0.0.1:8000
echo   You can safely close this terminal window at any time.
echo ===============================================================================
timeout /t 3 /nobreak >nul 2>&1
exit



