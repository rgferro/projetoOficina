const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

let mainWindow = null;
let serverInstance = null;

const PORT = 3000;

function getAppRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "app.asar");
  }
  return path.join(__dirname, "..");
}

function setupEnvironment() {
  const userDataPath = app.getPath("userData");
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const dbPath = path.join(userDataPath, "autogestao.db");

  // Se o banco ainda não existe na pasta AppData do usuário, copia o template dev.db inicial
  if (!fs.existsSync(dbPath)) {
    const appRoot = getAppRoot();
    const templateDb = path.join(appRoot, "dev.db");
    const unpackedDb = path.join(process.resourcesPath || "", "app.asar.unpacked", "dev.db");

    if (fs.existsSync(unpackedDb)) {
      fs.copyFileSync(unpackedDb, dbPath);
    } else if (fs.existsSync(templateDb)) {
      fs.copyFileSync(templateDb, dbPath);
    }
  }

  // Define caminhos com permissão total de escrita (AppData)
  process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, "/")}`;
  process.env.USER_DATA_PATH = userDataPath;
  process.env.LICENSE_FILE_PATH = path.join(userDataPath, ".license");
  process.env.WHATSAPP_AUTH_DIR = path.join(userDataPath, "whatsapp_auth");

  console.log("✓ Ambiente Desktop configurado com sucesso:");
  console.log("  - AppData Directory:", userDataPath);
  console.log("  - Database URL:", process.env.DATABASE_URL);
}

async function startEmbeddedServer() {
  setupEnvironment();
  const appRoot = getAppRoot();

  // Inicia o daemon do WhatsApp em segundo plano
  try {
    const waPath = path.join(appRoot, "server-whatsapp.js");
    require(waPath);
    console.log("✓ WhatsApp daemon ativo na porta 3005.");
  } catch (err) {
    console.error("Aviso ao iniciar WhatsApp daemon:", err.message || err);
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

    await new Promise((resolve, reject) => {
      serverInstance.listen(PORT, "127.0.0.1", (err) => {
        if (err) return reject(err);
        console.log(`✓ Servidor AutoGestão Next.js ativo em http://127.0.0.1:${PORT}`);
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
    console.error("Erro ao carregar URL principal da janela:", err);
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
