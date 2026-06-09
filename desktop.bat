@echo off
REM ============================================================
REM  Flight Tracker - desktop app launcher (Windows)
REM  Double-click to install deps, build the UI, and open the
REM  native app window.
REM ============================================================
setlocal
cd /d "%~dp0"
set COREPACK_ENABLE_DOWNLOAD_PROMPT=0

echo(
echo ==================================================
echo    Flight Tracker - desktop app
echo ==================================================
echo(

REM --- Check Node.js ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Install the LTS version from https://nodejs.org then run this again.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do echo Using Node %%v

REM --- Ensure pnpm is available (corepack, with a global fallback) ---
call corepack enable
call corepack prepare pnpm@10.28.2 --activate
where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm not on PATH yet - installing it globally...
  call npm install -g pnpm
)
where pnpm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Could not set up pnpm. Run "corepack enable" in an admin prompt, then retry.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('pnpm --version') do echo Using pnpm %%v

REM --- Install project deps + build the web UI ---
echo(
echo Installing dependencies and building the UI...
call pnpm install
if errorlevel 1 ( echo [ERROR] pnpm install failed. & pause & exit /b 1 )
call pnpm build
if errorlevel 1 ( echo [ERROR] web build failed. & pause & exit /b 1 )

REM --- Install Electron + launch the app ---
echo(
echo Installing Electron (first run downloads ~100 MB)...
cd desktop
call npm install
if errorlevel 1 ( echo [ERROR] Electron install failed. & pause & exit /b 1 )

echo(
echo Launching the desktop app... (leave this window open; close the app window to quit)
call npm start

pause
