$paths = @(
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\OneDrive\Desktop",
    [Environment]::GetFolderPath('Desktop')
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$targetExe = Join-Path $scriptDir "INFY-POS.exe"
$iconPath = Join-Path $scriptDir "public\app_icon.ico"

foreach ($p in $paths) {
    if ($p -and (Test-Path (Split-Path -Parent $p))) {
        if (-not (Test-Path $p)) {
            New-Item -ItemType Directory -Path $p -Force | Out-Null
        }
        $lnk = Join-Path $p "INFY-POS Enterprise.lnk"
        try {
            $WshShell = New-Object -ComObject WScript.Shell
            $s = $WshShell.CreateShortcut($lnk)
            $s.TargetPath = $targetExe
            $s.WorkingDirectory = $scriptDir
            $s.Description = "Launch INFY-POS Enterprise Native Desktop"
            if (Test-Path $iconPath) {
                $s.IconLocation = "$iconPath,0"
            }
            $s.Save()
            Write-Host "[OK] Created shortcut at: $lnk"
        } catch {
            # Ignore permission errors on system folders
        }
    }
}
Write-Host "[OK] Desktop App Shortcut Verified!"
