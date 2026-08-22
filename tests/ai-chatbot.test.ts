import { describe, it, expect } from "vitest";
import {
  queryLocalKnowledge,
  getContextualSuggestions,
  SYSTEM_PROMPT,
} from "../src/lib/ai-knowledge";

describe("Torque IA - Engine de Conhecimento e Suporte Inteligente", () => {
  it("deve conter um System Prompt estruturado para o ecossistema Torque ERP", () => {
    expect(SYSTEM_PROMPT).toContain("Torque IA");
    expect(SYSTEM_PROMPT).toContain("Oficina");
    expect(SYSTEM_PROMPT).toContain("Lava-Jato");
    expect(SYSTEM_PROMPT).toContain("PDV");
    expect(SYSTEM_PROMPT).toContain("WhatsApp");
  });

  it("deve responder dúvidas sobre Ordens de Serviço (OS) com guia passo a passo e atalho", () => {
    const res = queryLocalKnowledge("Como abrir uma nova OS de conserto?");
    expect(res.reply).toContain("Ordem de Serviço");
    expect(res.actions).toBeDefined();
    expect(res.actions?.some((a) => a.url === "/oficina")).toBe(true);
    expect(res.suggestions?.length).toBeGreaterThan(0);
  });

  it("deve responder dúvidas sobre conexão de WhatsApp com passos do QR Code", () => {
    const res = queryLocalKnowledge("como conectar o whatsapp com qr code?");
    expect(res.reply).toContain("QR Code");
    expect(res.actions?.some((a) => a.url === "/crm")).toBe(true);
  });

  it("deve responder dúvidas sobre Vendas no Balcão (PDV)", () => {
    const res = queryLocalKnowledge("como vender pecas no balcao pdv?");
    expect(res.reply).toContain("PDV");
    expect(res.actions?.some((a) => a.url === "/pdv")).toBe(true);
  });

  it("deve responder dúvidas sobre Planos e Assinatura", () => {
    const res = queryLocalKnowledge("quais sao os precos e planos para assinar?");
    expect(res.reply).toContain("Starter");
    expect(res.reply).toContain("Torque Oficina Pro");
    expect(res.actions?.some((a) => a.url === "/assinatura")).toBe(true);
  });

  it("deve gerar sugestões contextuais conforme a rota atual", () => {
    const oficinaSug = getContextualSuggestions("/oficina");
    expect(oficinaSug.some((s) => s.includes("OS"))).toBe(true);

    const pdvSug = getContextualSuggestions("/pdv");
    expect(pdvSug.some((s) => s.includes("venda"))).toBe(true);

    const crmSug = getContextualSuggestions("/crm");
    expect(crmSug.some((s) => s.includes("WhatsApp"))).toBe(true);
  });

  it("deve fornecer resposta orientada e atalhos mesmo para perguntas gerais ou desconhecidas", () => {
    const res = queryLocalKnowledge("como funciona o torque erp?");
    expect(res.reply).toContain("Torque IA");
    expect(res.actions?.length).toBeGreaterThan(0);
  });
});
