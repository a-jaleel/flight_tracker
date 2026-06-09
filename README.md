<h1 align="center">Flight Tracker</h1>

<p align="center">
  <em>Show the aircraft passing overhead, in real time, on a small wall-mounted screen — pulled from a free cloud ADS-B feed.</em>
</p>

Flight Tracker renders the planes physically flying over you onto a screen, labeled
with their airline, type, and where they're headed. It draws the **real sky** behind
them — sun, moon, bright stars and constellations, naked-eye planets, and live
**satellites including the ISS** — all at their true positions for your location and
time. Pure-black background, so on a small LCD it reads like a glowing instrument. Tune
everything from your phone.

This is a fork of the excellent [**Skylight**](https://github.com/cpaczek/skylight) by
[cpaczek](https://github.com/cpaczek), retargeted for a **wall-mounted 10" 1080p
screen** instead of a ceiling projector, using **online/cloud flight data** instead of a
local radio, and trimmed down so it runs on the lightest practical Raspberry Pi.

> The default location is **the Bronx, NY** (nearest airport: **LaGuardia / LGA**), but it
> works anywhere — set your coordinates from the control panel and you're flying.

## What's different from Skylight

| | Skylight (upstream) | Flight Tracker (this fork) |
|---|---|---|
| Output | 1080p projector pointed at the ceiling | Wall-mounted **10" 1080p LCD** (flat, front-viewed) |
| Flight data | Local **RTL-SDR** radio (dump1090) + API supplement | **Cloud API only** (airplanes.live), no radio hardware |
| Camera tracker | Optional PTZ sky-camera with vision/AI | **Removed** (and the `/tracker` + `/tv` dashboards) |
| Default orientation | `mirrorX` on (the "looking-up" flip) | North-up, no mirror (a normal map on a wall) |
| Recommended Pi | Pi 5 (8 GB) for the camera vision | **Pi 4 (2 GB)** — display + cloud poller only |

Everything else — the renderer, sky engine, enrichment, and phone control panel — is
inherited from Skylight.

## Features

- **Real-time overhead aircraft** from the free [airplanes.live](https://airplanes.live/)
  API — no radio, no hardware beyond the Pi and a screen.
- **Type-aware glyphs** in a luminous, swept-wing style: widebodies tower over regional
  jets, **helicopters spin their rotors**, turboprops and GA aircraft spin their props.
- **Smooth motion** — interpolates the ~1 Hz fixes to 60 fps by rendering slightly in
  the past and tweening between real positions (no teleporting).
- **Comet trails**, altitude-graded color, and range rings + compass for orientation.
- **The airport** (runways) drawn at its true position, so you watch departures and
  arrivals line up with the runway.
- **Window to elsewhere** — each routed flight shows its destination **city, local time
  there, and miles-to-go**, plus a faint great-circle arc toward where it's headed.
- **Live sky layer** — sun, moon (with phase), bright stars + constellation lines,
  **naked-eye planets**, and **satellites / ISS** computed from TLEs. Scrub time
  forward/back from your phone, or jump straight to the next ISS pass.
- **Phone control panel** — every setting (location, orientation, theme, palette,
  filters, sky toggles, …) is live-tunable over your LAN and persists across reboots.
- **Appliance-ready** — boots straight to a full-screen kiosk on a Raspberry Pi.

## Hardware

| Part | Suggested | Notes |
|---|---|---|
| Compute | **Raspberry Pi 4 (2 GB)** | Comfortable 24/7 floor for a smooth 1080p kiosk + the cloud poller. A Pi 3 or **Pi Zero 2 W** also works if you cap `maxFps` (~30) and trim trails. |
| Screen | Any **1080p HDMI display** | A 10" 1080p LCD panel + an external driver board makes a tidy wall piece. It reports as a normal HDMI monitor. |
| Display link | Micro-HDMI → HDMI (Pi 4) | The Pi 4 uses **micro**-HDMI. |
| Mount | Wall bracket / stand | No rotating mount needed — it's a flat, front-viewed map. |
| Network | WiFi or Ethernet | Flight data and satellite TLEs come from the internet. |

You don't need any of this to try it — see **Quick start**.

## Quick start (on your computer)

Runs entirely on your machine against the free public ADS-B API.

```bash
pnpm install
pnpm dev
```

- **Display:** http://localhost:5173/
- **Control panel:** http://localhost:5173/control.html (or from your phone: `http://<your-ip>:5173/control.html`)

Set your location from the control panel's **Location** section (type a city, airport
code, or `lat,lon`), or edit the defaults in
[`shared/src/config.ts`](shared/src/config.ts).

## Raspberry Pi appliance

Full walkthrough in [`pi-setup/README.md`](pi-setup/README.md): flash + headless
provision the SD card, install Node + the app, and set up the boot-to-kiosk display.
Once it's running, push updates from your dev machine with:

```bash
PI_HOST=flighttracker.local ./scripts/deploy-to-pi.sh
```

## Docker (server-driven display)

Run the server + display in a container (it serves the built web UI):

```bash
docker compose up -d --build
# display:  http://<host>:3000/      ·  phone panel: http://<host>:3000/control
```

It uses the free airplanes.live API out of the box, so it runs with no hardware. Config
and the route/TLE caches persist in the `flight-tracker-data` volume. If you reach the
server over a custom hostname or a tunnel rather than a LAN IP / `*.local`, add it to
`ALLOWED_HOSTS` (see below).

## Configuration

`Config` ([`shared/src/config.ts`](shared/src/config.ts)) is the single source of truth,
persisted to `server/data/config.json` and live-editable from the control panel. Key
fields:

| | |
|---|---|
| `centerLat` / `centerLon` | **Your location** — the spot centered on the screen. Editable from the panel's **Location** section (type a city, airport code, or `lat,lon`). |
| `locationName` | Display name for the current location, shown in the control panel. |
| `locationProfiles` | Saved places (favorite airports). Switch between them from the panel's **Location** section. |
| `radiusMiles` | How far out to show (default 3 — "what you could realistically see"). |
| `rotationDeg` / `mirrorX` / `mirrorY` | Orientation — rotate/flip the map to match how the screen is mounted (defaults: north-up, no mirror). |
| `projectionMode` | `map` (flat top-down plan) or `sky` (realistic look-up dome). |
| `theme` | `ambient` · `telemetry` · `focus`. |
| `maxFps` / `trailSeconds` | Render-load knobs — lower them on a Pi Zero 2 W / Pi 3. |
| `showStars` / `showSun` / `showMoon` / `showSatellites` / `showPlanets` | Sky layer toggles. |
| `skyTimeOffsetMin` | Scrub the sky clock for testing (0 = live). |
| `showDestArc` / `showRouteDetail` | "Window to elsewhere". |

**Using it somewhere other than the default:** set your location from the control panel's
**Location** section (or edit `centerLat`/`centerLon`). Stars, sun, moon, and satellites
are computed for your coordinates automatically. The runway overlay ships with **LGA,
JFK, and EWR** geometry — turn off **Airport runways** if you've moved, or replace it in
[`web/src/display/airports.ts`](web/src/display/airports.ts) with your local airport
(coordinates from [OurAirports](https://ourairports.com/data/)).

> Location search uses the free [Nominatim](https://nominatim.openstreetmap.org/)
> (OpenStreetMap) service. Set `GEOCODE_USER_AGENT` to identify your deployment if you
> use it heavily.

### Server environment

| Env | Default | Meaning |
|---|---|---|
| `API_URL` | `https://api.airplanes.live/v2/point/{lat}/{lon}/{r}` | Cloud ADS-B endpoint (`{lat}/{lon}/{r}` filled from config) |
| `POLL_MS` | `1000` | API poll cadence (ms) |
| `PORT` / `HOST` | `3000` / `0.0.0.0` | HTTP + WebSocket |
| `ALLOWED_HOSTS` | *(empty)* | Extra Host/Origin allowlist entries, comma-separated. Wildcards: `*.example.com`. Loopback, RFC1918 LAN, IPv6 ULA / link-local, and `*.local` are allowed by default. |
| `ALLOW_PRIVATE_LAN` | `1` | Set `0` to lock the server to loopback + mDNS only (no LAN phone control) |
| `GEOCODE_USER_AGENT` | *(default)* | User-Agent sent to Nominatim for location search |

### Exposing it on a custom hostname

The server binds `0.0.0.0` so the phone control panel works on your home Wi-Fi. To stop
browsers on other origins from talking to it (DNS-rebinding), every request is rejected
unless its `Host` header (and a WebSocket's `Origin`) matches the allowlist. The defaults
cover `localhost`, `127.0.0.1`, `[::1]`, `*.local`, and private LAN ranges. If you
publish it on a public hostname or tunnel, add it:

```bash
ALLOWED_HOSTS=flights.mydomain.com,*.trycloudflare.com pnpm dev
```

## Architecture

```
airplanes.live API ──poll ~1 Hz──> server/  (Node · Express · ws)  :3000
                                    • normalize + enrich (airline/type tables + adsbdb routes)
                                    • proxy satellite TLEs (Celestrak)
                                    • persist config, broadcast over WebSocket
                                    ├──────────────┬──────────────┐
                                    ▼              ▼              ▼
                              Display (/)    Control (/control)  REST /api/*
                              canvas renderer +  phone settings UI
                              sky engine → screen (live, two-way)
```

- **`shared/`** — TypeScript types, config schema, and pure geo/projection/celestial math.
- **`server/`** — polls the cloud API, enriches aircraft, proxies TLEs, persists config,
  and pushes everything over a WebSocket.
- **`web/`** — Vite + React, two pages: the **display** (`<canvas>` renderer + celestial
  engine) and the mobile **control panel**.

**Stack:** TypeScript · React · Vite · Express · ws · pnpm workspaces ·
[astronomy-engine](https://github.com/cosinekitty/astronomy) ·
[satellite.js](https://github.com/shashwatak/satellite-js).

## Credits & data

- Original project: [**Skylight**](https://github.com/cpaczek/skylight) by
  [cpaczek](https://github.com/cpaczek) (MIT) — this is a fork.
- Flight data + aircraft enrichment: [airplanes.live](https://airplanes.live/) ·
  routes: [adsbdb](https://www.adsbdb.com/)
- Satellite elements: [Celestrak](https://celestrak.org/) · airport data:
  [OurAirports](https://ourairports.com/)

## License

[MIT](LICENSE) — be excellent, point it at the sky.
