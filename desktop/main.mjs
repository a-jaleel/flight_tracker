// Electron main process for the Flight Tracker desktop app.
//
// It launches the project's Node server (which serves the built web UI + data
// WebSocket) as a child process bound to loopback, waits for it to come up, and
// then opens the display in a native window. The app menu can also open the
// control panel in its own window.
//
// This is a "run from source" desktop wrapper: the launcher scripts
// (desktop.command / desktop.bat) install deps and build the web UI first.

import { app, BrowserWindow, Menu } from "electron";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve, join } from "node:path";
import http from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PORT = process.env.PORT || "38473";
const BASE = `http://127.0.0.1:${PORT}`;

let serverProc = null;

// Two ways to run the backend:
//  - Packaged app: the server is pre-bundled (server-bundle.mjs) and the web UI
//    is in resources/. We run the bundle IN-PROCESS with plain Node (no pnpm,
//    no tsx, no node_modules) and point it at a writable data dir.
//  - From source (dev / launcher scripts): spawn `pnpm -F server start`.
async function startServer() {
  if (app.isPackaged) {
    process.env.PORT = PORT;
    process.env.HOST = "127.0.0.1";
    process.env.NODE_ENV = "production";
    process.env.FT_WEB_DIST = join(process.resourcesPath, "web", "dist");
    process.env.FT_DATA_DIR = app.getPath("userData");
    const bundle = join(process.resourcesPath, "server-bundle.mjs");
    try {
      await import(pathToFileURL(bundle).href); // boots + listens
    } catch (err) {
      console.error("[desktop] could not start bundled server:", err);
    }
    return;
  }

  const isWin = process.platform === "win32";
  serverProc = spawn(isWin ? "pnpm.cmd" : "pnpm", ["-F", "server", "start"], {
    cwd: ROOT,
    env: { ...process.env, PORT, HOST: "127.0.0.1", NODE_ENV: "production" },
    stdio: "inherit",
    shell: isWin, // help Windows resolve pnpm.cmd from PATH
  });
  serverProc.on("error", (err) =>
    console.error("[desktop] could not start the server:", err),
  );
}

function stopServer() {
  if (serverProc) {
    try {
      serverProc.kill();
    } catch {
      /* already gone */
    }
    serverProc = null;
  }
}

/** Poll /api/health until the server answers (or we give up after ~60s). */
function waitForHealth() {
  return new Promise((resolveReady) => {
    let tries = 0;
    const tick = () => {
      const req = http.get(`${BASE}/api/health`, (res) => {
        res.resume();
        resolveReady(true);
      });
      req.on("error", () => {
        if (++tries > 120) resolveReady(false);
        else setTimeout(tick, 500);
      });
    };
    tick();
  });
}

function createWindow(path = "/") {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#000000",
    title: "Flight Tracker",
    autoHideMenuBar: true,
  });
  win.loadURL(BASE + path);
  return win;
}

function showStartupError(win) {
  const html = `<!doctype html><meta charset="utf-8">
    <body style="background:#000;color:#e8ecff;font:16px system-ui;display:flex;
    align-items:center;justify-content:center;height:100vh;text-align:center">
    <div><h2>Flight Tracker couldn't reach its server.</h2>
    <p>Make sure dependencies are installed and the web UI is built:</p>
    <pre style="color:#9b7ecf">pnpm install &amp;&amp; pnpm build</pre>
    <p>then relaunch. (Easiest: use desktop.command / desktop.bat.)</p></div></body>`;
  win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
}

function buildMenu() {
  const template = [
    ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
    {
      label: "View",
      submenu: [
        { label: "Display", accelerator: "CmdOrCtrl+1", click: () => createWindow("/") },
        { label: "Control Panel", accelerator: "CmdOrCtrl+2", click: () => createWindow("/control.html") },
        { type: "separator" },
        { role: "reload" },
        { role: "togglefullscreen" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  buildMenu();
  await startServer();
  const ok = await waitForHealth();
  const win = createWindow("/");
  if (!ok) showStartupError(win);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow("/");
  });
});

app.on("window-all-closed", () => {
  stopServer();
  if (process.platform !== "darwin") app.quit();
});
app.on("before-quit", stopServer);
