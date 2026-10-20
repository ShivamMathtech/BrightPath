@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Install Node.js 24.x from https://nodejs.org then reopen this script.
 pause
 exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])!==24){console.error('Node.js 24.x is required.');process.exit(1)}"
if errorlevel 1 goto :failed
call npm ci --no-audit --no-fund
if errorlevel 1 goto :failed
call npm run setup
if errorlevel 1 goto :failed
call npm run build
if errorlevel 1 goto :failed
echo.
echo Setup complete. Double-click START_WINDOWS.bat to run BrightPath.
pause
exit /b 0
:failed
echo.
echo Setup did not complete. Read the error above and docs/TROUBLESHOOTING.md.
pause
exit /b 1
