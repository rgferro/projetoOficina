const { app, BrowserWindow, shell, globalShortcut } = require("electron");
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

function setupLogger(userDataPath) {
  const logFile = path.join(userDataPath, "desktop_debug.log");
  const logStream = fs.createWriteStream(logFile, { flags: "a" });

  const formatLog = (level, args) => {
    const timestamp = new Date().toISOString();
    const message = args
      .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
      .join(" ");
    return `[${timestamp}] [${level}] ${message}\n`;
  };

  const origLog = console.log;
  const origError = console.error;
  const origWarn = console.warn;

  console.log = (...args) => {
    logStream.write(formatLog("INFO", args));
    origLog(...args);
  };

  console.error = (...args) => {
    logStream.write(formatLog("ERROR", args));
    origError(...args);
  };

  console.warn = (...args) => {
    logStream.write(formatLog("WARN", args));
    origWarn(...args);
  };

  process.on("uncaughtException", (err) => {
    console.error("💥 Uncaught Exception:", err.stack || err);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("💥 Unhandled Rejection:", reason);
  });

  return logFile;
}

function setupEnvironment() {
  const userDataPath = app.getPath("userData");
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const logPath = setupLogger(userDataPath);
  console.log("=========================================================================");
  console.log("             AUTOGESTAO ERP - INICIANDO DESKTOP RUNTIME                  ");
  console.log("=========================================================================");
  console.log("  - Arquivo de Log:", logPath);
  console.log("  - Pasta de Dados (UserData):", userDataPath);

  const dbPath = path.join(userDataPath, "autogestao.db");

  // Se o banco ainda não existe na pasta AppData do usuário, copia o template dev.db inicial
  if (!fs.existsSync(dbPath)) {
    const appRoot = getAppRoot();
    const templateDb = path.join(appRoot, "dev.db");
    const unpackedDb = path.join(process.resourcesPath || "", "app.asar.unpacked", "dev.db");

    if (fs.existsSync(unpackedDb)) {
      fs.copyFileSync(unpackedDb, dbPath);
      console.log("✓ Banco template copiado de app.asar.unpacked");
    } else if (fs.existsSync(templateDb)) {
      fs.copyFileSync(templateDb, dbPath);
      console.log("✓ Banco template copiado de appRoot");
    }
  }

  // Define caminhos com permissão total de escrita (AppData)
  process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, "/")}`;
  process.env.USER_DATA_PATH = userDataPath;
  process.env.LICENSE_FILE_PATH = path.join(userDataPath, ".license");
  process.env.WHATSAPP_AUTH_DIR = path.join(userDataPath, "whatsapp_auth");

  // Configura o caminho da engine do Prisma se empacotado
  if (app.isPackaged) {
    const unpackedPrismaEngine = path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "node_modules",
      ".prisma",
      "client",
      "query_engine-windows.dll.node"
    );
    if (fs.existsSync(unpackedPrismaEngine)) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = unpackedPrismaEngine;
      console.log("✓ Engine do Prisma localizada em:", unpackedPrismaEngine);
    }
  }

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
    console.log("✓ Next.js prepare() concluído com sucesso.");

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
    console.error("Erro crítico ao iniciar servidor Next.js:", err.stack || err);
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

  // Atalho F12 para abrir DevTools / Inspecionar logs do console
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F12" || (input.control && input.shift && input.key.toLowerCase() === "i")) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

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
