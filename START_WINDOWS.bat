@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
 echo Run SETUP_WINDOWS.bat first.
 pause
 exit /b 1
)
if not exist dist\client\index.html (
 call npm run build
 if errorlevel 1 goto :failed
)
echo.
echo Open http://localhost:4000 when the server says it is ready.
echo Keep this window open. Press Ctrl+C to stop.
echo.
call npm start
if errorlevel 1 goto :failed
exit /b 0
:failed
echo See docs/TROUBLESHOOTING.md for help.
pause
exit /b 1
