@echo off
title INFY-POS MySQL Emergency Auto-Repair Tool
color 0C

echo ========================================================
echo       INFY-POS MySQL Emergency Auto-Repair Tool
echo ========================================================
echo.
echo Performing automated diagnosis and repair of XAMPP MySQL...
echo.

:: 1. Kill any zombie MySQL processes
echo [Step 1/4] Stopping zombie MySQL processes...
taskkill /f /im mysqld.exe >nul 2>&1

:: 2. Remove PID and Aria lock files
echo [Step 2/4] Clearing lock files (*.pid, aria_log*, ibtmp1)...
if exist "C:\xampp\mysql\data\*.pid" del /f /q "C:\xampp\mysql\data\*.pid" >nul 2>&1
if exist "C:\xampp\mysql\data\aria_log*" del /f /q "C:\xampp\mysql\data\aria_log*" >nul 2>&1
if exist "C:\xampp\mysql\data\ibtmp1" del /f /q "C:\xampp\mysql\data\ibtmp1" >nul 2>&1

:: 3. Reset corrupted log files safely and restore system tables
echo [Step 3/4] Resetting InnoDB crash log flags and restoring clean system tables...
if exist "C:\xampp\mysql\data\ib_logfile0" (
    ren "C:\xampp\mysql\data\ib_logfile0" "ib_logfile0.bak" >nul 2>&1
)
if exist "C:\xampp\mysql\data\ib_logfile1" (
    ren "C:\xampp\mysql\data\ib_logfile1" "ib_logfile1.bak" >nul 2>&1
)
if exist "C:\xampp\mysql\backup\mysql\*" (
    copy /y "C:\xampp\mysql\backup\mysql\*" "C:\xampp\mysql\data\mysql\" >nul 2>&1
)

:: 4. Restart MySQL Service cleanly
echo [Step 4/4] Restarting MySQL Engine (Port 3307)...
if exist "C:\xampp\mysql\bin\mysqld.exe" (
    powershell -WindowStyle Hidden -Command "Start-Process 'C:\xampp\mysql\bin\mysqld.exe' -ArgumentList '--defaults-file=C:\xampp\mysql\bin\my.ini', '--standalone' -WindowStyle Hidden"
    timeout /t 3 >nul
)

netstat -o -n -a | findstr ":3307" >nul

if %ERRORLEVEL% equ 0 (
    color 0A
    echo.
    echo ========================================================
    echo   [SUCCESS] MySQL Database repaired and online!
    echo   You can now launch INFY-POS normally.
    echo ========================================================
) else (
    echo.
    echo [WARNING] MySQL could not be auto-repaired. Please verify XAMPP Control Panel.
)

echo.
pause
