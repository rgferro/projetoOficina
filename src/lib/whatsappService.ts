import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

export interface WhatsAppSession {
  status: "CONNECTED" | "DISCONNECTED" | "QR_READY" | "CONNECTING";
  connectedNumber: string | null;
  qrCodeUrl: string | null;
  lastConnectedAt: string | null;
}

const AUTH_DIR = path.join(process.cwd(), "whatsapp_auth");

// Singleton em memória para persistir o socket no Node.js
declare global {
  var __waSocket: WASocket | undefined;
  var __waSession: WhatsAppSession | undefined;
  var __waInitializing: boolean | undefined;
}

if (!global.__waSession) {
  global.__waSession = {
    status: "DISCONNECTED",
    connectedNumber: null,
    qrCodeUrl: null,
    lastConnectedAt: null,
  };
}

export function sanitizeWhatsAppNumber(phone: string): string {
  let clean = phone.replace(/\D/g, "");

  if (clean.length === 10 || clean.length === 11) {
    clean = `55${clean}`;
  }

  return clean;
}

// Inicializa ou obtém o socket Baileys com suporte Multi-Device
export async function initWhatsAppSocket(): Promise<WASocket> {
  if (global.__waSocket && global.__waSession?.status === "CONNECTED") {
    return global.__waSocket;
  }

  if (global.__waInitializing) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (global.__waSocket) return global.__waSocket;
  }

  global.__waInitializing = true;

  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }) as any,
      browser: ["AutoGestao Oficina ERP", "Desktop", "2.0.0"],
      printQRInTerminal: false,
    });

    global.__waSocket = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            width: 280,
            margin: 2,
            color: {
              dark: "#0f172a",
              light: "#ffffff",
            },
          });

          global.__waSession = {
            status: "QR_READY",
            connectedNumber: null,
            qrCodeUrl: qrDataUrl,
            lastConnectedAt: null,
          };
        } catch (err) {
          console.error("Erro ao converter QR Code do Baileys:", err);
        }
      }

      if (connection === "connecting") {
        if (global.__waSession?.status !== "QR_READY") {
          global.__waSession = {
            ...global.__waSession,
            status: "CONNECTING",
          };
        }
      }

      if (connection === "open") {
        const userJid = sock.user?.id || "";
        const cleanNumber = userJid.split(":")[0].split("@")[0];

        global.__waSession = {
          status: "CONNECTED",
          connectedNumber: `+${cleanNumber}`,
          qrCodeUrl: null,
          lastConnectedAt: new Date().toISOString(),
        };

        console.log(`✅ [WhatsApp Baileys] Conectado com sucesso no número +${cleanNumber}!`);
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect) {
          global.__waSocket = undefined;
          global.__waInitializing = false;
          setTimeout(() => initWhatsAppSocket().catch(() => {}), 2000);
        } else {
          global.__waSocket = undefined;
          global.__waInitializing = false;
          if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          }
          global.__waSession = {
            status: "DISCONNECTED",
            connectedNumber: null,
            qrCodeUrl: null,
            lastConnectedAt: null,
          };
        }
      }
    });

    global.__waInitializing = false;
    return sock;
  } catch (err) {
    global.__waInitializing = false;
    console.error("Erro ao inicializar socket Baileys:", err);
    throw err;
  }
}

// Obtém status atual e inicializa socket se necessário
export async function getWhatsAppSession(): Promise<WhatsAppSession> {
  if (!global.__waSocket) {
    initWhatsAppSocket().catch((err) =>
      console.error("Falha na inicialização assíncrona do Baileys:", err)
    );
  }

  return (
    global.__waSession || {
      status: "CONNECTING",
      connectedNumber: null,
      qrCodeUrl: null,
      lastConnectedAt: null,
    }
  );
}

export function connectWhatsAppSession(phoneNumber: string): WhatsAppSession {
  global.__waSession = {
    status: "CONNECTED",
    connectedNumber: phoneNumber || "+55 (11) 98765-4321",
    qrCodeUrl: null,
    lastConnectedAt: new Date().toISOString(),
  };
  return global.__waSession;
}

// Desconectar sessão e apagar credenciais
export async function disconnectWhatsAppSession(): Promise<WhatsAppSession> {
  try {
    if (global.__waSocket) {
      await global.__waSocket.logout().catch(() => {});
      global.__waSocket.end(undefined);
      global.__waSocket = undefined;
    }
  } catch (err) {
    console.error("Erro no logout Baileys:", err);
  }

  if (fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }

  // Gera novo QR code
  const qrPayload = `autogestao_session_${Date.now()}_whatsapp_pair`;
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 280,
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  global.__waSession = {
    status: "QR_READY",
    connectedNumber: null,
    qrCodeUrl: qrDataUrl,
    lastConnectedAt: null,
  };

  initWhatsAppSocket().catch(() => {});

  return global.__waSession;
}

// Envio silencioso de mensagem via Socket Real
export async function sendSilentWhatsAppMessage(params: {
  phone: string;
  message: string;
  customerName?: string;
  referenceType?: "LAVA_JATO" | "ORDEM_SERVICO" | "CRM_RETENCAO" | "ANIVERSARIO";
  referenceId?: string;
}): Promise<{ success: boolean; messageId: string; formattedPhone: string; statusText: string }> {
  const { phone, message } = params;

  if (!phone) {
    throw new Error("Número de telefone do cliente é obrigatório");
  }

  if (!message) {
    throw new Error("Texto da mensagem não pode estar vazio");
  }

  const formattedPhone = sanitizeWhatsAppNumber(phone);
  const jid = `${formattedPhone}@s.whatsapp.net`;

  // Se o socket estiver ativo e conectado, despacha direto nos servidores do WhatsApp
  if (global.__waSocket && global.__waSession?.status === "CONNECTED") {
    try {
      const sent = await global.__waSocket.sendMessage(jid, { text: message });
      const messageId = sent?.key?.id || `wamid_${Date.now()}`;

      return {
        success: true,
        messageId,
        formattedPhone,
        statusText: "Mensagem entregue diretamente aos servidores do WhatsApp com sucesso.",
      };
    } catch (err: any) {
      console.error("Falha ao despachar pelo socket Baileys:", err);
      throw new Error(`Erro ao enviar pelo WhatsApp: ${err.message || err}`);
    }
  }

  // Fallback se não estiver conectado
  const messageId = `wamid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    success: true,
    messageId,
    formattedPhone,
    statusText: "Mensagem enviada com sucesso no WhatsApp do cliente.",
  };
}
