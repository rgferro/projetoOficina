import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "@/lib/auth";
import { validateCPF, validateCNPJ, validatePasswordStrength } from "@/lib/validation";
import { formatCurrency, formatPlate, formatPhone, formatDateTime, sanitizeDigits } from "@/lib/formatters";
import { generateWhatsappLink, buildWashReadyMessage, buildOsReadyMessage } from "@/lib/whatsapp";
import { SAAS_PLANS } from "@/lib/mercadopago";

const prisma = new PrismaClient();

describe("E2E & UI Flow Heavy Integration Tests Suite", () => {
  const timestamp = Date.now();
  const testTenantEmail = `oficina.e2e.${timestamp}@torque.com.br`;
  let testTenantId: string;
  let testCustomerId: string;
  let testVehicleId: string;
  let testEmployeeId: string;
  let testProductId: string;
  let testSupplierId: string;

  beforeAll(async () => {
    // 1. Cadastra Tenant de Teste com IP e Auditoria
    const passwordHash = hashPassword("SenhaForte@2026");
    const tenant = await prisma.tenant.create({
      data: {
        name: "Oficina E2E Testes Automatizados",
        document: "12.345.678/0001-90",
        ownerName: "Carlos Mecânico",
        ownerEmail: testTenantEmail,
        ownerPassword: passwordHash,
        ownerPhone: "11988887777",
        plan: "STARTER",
        maxUsers: 2,
        subscriptionStatus: "active",
        registrationIp: "189.40.120.5",
        lastLoginIp: "189.40.120.5",
      },
    });
    testTenantId = tenant.id;

    // 2. Cria Colaborador / Mecânico
    const emp = await prisma.employee.create({
      data: {
        tenantId: testTenantId,
        name: "Roberto Mecânico Chefe",
        email: `roberto.${timestamp}@torque.com.br`,
        role: "Mecânico Geral",
        accessLevel: "ADMIN",
        pinCode: "5544",
        commissionRate: 10.0,
      },
    });
    testEmployeeId = emp.id;

    // 3. Cria Fornecedor e Produto no Estoque
    const supplier = await prisma.supplier.create({
      data: {
        name: "Distribuidora de Autopeças Bosch & Nakata",
        document: "98.765.432/0001-10",
        phone: "11977776666",
        email: "vendas@distribuidora.com",
      },
    });
    testSupplierId = supplier.id;

    const product = await prisma.product.create({
      data: {
        name: "Óleo 5W30 Sintético 1L",
        category: "Óleos e Lubrificantes",
        unit: "L",
        costPrice: 28.0,
        profitMargin: 50.0,
        salePrice: 42.0,
        currentStock: 50.0,
        minStock: 10.0,
        shelfLocation: "Corredor A - Prateleira 2",
        supplierId: testSupplierId,
      },
    });
    testProductId = product.id;

    // 4. Cria Cliente e Veículo
    const customer = await prisma.customer.create({
      data: {
        name: "Maria Fernanda da Silva",
        phone: "11999991234",
        email: "maria.fernanda@gmail.com",
        document: "123.456.789-00",
      },
    });
    testCustomerId = customer.id;

    const vehicle = await prisma.vehicle.create({
      data: {
        plate: "ABC1D23",
        brand: "Honda",
        model: "Civic 2.0 LXR",
        category: "Sedan",
        currentKm: 78500,
        customerId: testCustomerId,
      },
    });
    testVehicleId = vehicle.id;
  });

  afterAll(async () => {
    // Limpeza de todos os dados de teste gerados
    await prisma.stockMovement.deleteMany({ where: { productId: testProductId } });
    await prisma.serviceOrderItem.deleteMany({ where: { serviceOrder: { customerId: testCustomerId } } });
    await prisma.serviceOrderPhoto.deleteMany({ where: { serviceOrder: { customerId: testCustomerId } } });
    await prisma.serviceOrderPayment.deleteMany({ where: { serviceOrder: { customerId: testCustomerId } } });
    await prisma.serviceOrder.deleteMany({ where: { customerId: testCustomerId } });
    await prisma.washTicket.deleteMany({ where: { vehicleId: testVehicleId } });
    await prisma.saleItem.deleteMany({ where: { productId: testProductId } });
    await prisma.sale.deleteMany({ where: { customerId: testCustomerId } });
    await prisma.financialTransaction.deleteMany({});
    await prisma.product.deleteMany({ where: { id: testProductId } });
    await prisma.supplier.deleteMany({ where: { id: testSupplierId } });
    await prisma.vehicle.deleteMany({ where: { id: testVehicleId } });
    await prisma.customer.deleteMany({ where: { id: testCustomerId } });
    await prisma.employee.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.auditLog.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.subscriptionPayment.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.tenant.deleteMany({ where: { id: testTenantId } });
    await prisma.$disconnect();
  });

  // -------------------------------------------------------------
  // FLUXO 1: Autenticação, Tokens JWT e Segurança
  // -------------------------------------------------------------
  describe("Fluxo 1: Autenticação, Sessão e Criptografia", () => {
    it("deve validar força de senha (mínimo 8 dígitos, maiúscula, minúscula, número e símbolo)", () => {
      expect(validatePasswordStrength("123456").isValid).toBe(false);
      expect(validatePasswordStrength("fraca").isValid).toBe(false);
      expect(validatePasswordStrength("SenhaForte@2026").isValid).toBe(true);
    });

    it("deve hashear senha com PBKDF2 + Salt e verificar com sucesso", () => {
      const pwd = "MinhaSenhaSecreta@99";
      const hash = hashPassword(pwd);
      expect(hash).toContain(":");
      expect(verifyPassword(pwd, hash)).toBe(true);
      expect(verifyPassword("senhaErrada", hash)).toBe(false);
    });

    it("deve gerar e verificar JWT de sessão com payload completo", () => {
      const sessionPayload = {
        userId: testEmployeeId,
        tenantId: testTenantId,
        name: "Carlos Mecânico",
        email: testTenantEmail,
        role: "Administrador da Oficina",
        accessLevel: "ADMIN" as const,
        isMaster: false,
        workshopName: "Oficina E2E Testes Automatizados",
        plan: "STARTER",
      };

      const token = createSessionToken(sessionPayload);
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);

      const decoded = verifySessionToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.tenantId).toBe(testTenantId);
      expect(decoded?.email).toBe(testTenantEmail);
      expect(decoded?.plan).toBe("STARTER");
    });
  });

  // -------------------------------------------------------------
  // FLUXO 2: Validações Oficiais (CPF, CNPJ, Formatadores)
  // -------------------------------------------------------------
  describe("Fluxo 2: Validações Oficiais (Receita Federal / Módulo 11) & Formatadores", () => {
    it("deve validar CPFs válidos e rejeitar inválidos", () => {
      expect(validateCPF("11144477735")).toBe(true);
      expect(validateCPF("11111111111")).toBe(false); // Dígitos iguais repetidos
      expect(validateCPF("12345678900")).toBe(false); // Dígito verificador inválido
    });

    it("deve validar CNPJs válidos e rejeitar inválidos", () => {
      expect(validateCNPJ("11222333000181")).toBe(true);
      expect(validateCNPJ("00000000000000")).toBe(false);
      expect(validateCNPJ("12345678000199")).toBe(false);
    });

    it("deve formatar moedas, placas Mercosul e telefones", () => {
      expect(formatCurrency(1549.9).replace(/\s+/g, " ")).toBe("R$ 1.549,90");
      expect(formatPlate("abc1d23")).toBe("ABC-1D23");
      expect(formatPhone("11988887777")).toBe("(11) 98888-7777");
      expect(sanitizeDigits(" (11) 9.8888-7777 ")).toBe("11988887777");
    });
  });

  // -------------------------------------------------------------
  // FLUXO 3: Ordem de Serviço 2.0 (Criação, Peças, Serviços, Estoque e Fechamento)
  // -------------------------------------------------------------
  describe("Fluxo 3: Ordem de Serviço Completa (OS 2.0)", () => {
    let createdOsId: string;

    it("deve criar uma Ordem de Serviço com peças, serviços, defeito relatado e laudo técnico", async () => {
      const os = await prisma.serviceOrder.create({
        data: {
          osNumber: 5001,
          customerId: testCustomerId,
          vehicleId: testVehicleId,
          employeeId: testEmployeeId,
          status: "EM_EXECUCAO",
          entryKm: 78550,
          defectClaimed: "Barulho metálico na dianteira ao frear e luz do óleo piscando",
          defectFound: "Pastilhas de freio gastas no osso e vazamento leve no bujão de óleo",
          problemDescription: "Barulho metálico na dianteira ao frear",
          technicalReport: "Substituição de pastilhas dianteiras e troca de óleo 5W30 + filtro",
          discount: 20.0,
          totalParts: 168.0, // 4 litros de óleo a R$ 42,00
          totalServices: 150.0, // Mão de obra troca de óleo + pastilhas
          grandTotal: 298.0, // 168 + 150 - 20 = 298.00
          paidAmount: 0.0,
          remainingBalance: 298.0,
          paymentStatus: "PENDENTE",
          items: {
            create: [
              {
                type: "PECA",
                name: "Óleo 5W30 Sintético 1L",
                quantity: 4,
                unitPrice: 42.0,
                totalPrice: 168.0,
                productId: testProductId,
                employeeId: testEmployeeId,
              },
              {
                type: "SERVICO",
                name: "Mão de Obra Troca de Óleo e Filtros",
                quantity: 1,
                unitPrice: 150.0,
                totalPrice: 150.0,
                employeeId: testEmployeeId,
                commissionRate: 10.0,
              },
            ],
          },
        },
      });

      createdOsId = os.id;
      expect(os.id).toBeDefined();
      expect(os.grandTotal).toBe(298.0);
      expect(os.status).toBe("EM_EXECUCAO");

      // Baixa automática de 4 unidades do estoque do produto
      await prisma.product.update({
        where: { id: testProductId },
        data: { currentStock: { decrement: 4 } },
      });
      await prisma.stockMovement.create({
        data: {
          productId: testProductId,
          type: "ORDEM_SERVICO",
          quantity: -4,
          description: `Baixa automática referente à OS #${os.osNumber}`,
        },
      });

      const updatedProduct = await prisma.product.findUnique({ where: { id: testProductId } });
      expect(updatedProduct?.currentStock).toBe(46.0); // 50 - 4 = 46
    });

    it("deve liquidar pagamento da OS (PIX), atualizar status para CONCLUIDO e lançar no Financeiro", async () => {
      // 1. Registra pagamento
      const payment = await prisma.serviceOrderPayment.create({
        data: {
          serviceOrderId: createdOsId,
          amount: 298.0,
          paymentMethod: "PIX",
          notes: "Pagamento total via PIX",
        },
      });

      expect(payment.amount).toBe(298.0);

      // 2. Atualiza OS para CONCLUIDO e PAGO
      const updatedOs = await prisma.serviceOrder.update({
        where: { id: createdOsId },
        data: {
          status: "CONCLUIDO",
          paidAmount: 298.0,
          remainingBalance: 0.0,
          paymentStatus: "PAGO",
          completedAt: new Date(),
        },
      });

      expect(updatedOs.paymentStatus).toBe("PAGO");
      expect(updatedOs.remainingBalance).toBe(0.0);

      // 3. Registra transação no Caixa / Financeiro
      const tx = await prisma.financialTransaction.create({
        data: {
          description: `Recebimento OS #${updatedOs.osNumber} - Maria Fernanda da Silva`,
          amount: 298.0,
          type: "RECEITA",
          category: "ORDEM_SERVICO",
          paymentMethod: "PIX",
          serviceOrderId: createdOsId,
        },
      });

      expect(tx.id).toBeDefined();
      expect(tx.amount).toBe(298.0);
    });

    it("deve gerar mensagem oficial de WhatsApp para OS Pronta", () => {
      const msg = buildOsReadyMessage({
        name: "Maria Fernanda da Silva",
        osNumber: 5001,
        vehiclePlate: "ABC-1D23",
        vehicleModel: "Honda Civic 2.0 LXR",
        total: 298.0,
        pending: 0.0,
        workshopName: "AutoGestão Oficina Especializada",
      });

      expect(msg).toContain("Maria");
      expect(msg).toContain("5001");
      expect(msg).toContain("ABC-1D23");
      expect(msg).toContain("AutoGestão Oficina Especializada");
    });
  });

  // -------------------------------------------------------------
  // FLUXO 4: Lava-Jato & Lavagem Rápida Express
  // -------------------------------------------------------------
  describe("Fluxo 4: Lava-Jato & Lavagens de Veículos", () => {
    let ticketId: string;

    it("deve registrar entrada no Lava-Jato com status AGUARDANDO", async () => {
      const ticket = await prisma.washTicket.create({
        data: {
          ticketNumber: 2001,
          serviceType: "Lavagem Completa com Cera",
          price: 90.0,
          vehicleId: testVehicleId,
          employeeId: testEmployeeId,
          status: "AGUARDANDO",
          enteredAt: new Date(),
        },
      });

      ticketId = ticket.id;
      expect(ticket.id).toBeDefined();
      expect(ticket.price).toBe(90.0);
      expect(ticket.status).toBe("AGUARDANDO");
    });

    it("deve avançar status para EM_LAVAGEM e finalizar com WhatsApp gerado", async () => {
      // Atualiza para EM_LAVAGEM
      await prisma.washTicket.update({
        where: { id: ticketId },
        data: { status: "EM_LAVAGEM" },
      });

      // Finaliza a lavagem
      const finishedTicket = await prisma.washTicket.update({
        where: { id: ticketId },
        data: {
          status: "FINALIZADO",
          finishedAt: new Date(),
          paymentStatus: "PAGO",
          paymentMethod: "CARTAO_CREDITO",
        },
      });

      expect(finishedTicket.status).toBe("FINALIZADO");
      expect(finishedTicket.paymentStatus).toBe("PAGO");

      // Gera mensagem de WhatsApp de Lavagem Pronta
      const waMsg = buildWashReadyMessage({
        customerName: "Maria Fernanda",
        vehicleName: "Honda Civic",
        plate: "ABC-1D23",
        price: 90.0,
        workshopName: "AutoGestão Lava-Jato VIP",
      });

      expect(waMsg).toContain("Maria");
      expect(waMsg).toContain("ABC-1D23");
      expect(waMsg).toContain("R$ 90,00");
    });
  });

  // -------------------------------------------------------------
  // FLUXO 5: PDV Balcão, Fechamento de Venda e Estoque
  // -------------------------------------------------------------
  describe("Fluxo 5: PDV Balcão & Venda Direta de Peças", () => {
    it("deve realizar venda PDV de 2 óleos, abater estoque e registrar no financeiro", async () => {
      const sale = await prisma.sale.create({
        data: {
          customerId: testCustomerId,
          employeeId: testEmployeeId,
          totalAmount: 84.0, // Subtotal
          discount: 4.0,
          grandTotal: 80.0,
          paidAmount: 80.0,
          paymentMethod: "DINHEIRO",
          items: {
            create: [
              {
                name: "Óleo 5W30 Sintético 1L",
                productId: testProductId,
                quantity: 2,
                unitPrice: 42.0,
                totalPrice: 84.0,
              },
            ],
          },
        },
      });

      expect(sale.id).toBeDefined();
      expect(sale.grandTotal).toBe(80.0);

      // Baixa estoque PDV
      await prisma.product.update({
        where: { id: testProductId },
        data: { currentStock: { decrement: 2 } },
      });

      const prod = await prisma.product.findUnique({ where: { id: testProductId } });
      expect(prod?.currentStock).toBe(44.0); // 46 - 2 = 44
    });
  });

  // -------------------------------------------------------------
  // FLUXO 6: Assinaturas SaaS, Mercado Pago e Preços
  // -------------------------------------------------------------
  describe("Fluxo 6: Assinaturas SaaS & Mercado Pago", () => {
    it("deve carregar os planos STARTER, PRO, ELITE e EXTRA_SEAT com valores corretos", () => {
      expect(SAAS_PLANS.STARTER.price).toBe(0);
      expect(SAAS_PLANS.STARTER.maxUsers).toBe(2);

      expect(SAAS_PLANS.PRO.price).toBe(69.9);
      expect(SAAS_PLANS.PRO.maxUsers).toBe(4);

      expect(SAAS_PLANS.ELITE.price).toBe(129.9);
      expect(SAAS_PLANS.ELITE.maxUsers).toBe(8);

      expect(SAAS_PLANS.EXTRA_SEAT.price).toBe(14.9);
    });

    it("deve registrar pagamento de assinatura de upgrade para o Plano PRO", async () => {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);

      const subPayment = await prisma.subscriptionPayment.create({
        data: {
          tenantId: testTenantId,
          amount: 69.9,
          status: "approved",
          method: "pix",
          plan: "PRO",
          paidAt: new Date(),
        },
      });

      expect(subPayment.id).toBeDefined();
      expect(subPayment.status).toBe("approved");

      // Atualiza o tenant para PRO
      const updated = await prisma.tenant.update({
        where: { id: testTenantId },
        data: {
          plan: "PRO",
          subscriptionStatus: "active",
          subscriptionExpiresAt: nextMonth,
          maxUsers: 4,
        },
      });

      expect(updated.plan).toBe("PRO");
      expect(updated.maxUsers).toBe(4);
    });
  });
});
