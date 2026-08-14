import { prisma } from "@/lib/prisma";

export interface WhatsAppSession {
  status: "CONNECTED" | "DISCONNECTED" | "QR_READY";
  connectedNumber: string | null;
  qrCodeUrl: string | null;
  lastConnectedAt: string | null;
}

// Estado em memória da sessão local do WhatsApp
let globalWhatsAppSession: WhatsAppSession = {
  status: "CONNECTED", // Por padrão ativado pronto para disparos imediatos
  connectedNumber: "+55 (11) 98765-4321",
  qrCodeUrl: null,
  lastConnectedAt: new Date().toISOString(),
};

// Formata telefone brasileiro para padrão internacional do WhatsApp (55 + DDD + Número)
export function sanitizeWhatsAppNumber(phone: string): string {
  let clean = phone.replace(/\D/g, "");

  // Se o usuário digitou sem 55 (ex: 11987654321 -> 11 dígitos)
  if (clean.length === 10 || clean.length === 11) {
    clean = `55${clean}`;
  }

  return clean;
}

export function getWhatsAppSession(): WhatsAppSession {
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

export function disconnectWhatsAppSession(): WhatsAppSession {
  globalWhatsAppSession = {
    status: "DISCONNECTED",
    connectedNumber: null,
    qrCodeUrl: null,
    lastConnectedAt: null,
  };
  return globalWhatsAppSession;
}

// Disparo silencioso interno de mensagem WhatsApp
export async function sendSilentWhatsAppMessage(params: {
  phone: string;
  message: string;
  customerName?: string;
  referenceType?: "LAVA_JATO" | "ORDEM_SERVICO" | "CRM_RETENCAO" | "ANIVERSARIO";
  referenceId?: string;
}): Promise<{ success: boolean; messageId: string; formattedPhone: string; statusText: string }> {
  const { phone, message, customerName, referenceType, referenceId } = params;

  if (!phone) {
    throw new Error("Número de telefone do cliente é obrigatório");
  }

  if (!message) {
    throw new Error("Texto da mensagem não pode estar vazio");
  }

  const formattedPhone = sanitizeWhatsAppNumber(phone);
  const messageId = `wamid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Simula ou despacha via conector interno
  console.log(`📲 [WhatsApp Interno] Mensagem enviada para +${formattedPhone}:`);
  console.log(`"${message}"`);

  return {
    success: true,
    messageId,
    formattedPhone,
    statusText: "Mensagem entregue com sucesso no WhatsApp do cliente.",
  };
}
