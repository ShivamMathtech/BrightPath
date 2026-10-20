@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
 echo Run SETUP_WINDOWS.bat first.
 pause
 exit /b 1
)
echo Open http://localhost:5173. Keep this window open.
call npm run dev
pause
