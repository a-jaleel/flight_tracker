#!/bin/bash
# ============================================================
#  Flight Tracker - one-click local launcher (macOS / Linux)
#  Double-click this file (macOS) or run ./start.command
#  Opens the app in your default web browser.
# ============================================================
cd "$(dirname "$0")" || exit 1
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

echo
echo "=================================================="
echo "   Flight Tracker - starting up"
echo "=================================================="
echo

# --- Check Node.js ---
if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js was not found."
  echo "Install the LTS version from https://nodejs.org then run this again."
  read -n 1 -s -r -p "Press any key to close..."
  exit 1
fi
echo "Using Node $(node --version)"

# --- Ensure pnpm is available (corepack, with a global fallback) ---
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1
  corepack prepare pnpm@10.28.2 --activate >/dev/null 2>&1
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "Installing pnpm globally..."
  npm install -g pnpm
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "[ERROR] Could not set up pnpm. Try:  sudo corepack enable"
  read -n 1 -s -r -p "Press any key to close..."
  exit 1
fi
echo "Using pnpm $(pnpm --version)"

# --- Install dependencies ---
echo
echo "Installing dependencies (the first run can take a few minutes)..."
if ! pnpm install; then
  echo "[ERROR] pnpm install failed - see the messages above."
  read -n 1 -s -r -p "Press any key to close..."
  exit 1
fi

echo
echo "=================================================="
echo "   Opening http://localhost:5173/ in your browser"
echo "   Control panel: http://localhost:5173/control.html"
echo
echo "   Leave this window OPEN while you use it."
echo "   Press Ctrl+C here to stop."
echo "=================================================="
echo

# --- Open the browser a few seconds after the server boots ---
( sleep 8
  if command -v open >/dev/null 2>&1; then open http://localhost:5173/
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:5173/
  fi ) &

# --- Run the dev servers (UI + data) in this window ---
pnpm dev
