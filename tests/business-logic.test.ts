import { describe, it, expect } from "vitest";
import { generateWhatsappLink } from "@/lib/whatsapp";
import { SAAS_PLANS } from "@/lib/mercadopago";

describe("Business Logic & Financial Calculations Tests", () => {
  describe("Cálculos de Ordem de Serviço (OS)", () => {
    it("deve somar peças, serviços, abater descontos e apurar saldo devedor", () => {
      const items = [
        { type: "PECA", quantity: 2, unitPrice: 150, totalPrice: 300 },
        { type: "SERVICO", quantity: 1, unitPrice: 200, totalPrice: 200 },
      ];
      const discount = 50;

      const totalParts = items
        .filter((i) => i.type === "PECA")
        .reduce((sum, i) => sum + i.totalPrice, 0);

      const totalServices = items
        .filter((i) => i.type === "SERVICO")
        .reduce((sum, i) => sum + i.totalPrice, 0);

      const grandTotal = Math.max(0, totalParts + totalServices - discount);

      expect(totalParts).toBe(300);
      expect(totalServices).toBe(200);
      expect(grandTotal).toBe(450); // 300 + 200 - 50

      // Pagamento parcial (sinal)
      const paidAmount = 150;
      const remainingBalance = Math.max(0, grandTotal - paidAmount);
      const paymentStatus = remainingBalance <= 0 ? "PAGO" : "PARCIAL";

      expect(remainingBalance).toBe(300);
      expect(paymentStatus).toBe("PARCIAL");
    });
  });

  describe("Cálculos de PDV Balcão (Troco e Descontos)", () => {
    it("deve calcular troco corretamente quando o cliente paga em dinheiro", () => {
      const subtotal = 120;
      const discount = 10;
      const grandTotal = subtotal - discount; // 110
      const paidInCash = 150;

      const change = Math.max(0, paidInCash - grandTotal);
      expect(change).toBe(40);
    });

    it("não deve gerar troco negativo se o valor pago for menor ou igual", () => {
      const grandTotal = 110;
      const paidInCash = 110;
      const change = Math.max(0, paidInCash - grandTotal);
      expect(change).toBe(0);
    });
  });

  describe("Estoque & Formação de Preço de Venda", () => {
    it("deve calcular preço de venda com base no custo e margem percentual", () => {
      const costPrice = 80.0;
      const profitMargin = 50.0; // 50%
      const salePrice = costPrice * (1 + profitMargin / 100);

      expect(salePrice).toBe(120.0);
    });
  });

  describe("Fechamento de Caixa & Conferência de Gaveta", () => {
    it("deve calcular saldo esperado e identificar sobras ou faltas", () => {
      const initialBalance = 200.0; // Fundo de troco
      const cashIn = 500.0; // Vendas em dinheiro
      const cashOut = 50.0; // Sangria
      const expectedBalance = initialBalance + cashIn - cashOut; // 650.0

      expect(expectedBalance).toBe(650.0);

      const informedDrawerCash = 650.0;
      const diff = informedDrawerCash - expectedBalance;
      expect(diff).toBe(0); // Caixa bateu 100%
    });

    it("deve acusar falta de dinheiro se gaveta tiver menos que o esperado", () => {
      const expectedBalance = 650.0;
      const informedDrawerCash = 600.0; // Faltam 50
      const diff = informedDrawerCash - expectedBalance;
      expect(diff).toBe(-50.0);
    });
  });

  describe("Algoritmo de Curva ABC", () => {
    it("deve classificar itens por percentual acumulado de receita", () => {
      const products = [
        { name: "Motor", revenue: 7000 },
        { name: "Pastilha", revenue: 2000 },
        { name: "Palheta", revenue: 1000 },
      ];
      const totalRevenue = 10000;

      let accumulated = 0;
      const classified = products.map((p) => {
        accumulated += p.revenue;
        const pct = (accumulated / totalRevenue) * 100;
        let cls = "C";
        if (pct <= 70) cls = "A";
        else if (pct <= 90) cls = "B";
        return { name: p.name, classification: cls, pct };
      });

      expect(classified[0].classification).toBe("A"); // 70%
      expect(classified[1].classification).toBe("B"); // 90%
      expect(classified[2].classification).toBe("C"); // 100%
    });
  });

  describe("WhatsApp CRM URL Builder", () => {
    it("deve gerar link de WhatsApp correto com texto codificado em URL", () => {
      const link = generateWhatsappLink("11987654321", "Olá Roberto! Seu carro está pronto.");
      expect(link).toContain("https://wa.me/5511987654321");
      expect(link).toContain(encodeURIComponent("Olá Roberto! Seu carro está pronto."));
    });
  });

  describe("Regras de Planos SaaS", () => {
    it("deve manter os limites oficiais de usuários em 1, 4 e 10", () => {
      expect(SAAS_PLANS.STARTER.maxUsers).toBe(1);
      expect(SAAS_PLANS.PRO.maxUsers).toBe(4);
      expect(SAAS_PLANS.ELITE.maxUsers).toBe(10);
    });

    it("deve manter preços oficiais dos planos Pro e Elite", () => {
      expect(SAAS_PLANS.PRO.price).toBe(69.9);
      expect(SAAS_PLANS.ELITE.price).toBe(129.9);
    });
  });
});
