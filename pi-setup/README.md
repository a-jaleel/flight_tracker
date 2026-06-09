# Raspberry Pi setup

Turn a freshly-flashed Raspberry Pi OS card into the Flight Tracker appliance: it
boots straight into a full-screen display of the aircraft overhead, pulled from the
free **airplanes.live** cloud API (no radio, no decoder, no other hardware).

Tested target: **Raspberry Pi 4 (2 GB)** with **Raspberry Pi OS Bookworm (64-bit,
Desktop)**, driving a 10" 1080p screen over HDMI. A Pi 3 / Pi Zero 2 W also works if
you cap `maxFps` (~30) and trim `trailSeconds` from the control panel.

## 1. Provision the card (headless WiFi + SSH) — on your computer

Flash Raspberry Pi OS (Desktop) to the card. With the card's **boot** partition mounted
(e.g. at `/mnt/sdboot`):

```bash
sudo BOOT_MNT=/mnt/sdboot \
  HOSTNAME_PI=flighttracker \
  WIFI_SSID="YourWiFi" WIFI_PSK="YourPassword" WIFI_COUNTRY=US \
  PUBKEY="$(cat ~/.ssh/id_ed25519.pub)" \
  ./provision-sd.sh
```

This writes `custom.toml` (processed on first boot) + an `ssh` flag file, and prints a
random console/sudo password — **save it**. SSH is key-only by default (use a
passphrase-less key, or load yours into an agent, so unattended `rsync`/deploy works).

Eject, boot the Pi, wait ~60–90 s, then:

```bash
ssh pi@flighttracker.local        # or ssh pi@<pi-ip>
```

## 2. Install the appliance — on the Pi

Copy the repo to the Pi and run the installer:

```bash
git clone https://github.com/a-jaleel/flight_tracker.git ~/flight_tracker   # or rsync it over
cd ~/flight_tracker
LAT=37.6213 LON=-122.379 ./pi-setup/install-on-pi.sh            # set your coordinates
```

Installs Node + pnpm, builds the app, seeds your location, and enables the
`flight-tracker-server` service. **Verify the feed** with
`curl -s http://localhost:3000/api/status` (you want `"ok": true`) before moving on.

## 3. Kiosk display — on the Pi

```bash
./pi-setup/setup-kiosk.sh
sudo reboot
```

Chromium opens full-screen on the display page at boot (via Xwayland), cursor hidden,
screen blanking off.

> **No HDMI signal?** The Pi can turn HDMI off when nothing is connected at boot and
> doesn't always re-detect on hotplug. Force the mode by appending to
> `/boot/firmware/cmdline.txt`: `video=HDMI-A-1:1920x1080@60D`, then reboot. (Your
> 10" panel + driver board reports as a normal 1080p HDMI display.)

## 4. Set location & orient

From your phone open `http://flighttracker.local:3000/control`:

- **Location** — type a city, airport code, or `lat,lon` to center the map.
- **Orientation** — set **rotation** (and mirror, only for an awkward mount) so the
  map lines up the way the screen is hung on the wall.
- **View / Sky** — pick a theme, trail length, and which sky layers to show.

## Pushing updates

From your dev machine, after editing code:

```bash
PI_HOST=flighttracker.local ./scripts/deploy-to-pi.sh
```

(rsyncs the source, rebuilds on the Pi, restarts the server, and reloads the kiosk.)

## Files

| File | Runs on | Purpose |
|---|---|---|
| `provision-sd.sh` | your PC | headless WiFi + SSH onto the SD boot partition |
| `install-on-pi.sh` | the Pi | Node + app + server service |
| `flight-tracker-server.service` | the Pi | systemd unit template for the server |
| `setup-kiosk.sh` | the Pi | Chromium kiosk autostart + no-blanking |
