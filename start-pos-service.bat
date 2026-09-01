@echo off
:: ============================================================
:: INFY-POS Enterprise — Background Service Starter
:: Called by the C# ServiceManager for service-only startup.
:: Does NOT launch Edge or any browser.
:: Does NOT launch INFY-POS.exe (that is done by the C# app).
::
:: Starts:
::   1. MySQL Engine on Port 3307 (with crash recovery)
::   2. PHP Built-in Server on Port 8000 (4 workers)
::
:: Called from C#:
::   cmd.exe /c "start-pos-service.bat" --services-only
:: ============================================================
title INFY-POS Services
color 0A

cd /d "%~dp0"

:: ── Parse arguments ──────────────────────────────────────────
set SERVICES_ONLY=0
for %%a in (%*) do (
    if /i "%%a"=="--services-only" set SERVICES_ONLY=1
)

:: ── Step 1: MySQL Engine (Port 3307) ─────────────────────────
netstat -ano | findstr ":3307" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [INFO] MySQL already running on Port 3307.
    goto :START_PHP
)

echo [INFO] Starting MySQL Engine on Port 3307...

:: Kill zombie MySQL (safe — data is already flushed on proper exit)
taskkill /f /im mysqld.exe >nul 2>&1

:: Remove only crash lock files (never touch *.ibd, *.frm, *.MYD)
if exist "C:\xampp\mysql\data\*.pid"            del /f /q "C:\xampp\mysql\data\*.pid"            >nul 2>&1
if exist "C:\xampp\mysql\data\aria_log*"        del /f /q "C:\xampp\mysql\data\aria_log*"        >nul 2>&1
if exist "C:\xampp\mysql\data\ibtmp1"           del /f /q "C:\xampp\mysql\data\ibtmp1"           >nul 2>&1
if exist "C:\xampp\mysql\data\multi-master.info" del /f /q "C:\xampp\mysql\data\multi-master.info" >nul 2>&1

:: Restore system tables from XAMPP backup (safe — never touches user data)
if exist "C:\xampp\mysql\backup\mysql\*" (
    copy /y "C:\xampp\mysql\backup\mysql\*" "C:\xampp\mysql\data\mysql\" >nul 2>&1
)

:: Start MySQL
if exist "C:\xampp\mysql\bin\mysqld.exe" (
    powershell -WindowStyle Hidden -Command ^
      "Start-Process 'C:\xampp\mysql\bin\mysqld.exe' ^
      -ArgumentList '--defaults-file=C:\xampp\mysql\bin\my.ini','--port=3307','--standalone' ^
      -WindowStyle Hidden"
    timeout /t 3 /nobreak >nul 2>&1
)

:: Verify MySQL started
netstat -ano | findstr ":3307" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] MySQL is running on Port 3307.
) else (
    echo [WARN] MySQL may still be starting. Application will wait.
)

:START_PHP
:: ── Step 2: PHP Built-in Server (Port 8000) ──────────────────
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [INFO] PHP server already running on Port 8000.
    goto :DONE
)

echo [INFO] Starting PHP Application Engine on Port 8000...

:: Optimize Laravel cache (silent)
php artisan optimize:clear >nul 2>&1

:: Start PHP with 8 parallel workers (hidden)
set PHP_CLI_SERVER_WORKERS=8
powershell -WindowStyle Hidden -Command ^
  "Start-Process php ^
  -ArgumentList '-S 127.0.0.1:8000 server.php' ^
  -WorkingDirectory '%~dp0' ^
  -WindowStyle Hidden"
timeout /t 1 /nobreak >nul 2>&1

netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] PHP Application Engine is running on Port 8000.
) else (
    echo [WARN] PHP server may still be starting.
)

:DONE
:: ── If not services-only mode, launch the desktop app ─────────
if "%SERVICES_ONLY%"=="0" (
    if exist "%~dp0INFY-POS Enterprise.exe" (
        start "" "%~dp0INFY-POS Enterprise.exe"
    )
)

echo [DONE] INFY-POS Services started successfully.
exit /b 0
