@echo off
title Tex
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [Error] Node.js not found. Please install Node.js 18+ first: https://nodejs.org
  pause
  exit /b 1
)

rem ---- STOP branch: server running on port 3210 -> kill it ----
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3210" ^| findstr "LISTENING"') do (
  echo Tex is running. Stopping...
  taskkill /pid %%a /t /f >nul 2>nul
  echo Stopped. The launcher cleans itself up within ~15 seconds.
  ping -n 3 127.0.0.1 >nul
  exit /b 0
)

rem ---- START branch ----
if not exist node_modules (
  echo First run, installing dependencies, please wait...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo [Error] npm install failed. Please check your network and try again.
    pause
    exit /b 1
  )
)

echo Starting Tex server...
start "Tex Server" /min cmd /c node launcher.cjs

echo Waiting for server, up to 120s...
set /a n=0
:wait
curl -s http://localhost:3210/ 2>nul | findstr /c:"main.tsx" >nul
if not errorlevel 1 goto ready
set /a n+=1
if %n% GEQ 120 goto timeout
ping -n 2 127.0.0.1 >nul
goto wait

:timeout
echo [Error] Server not ready in 120s. Check the minimized "Tex Server" window for errors.
pause
exit /b 1

:ready
start "" "http://localhost:3210/"
echo.
echo ============================================
echo  Tex is running. Browser opened.
echo.
echo  - Close the browser page and the server
echo    stops itself within ~15 seconds.
echo  - Double-click this file again to stop now.
echo ============================================
ping -n 6 127.0.0.1 >nul
exit /b 0
