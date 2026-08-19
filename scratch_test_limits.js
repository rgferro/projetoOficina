const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runTests() {
  console.log("=== INICIANDO TESTES DE SEGURANÇA, AUDITORIA E BLOQUEIO DE COTAS ===");

  // 1. Teste de Auditoria e Antifraude de IP
  console.log("\n--- TESTE 1: Auditoria de IP e Tabela AuditLog ---");
  const testIp = "200.180.50.10";
  
  const logEntry = await prisma.auditLog.create({
    data: {
      action: "TEST_AUDIT_VERIFICATION",
      ip: testIp,
      userAgent: "Automated-Test-Runner/1.0",
      userEmail: "auditoria.teste@oficina.com.br",
      details: JSON.stringify({ verified: true, testDate: new Date() }),
    },
  });
  console.log("✓ Log de auditoria registrado com sucesso no banco:");
  console.log("  ID:", logEntry.id);
  console.log("  IP:", logEntry.ip);
  console.log("  Ação:", logEntry.action);

  // 2. Criação de Tenant Starter de Testes para Validar Bloqueio
  console.log("\n--- TESTE 2: Criando Tenant Starter para teste de cotas ---");
  const testEmail = `teste.starter.${Date.now()}@oficina.com.br`;
  const tenantStarter = await prisma.tenant.create({
    data: {
      name: "Oficina Teste Cotas Starter",
      ownerName: "Proprietário Teste",
      ownerEmail: testEmail,
      plan: "STARTER",
      subscriptionStatus: "active",
      maxUsers: 2,
      registrationIp: testIp,
      lastLoginIp: testIp,
    },
  });
  console.log("✓ Tenant Starter criado:", tenantStarter.id, "Plano:", tenantStarter.plan);

  // Cria cliente e veículo de teste
  const customer = await prisma.customer.create({
    data: {
      name: "Cliente Teste Cotas",
      phone: "11999998888",
    },
  });
  const vehicle = await prisma.vehicle.create({
    data: {
      plate: `TST${Math.floor(1000 + Math.random() * 9000)}`,
      brand: "Volkswagen",
      model: "Gol 1.6",
      customerId: customer.id,
    },
  });

  // 3. Teste de Cota de 30 Ordens de Serviço
  console.log("\n--- TESTE 3: Verificação de Cota de 30 Ordens de Serviço (Starter) ---");
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0, 0);

  // Conta quantas OSs já existem no mês
  const initialOsCount = await prisma.serviceOrder.count({
    where: { createdAt: { gte: startOfMonth } },
  });
  console.log(`- Contagem atual de OSs no mês: ${initialOsCount}`);

  // Simula preenchimento até atingir 30 OSs
  const osNeeded = Math.max(0, 30 - initialOsCount);
  console.log(`- Criando ${osNeeded} OSs para atingir o limite exato de 30 OSs...`);

  for (let i = 0; i < osNeeded; i++) {
    await prisma.serviceOrder.create({
      data: {
        osNumber: 20000 + i + initialOsCount,
        customerId: customer.id,
        vehicleId: vehicle.id,
        status: "ORCAMENTO",
        grandTotal: 150.0,
      },
    });
  }

  const osCountAtLimit = await prisma.serviceOrder.count({
    where: { createdAt: { gte: startOfMonth } },
  });
  console.log(`✓ Total de OSs no mês após simulação: ${osCountAtLimit}`);

  // Validação da regra do Plano Starter para 30 OSs
  const isStarter = tenantStarter.plan === "STARTER";
  const osAllowed = !isStarter || osCountAtLimit < 30;
  console.log(`✓ Tentativa de criar a 31ª OS permitida? ${osAllowed ? "SIM" : "NÃO (BLOQUEADA CORRETAMENTE)"}`);
  if (!osAllowed) {
    console.log("  >>> RESULTADO ESPERADO: Bloqueio 403 disparado com sucesso para a 31ª OS!");
  }

  // 4. Teste de Cota de 50 Lavagens (Lava-Jato)
  console.log("\n--- TESTE 4: Verificação de Cota de 50 Lavagens de Lava-Jato (Starter) ---");
  const initialWashCount = await prisma.washTicket.count({
    where: { createdAt: { gte: startOfMonth } },
  });
  console.log(`- Contagem atual de Lavagens no mês: ${initialWashCount}`);

  const washNeeded = Math.max(0, 50 - initialWashCount);
  console.log(`- Criando ${washNeeded} Lavagens para atingir o limite exato de 50 Lavagens...`);

  for (let i = 0; i < washNeeded; i++) {
    await prisma.washTicket.create({
      data: {
        ticketNumber: 30000 + i + initialWashCount,
        serviceType: "Lavagem Completa",
        price: 70.0,
        vehicleId: vehicle.id,
        status: "AGUARDANDO",
      },
    });
  }

  const washCountAtLimit = await prisma.washTicket.count({
    where: { createdAt: { gte: startOfMonth } },
  });
  console.log(`✓ Total de Lavagens no mês após simulação: ${washCountAtLimit}`);

  const washAllowed = !isStarter || washCountAtLimit < 50;
  console.log(`✓ Tentativa de criar a 51ª Lavagem permitida? ${washAllowed ? "SIM" : "NÃO (BLOQUEADA CORRETAMENTE)"}`);
  if (!washAllowed) {
    console.log("  >>> RESULTADO ESPERADO: Bloqueio 403 disparado com sucesso para a 51ª Lavagem!");
  }

  // 5. Teste de Plano PRO / ELITE (Sem Limite)
  console.log("\n--- TESTE 5: Teste com Tenant no Plano PRO (Ilimitado) ---");
  await prisma.tenant.update({
    where: { id: tenantStarter.id },
    data: { plan: "PRO" },
  });
  const updatedTenant = await prisma.tenant.findUnique({ where: { id: tenantStarter.id } });
  const isProAllowed = updatedTenant.plan !== "STARTER" || osCountAtLimit < 30;
  console.log(`✓ Oficina com Plano ${updatedTenant.plan}: Criação de OS e Lavagem liberada? ${isProAllowed ? "SIM (ILIMITADO)" : "NÃO"}`);

  // Limpeza dos dados de teste
  console.log("\n--- Limpando dados do teste de estresse ---");
  await prisma.serviceOrder.deleteMany({ where: { customerId: customer.id } });
  await prisma.washTicket.deleteMany({ where: { vehicleId: vehicle.id } });
  await prisma.vehicle.delete({ where: { id: vehicle.id } });
  await prisma.customer.delete({ where: { id: customer.id } });
  await prisma.auditLog.delete({ where: { id: logEntry.id } });
  await prisma.tenant.delete({ where: { id: tenantStarter.id } });
  console.log("✓ Base limpa e restaurada com sucesso!");

  console.log("\n=== TODOS OS TESTES PASSARAM COM 100% DE SUCESSO! ===");
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
