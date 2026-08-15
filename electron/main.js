const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { fork, spawn } = require("child_process");
const http = require("http");

let mainWindow = null;
let serverProcess = null;
let whatsappProcess = null;

const PORT = 3000;

function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200 || res.statusCode === 304 || res.statusCode === 302) {
            clearInterval(interval);
            resolve();
          }
        })
        .on("error", () => {
          if (Date.now() - start > timeout) {
            clearInterval(interval);
            reject(new Error("Timeout ao aguardar inicialização do servidor local."));
          }
        });
    }, 400);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: "AutoGestão ERP Automotivo Pro",
    icon: path.join(__dirname, "../public/icon.png"),
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.maximize();

  // Abre links externos no navegador padrão do sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1")) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  const appUrl = `http://localhost:${PORT}`;

  try {
    await waitForServer(appUrl);
    mainWindow.loadURL(appUrl);
  } catch (err) {
    console.error(err);
    mainWindow.loadURL(appUrl);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function startServices() {
  // Inicia o microserviço de WhatsApp
  try {
    const waPath = path.join(__dirname, "../server-whatsapp.js");
    whatsappProcess = fork(waPath, [], { stdio: "ignore" });
  } catch (e) {
    console.error("Erro ao iniciar daemon WhatsApp:", e);
  }

  // Inicia o servidor Next.js em produção
  try {
    const nextCliPath = path.join(__dirname, "../node_modules/next/dist/bin/next");
    serverProcess = fork(nextCliPath, ["start", "-p", String(PORT)], {
      cwd: path.join(__dirname, ".."),
      stdio: "ignore",
    });
  } catch (e) {
    console.error("Erro ao iniciar servidor Next.js:", e);
  }
}

app.whenReady().then(() => {
  startServices();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (serverProcess) serverProcess.kill();
    if (whatsappProcess) whatsappProcess.kill();
    app.quit();
  }
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
  if (whatsappProcess) whatsappProcess.kill();
});
