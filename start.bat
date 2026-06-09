@echo off
REM ============================================================
REM  Flight Tracker - one-click local launcher (Windows)
REM  Double-click this file to install deps and start the app.
REM ============================================================
setlocal
cd /d "%~dp0"

echo(
echo ==================================================
echo    Flight Tracker - starting up
echo ==================================================
echo(

REM --- Check Node.js is installed ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Install the LTS version from https://nodejs.org
  echo then double-click this file again.
  echo(
  pause
  exit /b 1
)

REM --- Enable pnpm (ships with Node via corepack) ---
call corepack enable >nul 2>nul

REM --- Install dependencies (fast if already installed) ---
echo Installing dependencies (the first run can take a few minutes)...
call pnpm install
if errorlevel 1 (
  echo(
  echo [ERROR] "pnpm install" failed - see the messages above.
  pause
  exit /b 1
)

echo(
echo ==================================================
echo    Opening http://localhost:5173/ in your browser
echo    Control panel: http://localhost:5173/control.html
echo(
echo    Leave this window OPEN while you use it.
echo    Press Ctrl+C here (then Y) to stop.
echo ==================================================
echo(

REM --- Open the browser a few seconds after the server boots ---
start "" /min cmd /c "timeout /t 8 >nul && explorer http://localhost:5173/"

REM --- Run the dev servers (UI + data) in this window ---
call pnpm dev

echo(
echo Flight Tracker has stopped.
pause
