import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatPlate,
  formatPhone,
  formatDocument,
  formatDate,
  formatDateTime,
} from "@/lib/formatters";

describe("Formatters Library Tests", () => {
  describe("formatCurrency", () => {
    it("deve formatar valores monetários em Real (BRL)", () => {
      const formatted = formatCurrency(1250.5);
      // Remove espaços não separáveis que o Intl às vezes usa
      const normalized = formatted.replace(/\u00a0/g, " ");
      expect(normalized).toContain("1.250,50");
      expect(normalized).toContain("R$");
    });

    it("deve tratar valor zero, null e undefined com segurança", () => {
      expect(formatCurrency(0).replace(/\u00a0/g, " ")).toContain("0,00");
      expect(formatCurrency(null).replace(/\u00a0/g, " ")).toContain("0,00");
      expect(formatCurrency(undefined).replace(/\u00a0/g, " ")).toContain("0,00");
    });
  });

  describe("formatPlate", () => {
    it("deve formatar placa Mercosul e tradicional com hífen", () => {
      expect(formatPlate("BRA2E19")).toBe("BRA-2E19");
      expect(formatPlate("ABC1234")).toBe("ABC-1234");
    });

    it("deve limpar caracteres especiais da placa", () => {
      expect(formatPlate("bra-2e19")).toBe("BRA-2E19");
      expect(formatPlate("abc 1234")).toBe("ABC-1234");
    });

    it("deve retornar vazio se a placa for nula", () => {
      expect(formatPlate("")).toBe("");
      expect(formatPlate(null)).toBe("");
    });
  });

  describe("formatPhone", () => {
    it("deve formatar celular com DDD (11 dígitos)", () => {
      expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
    });

    it("deve formatar telefone fixo com DDD (10 dígitos)", () => {
      expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
    });

    it("deve retornar vazio para entradas vazias", () => {
      expect(formatPhone("")).toBe("");
      expect(formatPhone(null)).toBe("");
    });
  });

  describe("formatDocument", () => {
    it("deve formatar CPF com pontuação (11 dígitos)", () => {
      expect(formatDocument("12345678900")).toBe("123.456.789-00");
    });

    it("deve formatar CNPJ com pontuação (14 dígitos)", () => {
      expect(formatDocument("12345678000190")).toBe("12.345.678/0001-90");
    });
  });

  describe("formatDate & formatDateTime", () => {
    it("deve formatar data no padrão brasileiro DD/MM/AAAA", () => {
      const d = new Date(2026, 7, 14, 10, 30);
      const res = formatDate(d);
      expect(res).toBe("14/08/2026");
    });

    it("deve formatar data e hora DD/MM/AAAA HH:mm", () => {
      const d = new Date(2026, 7, 14, 15, 45);
      const res = formatDateTime(d);
      expect(res).toContain("14/08/2026");
      expect(res).toContain("15:45");
    });
  });
});
