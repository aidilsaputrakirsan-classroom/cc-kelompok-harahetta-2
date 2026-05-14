@echo off
setlocal

:: Pastikan dijalankan sebagai administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Meminta hak administrator...
    powershell -Command "Start-Process '%~f0' -Verb runAs"
    exit /b
)

set "URL=https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
set "DEST=C:\Windows\System32\cloudflared.exe"
set "TEMPFILE=%TEMP%\cloudflared.exe"

echo ==============================
echo   Install Cloudflared
echo ==============================
echo.
echo Mengunduh cloudflared...

powershell -NoProfile -Command "try { Invoke-WebRequest -Uri '%URL%' -OutFile '%TEMPFILE%' -UseBasicParsing -ErrorAction Stop } catch { Write-Error 'Download gagal'; exit 1 }"

if %errorlevel% neq 0 (
    echo Gagal mengunduh cloudflared.
    pause
    exit /b 1
)

echo Memindahkan file ke %DEST% ...
move /y "%TEMPFILE%" "%DEST%" >nul 2>&1
if %errorlevel% neq 0 (
    echo Gagal memindahkan file ke %DEST%.
    pause
    exit /b 1
)

echo Memastikan C:\Windows\System32 ada di PATH sistem...
powershell -NoProfile -Command "$p = [Environment]::GetEnvironmentVariable('Path','Machine'); if ($p -notlike '*C:\Windows\System32*') { [Environment]::SetEnvironmentVariable('Path', $p + ';C:\Windows\System32', 'Machine') }"

if %errorlevel% neq 0 (
    echo Gagal mengupdate PATH sistem.
    pause
    exit /b 1
)

echo.
echo cloudflared berhasil diinstal ke %DEST%.
echo Restart session atau buka ulang command prompt untuk memakai PATH terbaru.
echo.
pause
endlocal
