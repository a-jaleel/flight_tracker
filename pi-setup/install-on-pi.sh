#!/usr/bin/env bash
# Run ON the Raspberry Pi (over SSH) to install the appliance:
#   Node + pnpm, this app (built), and the flight-tracker-server systemd
#   service. Aircraft come from the free airplanes.live cloud API — no radio,
#   no decoder, no other hardware.
# Kiosk autostart is set up separately by setup-kiosk.sh (needs the desktop).
set -euo pipefail

APPDIR="${APPDIR:-$HOME/flight_tracker}"
USER_NAME="$(id -un)"
# Where you're looking up — the spot centered on the screen. Defaults to SFO.
# Set LAT/LON to seed the saved config (you can also change it later from the
# control panel's Location section).
LAT="${LAT:-37.6213}"
LON="${LON:--122.379}"

echo "==> apt update + base packages"
sudo apt-get update
sudo apt-get install -y git curl unclutter

echo "==> Node.js + pnpm (via corepack)"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo corepack enable
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
corepack prepare pnpm@10.28.2 --activate

echo "==> Build the app"
cd "$APPDIR"
pnpm install
pnpm build

echo "==> Seed location ($LAT, $LON) into the persisted config"
mkdir -p "$APPDIR/server/data"
if [ ! -f "$APPDIR/server/data/config.json" ]; then
  cat > "$APPDIR/server/data/config.json" <<EOF
{ "centerLat": $LAT, "centerLon": $LON }
EOF
fi

echo "==> flight-tracker-server systemd service"
PNPM_BIN="$(command -v pnpm)"
sudo sed \
  -e "s#__USER__#$USER_NAME#g" \
  -e "s#__APPDIR__#$APPDIR#g" \
  -e "s#__PNPM__#$PNPM_BIN#g" \
  "$APPDIR/pi-setup/flight-tracker-server.service" \
  | sudo tee /etc/systemd/system/flight-tracker-server.service >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable --now flight-tracker-server.service

IP="$(hostname -I | awk '{print $1}')"
echo
echo "Done."
echo "  Display : http://localhost:3000/  (point Chromium kiosk here — see setup-kiosk.sh)"
echo "  Control : http://$IP:3000/control  (open on your phone)"
echo
echo "Verify the feed:  curl -s http://localhost:3000/api/status"
