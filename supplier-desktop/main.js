const { app, BrowserWindow, shell, Menu, Tray, nativeImage } = require("electron");
const path = require("path");

const PORTAL_URL = "https://supplier-potral.onrender.com/supplier/login";

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "INFY-POS Supplier Portal",
    icon: path.join(__dirname, "assets", "icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
    backgroundColor: "#1a7c4f",
    autoHideMenuBar: true,
  });

  // Remove default menu bar
  Menu.setApplicationMenu(null);

  // Show loading splash until page is ready
  mainWindow.loadURL(PORTAL_URL);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Keep app title
  mainWindow.webContents.on("did-navigate", (_, url) => {
    mainWindow.setTitle("INFY-POS Supplier Portal");
  });

  // Open external links in browser, not in app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "assets", "icon.ico");
  tray = new Tray(nativeImage.createFromPath(iconPath));
  const contextMenu = Menu.buildFromTemplate([
    { label: "Open Supplier Portal", click: () => { if (mainWindow) mainWindow.show(); else createWindow(); } },
    { label: "Dashboard", click: () => mainWindow && mainWindow.loadURL("https://supplier-potral.onrender.com/supplier/dashboard") },
    { type: "separator" },
    { label: "Quit", click: () => { app.isQuiting = true; app.quit(); } },
  ]);
  tray.setToolTip("INFY-POS Supplier Portal");
  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } else { createWindow(); } });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    // Keep running in tray on Windows
    if (!app.isQuiting) return;
    app.quit();
  }
});

app.on("before-quit", () => {
  app.isQuiting = true;
});
