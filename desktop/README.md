# Flight Tracker — desktop app

A small [Electron](https://www.electronjs.org/) wrapper that runs Flight Tracker
in a native window (no browser tab, no terminal juggling). It starts the project's
Node server on loopback, waits for it, and opens the display. The **View** menu can
open the **Control Panel** in its own window.

Works on **Windows, macOS, and Linux**.

## Easiest way to launch

From the repo root, use the one-click launcher for your OS — it installs
dependencies, builds the web UI, installs Electron, and opens the app:

- **Windows:** double-click `desktop.bat`
- **macOS / Linux:** double-click `desktop.command` (or run `./desktop.command`)

## Manual launch

```bash
# from the repo root, once:
pnpm install
pnpm build

# then:
cd desktop
npm install      # downloads Electron (~100 MB the first time)
npm start
```

## Notes

- This wrapper runs the app **from source**, so Node.js + the project deps must be
  present (the launcher handles that). Turning it into a fully standalone installer
  with **no Node required** (bundling the server into the Electron binary) is a
  larger follow-up — ask if you want that.
- The window connects to `http://127.0.0.1:3000`. Set `PORT` to change it.
- Flight data needs outbound internet (airplanes.live). If the map is empty, check
  `http://127.0.0.1:3000/api/status` for `"ok": true`.
