const { app, BrowserWindow, shell, Menu, Tray, nativeImage } = require("electron");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");

const logFile = path.join(app.getPath("userData"), "startup.log");
function log(msg) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  } catch(e) {}
}

process.on("uncaughtException", (err) => {
  log(`Uncaught exception: ${err.stack || err}`);
});
process.on("unhandledRejection", (reason) => {
  log(`Unhandled rejection: ${reason}`);
});

log("App starting...");

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
  const xamppMysql = "C:\\xampp\\mysql\\bin\\mysqld.exe";
  const myIni = "C:\\xampp\\mysql\\bin\\my.ini";

  // Auto-launch XAMPP MySQL if present
  if (fs.existsSync(xamppMysql) && fs.existsSync(myIni)) {
    try {
      const mysqlChild = spawn(xamppMysql, ["--defaults-file=" + myIni, "--standalone"], {
        detached: true,
        stdio: "ignore",
      });
      mysqlChild.unref();
      log("XAMPP MySQL service ensured");
    } catch(e) {
      log("Failed to spawn MySQL: " + e);
    }
  }

  // Auto-launch Local PHP Server
  if (fs.existsSync(xamppPhp) && fs.existsSync(serverPhp)) {
    try {
      const child = spawn(xamppPhp, ["-S", "127.0.0.1:8000", "server.php"], {
        cwd: posDir,
        detached: true,
        stdio: "ignore",
      });
      child.unref();
      log("Local PHP server ensured");
    } catch(e) {
      log("Failed to spawn PHP: " + e);
    }
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

function createWindow() {
  log("createWindow called");
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
    show: true,
    backgroundColor: "#1a7c4f",
    autoHideMenuBar: true,
  });

  Menu.setApplicationMenu(null);

  mainWindow.webContents.on("did-navigate", (_, url) => {
    const isLocal = url.includes("127.0.0.1") || url.includes("localhost");
    const mode = isLocal ? "⚡ Localhost 0ms" : "☁️ Cloud";
    mainWindow.setTitle(`INFY-POS Supplier Portal [${mode}]`);
    log(`Navigated to: ${url} [${mode}]`);
  });

  mainWindow.webContents.on("did-fail-load", (_, errorCode, errorDesc, validatedURL) => {
    log(`did-fail-load: ${errorCode} ${errorDesc} ${validatedURL}`);
    if (activeUrl === LOCAL_URL) {
      log("Falling back to Cloud URL after load failure");
      activeUrl = CLOUD_URL;
      mainWindow.loadURL(CLOUD_URL);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    log("mainWindow closed");
    mainWindow = null;
  });

  resolveStartupUrl().then((startUrl) => {
    log(`Loading resolved URL: ${startUrl}`);
    if (mainWindow) {
      mainWindow.loadURL(startUrl);
    }
  }).catch((err) => {
    log(`resolveStartupUrl error: ${err}`);
    if (mainWindow) {
      mainWindow.loadURL(CLOUD_URL);
    }
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
  } catch(e) {
    log(`Tray creation error: ${e}`);
  }
}

app.whenReady().then(() => {
  log("app.whenReady fired");
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  log("window-all-closed fired");
  app.quit();
});

app.on("before-quit", () => {
  app.isQuiting = true;
});


