// Preload script - runs in renderer context with access to Node APIs
const { contextBridge } = require("electron");

// Expose minimal API to renderer
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  appVersion: process.env.npm_package_version || "1.0.0",
});
