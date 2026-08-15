const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const http = require("http");

let mainWindow = null;
let serverInstance = null;

const PORT = 3000;
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function getAppRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "app.asar");
  }
  return path.join(__dirname, "..");
}

async function startEmbeddedServer() {
  const appRoot = getAppRoot();

  // Inicia o daemon do WhatsApp em segundo plano
  try {
    const waPath = path.join(appRoot, "server-whatsapp.js");
    require(waPath);
    console.log("✓ WhatsApp daemon carregado com sucesso.");
  } catch (err) {
    console.error("Aviso ao carregar WhatsApp daemon:", err);
  }

  // Inicia o servidor Next.js embutido
  try {
    const next = require("next");
    const nextApp = next({
      dev: false,
      dir: appRoot,
      conf: {
        distDir: ".next",
      },
    });

    const handle = nextApp.getRequestHandler();

    await nextApp.prepare();

    serverInstance = http.createServer((req, res) => {
      handle(req, res);
    });

    await new Promise((resolve) => {
      serverInstance.listen(PORT, "127.0.0.1", () => {
        console.log(`✓ Servidor AutoGestão ativo na porta ${PORT}`);
        resolve();
      });
    });
  } catch (err) {
    console.error("Erro ao iniciar servidor Next.js embutido:", err);
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: "AutoGestão ERP Automotivo Pro",
    icon: path.join(__dirname, "../build/icon.png"),
    backgroundColor: "#0f172a",
    autoHideMenuBar: true,
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

  const appUrl = `http://127.0.0.1:${PORT}`;

  try {
    await mainWindow.loadURL(appUrl);
  } catch (err) {
    console.error("Erro ao carregar URL da janela:", err);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await startEmbeddedServer();
  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (serverInstance) {
    serverInstance.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (serverInstance) {
    serverInstance.close();
  }
});
