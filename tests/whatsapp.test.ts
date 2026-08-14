import { describe, it, expect } from "vitest";
import {
  sanitizeWhatsAppNumber,
  sendSilentWhatsAppMessage,
  getWhatsAppSession,
  connectWhatsAppSession,
  disconnectWhatsAppSession,
} from "@/lib/whatsappService";
import { generateWhatsappLink } from "@/lib/whatsapp";

describe("WhatsApp Silent & Deep-link Integration Tests", () => {
  it("deve sanitizar e formatar números com e sem DDD/DDI", () => {
    expect(sanitizeWhatsAppNumber("11987654321")).toBe("5511987654321");
    expect(sanitizeWhatsAppNumber("(11) 98765-4321")).toBe("5511987654321");
    expect(sanitizeWhatsAppNumber("+55 11 98765-4321")).toBe("5511987654321");
    expect(sanitizeWhatsAppNumber("5511987654321")).toBe("5511987654321");
  });

  it("deve enviar mensagem de WhatsApp silenciosa internamente sem erros", async () => {
    const result = await sendSilentWhatsAppMessage({
      phone: "11987654321",
      message: "Seu carro está pronto para retirada no Lava-Jato!",
      customerName: "Carlos Souza",
      referenceType: "LAVA_JATO",
    });

    expect(result.success).toBe(true);
    expect(result.formattedPhone).toBe("5511987654321");
    expect(result.messageId).toContain("wamid_");
    expect(result.statusText).toContain("sucesso");
  });

  it("deve gerenciar sessão de conexão de WhatsApp e ciclo de vida", async () => {
    connectWhatsAppSession("+55 (11) 99999-8888");
    let session = await getWhatsAppSession();
    expect(session.status).toBe("CONNECTED");
    expect(session.connectedNumber).toBe("+55 (11) 99999-8888");

    await disconnectWhatsAppSession();
    session = await getWhatsAppSession();
    expect(["DISCONNECTED", "CONNECTING", "QR_READY"]).toContain(session.status);
  });

  it("deve gerar URL de fallback wa.me com encode seguro", () => {
    const link = generateWhatsappLink("11987654321", "Olá!");
    expect(link).toBe("https://wa.me/5511987654321?text=Ol%C3%A1!");
  });
});
