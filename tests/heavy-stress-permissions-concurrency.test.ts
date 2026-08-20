import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS_MAP, ROLE_CONFIG, AccessLevel } from "@/lib/permissions";
import { ensureTenantDefaults } from "@/lib/tenant";

describe("Heavy Stress & Role Permissions Multi-Tenant Test Suite", () => {
  const tenantA = `tenant_test_a_${Date.now()}`;
  const tenantB = `tenant_test_b_${Date.now()}`;

  beforeAll(async () => {
    await prisma.tenant.create({
      data: {
        id: tenantA,
        name: "Oficina Alfa Performance",
        ownerEmail: `alfa_${Date.now()}@teste.com`,
        ownerName: "Carlos Mecânico",
      },
    });

    await prisma.tenant.create({
      data: {
        id: tenantB,
        name: "Lava-Jato Beta Prime",
        ownerEmail: `beta_${Date.now()}@teste.com`,
        ownerName: "Marcos Estética",
      },
    });

    await ensureTenantDefaults(tenantA, "Oficina Alfa Performance");
    await ensureTenantDefaults(tenantB, "Lava-Jato Beta Prime");
  });

  afterAll(async () => {
    await prisma.standardService.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await prisma.serviceOrder.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await prisma.product.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await prisma.washTicket.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await prisma.vehicle.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await prisma.customer.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await prisma.workshopSetting.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB] } } });
  });

  describe("1. Matriz Granular de Acesso por Cargo (RBAC)", () => {
    it("deve validar todas as rotas permitidas e bloqueadas por cargo", () => {
      expect(PERMISSIONS_MAP.ADMIN).toEqual(
        expect.arrayContaining(["/", "/oficina", "/lavajato", "/pdv", "/estoque", "/financeiro", "/configuracoes", "/equipe", "/crm", "/relatorios", "/servicos"])
      );

      expect(PERMISSIONS_MAP.GERENTE).toContain("/financeiro");
      expect(PERMISSIONS_MAP.GERENTE).toContain("/oficina");
      expect(PERMISSIONS_MAP.GERENTE).toContain("/lavajato");

      expect(PERMISSIONS_MAP.ATENDENTE).toContain("/clientes");
      expect(PERMISSIONS_MAP.ATENDENTE).toContain("/oficina");
      expect(PERMISSIONS_MAP.ATENDENTE).toContain("/lavajato");
      expect(PERMISSIONS_MAP.ATENDENTE).toContain("/pdv");
      expect(PERMISSIONS_MAP.ATENDENTE).not.toContain("/financeiro");
      expect(PERMISSIONS_MAP.ATENDENTE).not.toContain("/configuracoes");

      expect(PERMISSIONS_MAP.MECANICO).toContain("/oficina");
      expect(PERMISSIONS_MAP.MECANICO).toContain("/servicos");
      expect(PERMISSIONS_MAP.MECANICO).not.toContain("/financeiro");
      expect(PERMISSIONS_MAP.MECANICO).not.toContain("/lavajato");
      expect(PERMISSIONS_MAP.MECANICO).not.toContain("/pdv");

      expect(PERMISSIONS_MAP.LAVADOR).toContain("/lavajato");
      expect(PERMISSIONS_MAP.LAVADOR).not.toContain("/oficina");
      expect(PERMISSIONS_MAP.LAVADOR).not.toContain("/financeiro");
      expect(PERMISSIONS_MAP.LAVADOR).not.toContain("/estoque");
      expect(PERMISSIONS_MAP.LAVADOR).not.toContain("/pdv");
    });
  });

  describe("2. Isolamento Rígido de Dados Multi-Tenant", () => {
    it("deve garantir que tabelas de serviços e modificações são 100% isoladas", async () => {
      const servA = await prisma.standardService.findFirst({ where: { tenantId: tenantA } });
      expect(servA).toBeDefined();

      if (servA) {
        await prisma.standardService.update({
          where: { id: servA.id },
          data: { defaultPrice: 999.90, name: "Serviço Modificado Alfa" },
        });
      }

      const servB = await prisma.standardService.findFirst({
        where: { tenantId: tenantB, name: "Serviço Modificado Alfa" },
      });
      expect(servB).toBeNull();

      const countA = await prisma.standardService.count({ where: { tenantId: tenantA } });
      const countB = await prisma.standardService.count({ where: { tenantId: tenantB } });
      expect(countA).toBeGreaterThanOrEqual(12);
      expect(countB).toBeGreaterThanOrEqual(12);
    });
  });

  describe("3. Teste de Carga e Estresse Concorrente (Operações Paralelas)", () => {
    it("deve processar centenas de cadastros, movimentações e consultas em paralelo sem travamento", async () => {
      const startTime = Date.now();

      const customerPromises = Array.from({ length: 40 }).map((_, i) =>
        prisma.customer.create({
          data: {
            tenantId: i % 2 === 0 ? tenantA : tenantB,
            name: `Cliente Estresse ${i}`,
            phone: `1198888${i.toString().padStart(4, "0")}`,
            document: `000000000${i.toString().padStart(2, "0")}`,
          },
        })
      );
      await Promise.all(customerPromises);

      const productPromises = Array.from({ length: 40 }).map((_, i) =>
        prisma.product.create({
          data: {
            tenantId: i % 2 === 0 ? tenantA : tenantB,
            name: `Peça de Teste ${i}`,
            costPrice: 50.0,
            salePrice: 120.0,
            currentStock: 100,
            minStock: 5,
          },
        })
      );
      const createdProducts = await Promise.all(productPromises);

      const stockUpdates = createdProducts.map((p) =>
        prisma.product.update({
          where: { id: p.id },
          data: { currentStock: { decrement: 3 } },
        })
      );
      const updatedProducts = await Promise.all(stockUpdates);
      updatedProducts.forEach((p) => {
        expect(p.currentStock).toBe(97);
      });

      // Cria um veículo base para associar os tickets de lavagem
      const washCustomer = await prisma.customer.create({
        data: {
          tenantId: tenantA,
          name: "Cliente Base Lava-Jato",
          phone: "11999990000",
        },
      });
      const washVehicle = await prisma.vehicle.create({
        data: {
          tenantId: tenantA,
          plate: "WAS0X00",
          brand: "Toyota",
          model: "Corolla",
          customerId: washCustomer.id,
        },
      });

      const washPromises = Array.from({ length: 40 }).map((_, i) =>
        prisma.washTicket.create({
          data: {
            tenantId: tenantA,
            ticketNumber: 3000 + i,
            serviceType: "Lavagem Completa",
            price: 60.0,
            status: "FINALIZADO",
            vehicleId: washVehicle.id,
            paymentStatus: "PAGO",
            paymentMethod: "PIX",
          },
        })
      );
      await Promise.all(washPromises);

      const totalWashes = await prisma.washTicket.count({ where: { tenantId: tenantA } });
      expect(totalWashes).toBe(40);

      const durationMs = Date.now() - startTime;
      console.log(`⏱️ Bateria de 160 operações de estresse concluída em ${durationMs}ms`);
      expect(durationMs).toBeLessThan(15000);
    });
  });
});
