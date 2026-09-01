@echo off
:: ============================================================
:: INFY-POS Enterprise — Full Production Build Script
:: Compiles WPF desktop app + generates installer EXE
:: ============================================================
title INFY-POS Enterprise — Production Build
color 0A
cls

echo ============================================================
echo         INFY-POS Enterprise — Production Build
echo ============================================================
echo.

:: ── Configuration ───────────────────────────────────────────
set PROJECT_DIR=%~dp0INFY-POS-Desktop
set INSTALLER_DIR=%~dp0installer
set DIST_DIR=%~dp0dist

:: ── Detect .NET SDK ─────────────────────────────────────────
set "DOTNET=dotnet"
where dotnet >nul 2>&1
if %ERRORLEVEL% neq 0 (
    if exist "C:\Program Files\dotnet\dotnet.exe" (
        set "DOTNET=C:\Program Files\dotnet\dotnet.exe"
        set "PATH=C:\Program Files\dotnet;%PATH%"
    ) else (
        echo [ERROR] .NET SDK not found. Install from: https://dotnet.microsoft.com/download/dotnet/8.0
        pause
        exit /b 1
    )
)

:: ── Detect Inno Setup ISCC.exe ──────────────────────────────
set "ISCC_PATH="
if exist "C:\Program Files\Inno Setup 7\ISCC.exe" (
    set "ISCC_PATH=C:\Program Files\Inno Setup 7\ISCC.exe"
)
if "%ISCC_PATH%"=="" (
    if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
        set "ISCC_PATH=C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
    )
)
if "%ISCC_PATH%"=="" (
    if exist "C:\Program Files\Inno Setup 6\ISCC.exe" (
        set "ISCC_PATH=C:\Program Files\Inno Setup 6\ISCC.exe"
    )
)
if "%ISCC_PATH%"=="" (
    where ISCC.exe >nul 2>&1
    if %ERRORLEVEL% equ 0 set "ISCC_PATH=ISCC.exe"
)

if "%ISCC_PATH%"=="" (
    echo [ERROR] Inno Setup compiler (ISCC.exe) not found.
    echo         Download from: https://jrsoftware.org/isinfo.php
    pause
    exit /b 1
)

echo [Step 1/5] Build Environment Verified:
echo   - .NET SDK:    %DOTNET%
echo   - Inno Setup:  %ISCC_PATH%
echo.

:: ── Clean ───────────────────────────────────────────────────
echo [Step 2/5] Cleaning previous build artifacts...
if exist "%PROJECT_DIR%\publish" rmdir /s /q "%PROJECT_DIR%\publish"
if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"
mkdir "%DIST_DIR%"
echo [OK] Clean complete.
echo.

:: ── Restore NuGet packages ───────────────────────────────────
echo [Step 3/5] Restoring NuGet packages...
cd /d "%PROJECT_DIR%"
"%DOTNET%" restore
if %ERRORLEVEL% neq 0 (
    echo [ERROR] NuGet restore failed.
    pause
    exit /b 1
)
echo [OK] Packages restored.
echo.

:: ── Publish WPF EXE (Release, self-contained, single file) ──
echo [Step 4/5] Publishing INFY-POS Enterprise.exe (Release build)...
"%DOTNET%" publish ^
    --configuration Release ^
    --runtime win-x64 ^
    --self-contained true ^
    --output "%PROJECT_DIR%\publish" ^
    -p:PublishSingleFile=true ^
    -p:PublishReadyToRun=true ^
    -p:IncludeNativeLibrariesForSelfExtract=true ^
    -p:DebugType=None ^
    -p:DebugSymbols=false

if %ERRORLEVEL% neq 0 (
    echo [ERROR] .NET publish failed. Check build errors above.
    pause
    exit /b 1
)

echo [OK] WPF EXE published to: %PROJECT_DIR%\publish
echo.

:: ── Compile Inno Setup Installer ────────────────────────────
echo [Step 5/5] Compiling INFY-POS-Enterprise-Setup.exe...
cd /d "%INSTALLER_DIR%"
"%ISCC_PATH%" "INFY-POS-Setup.iss"

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Inno Setup compilation failed.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   BUILD COMPLETE!
echo   Output: %DIST_DIR%\INFY-POS-Enterprise-Setup.exe
echo ============================================================
echo.

pause
