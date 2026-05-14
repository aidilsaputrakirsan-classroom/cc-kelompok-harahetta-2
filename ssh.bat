@echo off
:: Check for admin rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Meminta hak administrator...
    powershell -Command "Start-Process '%~f0' -Verb runAs"
    exit /b
)

setlocal

echo ===================================
echo   Sistem Informasi ITK  SSH LOGIN
echo ===================================
echo.

set /p "SSHUSER=Masukkan username SSH: "
if "%SSHUSER%"=="" (
    echo Username tidak boleh kosong.
    pause
    exit /b 1
)

echo.
echo Connecting as %SSHUSER% ...
echo.

ssh -o ProxyCommand="C:\Windows\System32\cloudflared.exe access ssh --hostname secretsshsiitk.akhzafachrozy.my.id" %SSHUSER%@localhost

echo.
echo Connection closed.
pause
endlocal
