@echo off
REM ============================================================
REM  Flight Tracker - one-click local launcher (Windows)
REM  Double-click this file to install deps and start the app.
REM ============================================================
setlocal
cd /d "%~dp0"

REM Don't let corepack stop to ask permission to download pnpm.
set COREPACK_ENABLE_DOWNLOAD_PROMPT=0

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
for /f "delims=" %%v in ('node --version') do echo Using Node %%v

REM --- Make sure pnpm is available (via corepack, with fallbacks) ---
call corepack enable
call corepack prepare pnpm@10.28.2 --activate

where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm not on PATH yet - installing it globally as a fallback...
  call npm install -g pnpm
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo(
  echo [ERROR] Could not set up pnpm.
  echo Try running this command once in an ADMINISTRATOR Command Prompt:
  echo     corepack enable
  echo then double-click this file again.
  echo(
  pause
  exit /b 1
)
for /f "delims=" %%v in ('pnpm --version') do echo Using pnpm %%v

REM --- Install dependencies, logging everything to install-log.txt ---
echo(
echo Installing dependencies (the first run can take a few minutes)...
call pnpm install > install-log.txt 2>&1
if errorlevel 1 (
  echo(
  echo [ERROR] "pnpm install" failed.
  echo The full output was saved to:  %cd%\install-log.txt
  echo Please share that file. Last lines:
  echo --------------------------------------------------
  powershell -NoProfile -Command "Get-Content install-log.txt -Tail 25"
  echo --------------------------------------------------
  pause
  exit /b 1
)
echo Dependencies installed.

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
