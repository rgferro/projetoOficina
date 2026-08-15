const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("desktopEnv", {
  isDesktop: true,
  platform: process.platform,
  version: "3.3.0",
});
