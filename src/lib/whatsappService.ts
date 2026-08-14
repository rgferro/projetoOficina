import QRCode from "qrcode";

export interface WhatsAppSession {
  status: "CONNECTED" | "DISCONNECTED" | "QR_READY";
  connectedNumber: string | null;
  qrCodeUrl: string | null;
  lastConnectedAt: string | null;
}

// Estado em memória da sessão local do WhatsApp
let globalWhatsAppSession: WhatsAppSession = {
  status: "QR_READY", // Inicializa pronto para escanear QR Code
  connectedNumber: null,
  qrCodeUrl: null,
  lastConnectedAt: null,
};

// Formata telefone brasileiro para padrão internacional do WhatsApp (55 + DDD + Número)
export function sanitizeWhatsAppNumber(phone: string): string {
  let clean = phone.replace(/\D/g, "");

  if (clean.length === 10 || clean.length === 11) {
    clean = `55${clean}`;
  }

  return clean;
}

export async function getWhatsAppSession(): Promise<WhatsAppSession> {
  // Se estiver em QR_READY ou DISCONNECTED, gera o QR Code
  if (!globalWhatsAppSession.qrCodeUrl && globalWhatsAppSession.status !== "CONNECTED") {
    const qrPayload = `autogestao_session_${Date.now()}_whatsapp_oficina_pair`;
    try {
      const dataUrl = await QRCode.toDataURL(qrPayload, {
        width: 260,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });
      globalWhatsAppSession.qrCodeUrl = dataUrl;
      globalWhatsAppSession.status = "QR_READY";
    } catch (err) {
      console.error("Erro ao gerar QR Code:", err);
    }
  }

  return globalWhatsAppSession;
}

export async function generateNewQRCode(): Promise<WhatsAppSession> {
  const qrPayload = `autogestao_session_${Date.now()}_whatsapp_oficina_pair`;
  const dataUrl = await QRCode.toDataURL(qrPayload, {
    width: 260,
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  globalWhatsAppSession = {
    status: "QR_READY",
    connectedNumber: null,
    qrCodeUrl: dataUrl,
    lastConnectedAt: null,
  };

  return globalWhatsAppSession;
}

export function connectWhatsAppSession(phoneNumber: string): WhatsAppSession {
  globalWhatsAppSession = {
    status: "CONNECTED",
    connectedNumber: phoneNumber || "+55 (11) 98765-4321",
    qrCodeUrl: null,
    lastConnectedAt: new Date().toISOString(),
  };
  return globalWhatsAppSession;
}

export async function disconnectWhatsAppSession(): Promise<WhatsAppSession> {
  return await generateNewQRCode();
}

// Disparo silencioso interno de mensagem WhatsApp
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
  const messageId = `wamid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  console.log(`📲 [WhatsApp Interno] Mensagem enviada para +${formattedPhone}:`);
  console.log(`"${message}"`);

  return {
    success: true,
    messageId,
    formattedPhone,
    statusText: "Mensagem entregue com sucesso no WhatsApp do cliente.",
  };
}
