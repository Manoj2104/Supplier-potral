const { app, BrowserWindow, shell, Menu, Tray, nativeImage } = require("electron");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");

const LOCAL_URL = "http://127.0.0.1:8000/supplier/login";
const CLOUD_URL = "https://supplier-potral.onrender.com/supplier/login";

let mainWindow;
let tray;
let activeUrl = LOCAL_URL;

function checkUrl(url, timeoutMs = 800) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = http.get({
        hostname: u.hostname,
        port: u.port || 80,
        path: u.pathname,
        timeout: timeoutMs,
      }, (res) => {
        resolve(res.statusCode < 500);
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    } catch(e) {
      resolve(false);
    }
  });
}

function ensureLocalServer() {
  const xamppPhp = "C:\\xampp\\php\\php.exe";
  const posDir = "C:\\xampp\\htdocs\\pos";
  const serverPhp = path.join(posDir, "server.php");

  if (fs.existsSync(xamppPhp) && fs.existsSync(serverPhp)) {
    try {
      const child = spawn(xamppPhp, ["-S", "127.0.0.1:8000", "server.php"], {
        cwd: posDir,
        detached: true,
        stdio: "ignore",
      });
      child.unref();
    } catch(e) {}
  }
}

async function resolveStartupUrl() {
  // 1. Check if Localhost 8000 is already active
  let isLocal = await checkUrl(LOCAL_URL, 600);
  if (isLocal) {
    activeUrl = LOCAL_URL;
    return LOCAL_URL;
  }

  // 2. Try launching local PHP server if on local dev machine
  ensureLocalServer();
  await new Promise(r => setTimeout(r, 600));
  isLocal = await checkUrl(LOCAL_URL, 800);
  if (isLocal) {
    activeUrl = LOCAL_URL;
    return LOCAL_URL;
  }

  // 3. Fallback to Cloud (Render)
  activeUrl = CLOUD_URL;
  return CLOUD_URL;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "INFY-POS Supplier Portal (Localhost 0ms)",
    icon: path.join(__dirname, "assets", "icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    show: true, // Visible immediately
    backgroundColor: "#1a7c4f",
    autoHideMenuBar: true,
  });

  Menu.setApplicationMenu(null);

  const startUrl = await resolveStartupUrl();
  mainWindow.loadURL(startUrl);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on("did-navigate", (_, url) => {
    const isLocal = url.includes("127.0.0.1") || url.includes("localhost");
    const mode = isLocal ? "⚡ Localhost 0ms" : "☁️ Cloud";
    mainWindow.setTitle(`INFY-POS Supplier Portal [${mode}]`);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, "assets", "icon.ico");
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      tray = new Tray(icon);
      const contextMenu = Menu.buildFromTemplate([
        { label: "⚡ Open Localhost (0ms)", click: () => { activeUrl = LOCAL_URL; if (mainWindow) { mainWindow.loadURL(LOCAL_URL); mainWindow.show(); } else { createWindow(); } } },
        { label: "☁️ Open Cloud Portal (Render)", click: () => { activeUrl = CLOUD_URL; if (mainWindow) { mainWindow.loadURL(CLOUD_URL); mainWindow.show(); } else { createWindow(); } } },
        { type: "separator" },
        { label: "Quit", click: () => { app.isQuiting = true; app.quit(); } },
      ]);
      tray.setToolTip("INFY-POS Supplier Portal");
      tray.setContextMenu(contextMenu);
      tray.on("double-click", () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } else { createWindow(); } });
    }
  } catch(e) {}
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  app.isQuiting = true;
});


