#!/bin/bash
# ============================================================
#  Flight Tracker - desktop app launcher (macOS / Linux)
#  Double-click this file (macOS) or run ./desktop.command
#  Installs deps, builds the UI, and opens the native app window.
# ============================================================
cd "$(dirname "$0")" || exit 1
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

echo
echo "=================================================="
echo "   Flight Tracker - desktop app"
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

# --- Install project deps + build the web UI ---
echo
echo "Installing dependencies and building the UI..."
if ! pnpm install; then
  echo "[ERROR] pnpm install failed."; read -n 1 -s -r -p "Press any key to close..."; exit 1
fi
if ! pnpm build; then
  echo "[ERROR] web build failed."; read -n 1 -s -r -p "Press any key to close..."; exit 1
fi

# --- Install Electron + launch the app ---
echo
echo "Installing Electron (first run downloads ~100 MB)..."
cd desktop || exit 1
if ! npm install; then
  echo "[ERROR] Electron install failed."; read -n 1 -s -r -p "Press any key to close..."; exit 1
fi

echo
echo "Launching the desktop app... (leave this window open; close the app window to quit)"
npm start
