import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando o povoamento do banco de dados (Seed)...");

  // Limpeza prévia
  await prisma.financialTransaction.deleteMany();
  await prisma.serviceOrderItem.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.washTicket.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.workshopSetting.deleteMany();

  // 1. Configurações da Oficina
  await prisma.workshopSetting.create({
    data: {
      id: "default",
      workshopName: "AutoCenter & Lava-Jato Master",
      cnpj: "23.456.789/0001-12",
      phone: "(11) 98765-4321",
      address: "Av. dos Bandeirantes, 2450 - São Paulo/SP",
      email: "contato@autocentermaster.com.br",
      warrantyDays: 90,
      whatsappWashReadyTemplate:
        "Olá {nome}! Seu {veiculo} ({placa}) já está limpo e pronto para retirada no {oficina}! 🚗✨\nValor: {valor}\nPode retirar a qualquer momento!",
      whatsappOilReminderTemplate:
        "Olá {nome}! Notamos que faz 6 meses da última revisão/troca de óleo do seu {veiculo} ({placa}). Agende sua revisão preventiva com a gente no {oficina}! 🛠️",
      whatsappWashReminderTemplate:
        "Olá {nome}! Faz {dias} dias que seu {veiculo} ({placa}) não toma aquele banho especial no {oficina}. Que tal agendar uma lavagem hoje? 🧼✨",
    },
  });

  // 2. Funcionários
  const funcCarlos = await prisma.employee.create({
    data: {
      name: "Carlos Mecânico Silva",
      role: "Mecânico Líder",
      phone: "(11) 99111-2222",
      commissionRate: 15.0,
      active: true,
    },
  });

  const funcMarcos = await prisma.employee.create({
    data: {
      name: "Marcos Vinicius",
      role: "Mecânico",
      phone: "(11) 99333-4444",
      commissionRate: 10.0,
      active: true,
    },
  });

  const funcPedro = await prisma.employee.create({
    data: {
      name: "Pedro Lavador Santos",
      role: "Lavador Especialista",
      phone: "(11) 99555-6666",
      commissionRate: 8.0,
      active: true,
    },
  });

  const funcJoao = await prisma.employee.create({
    data: {
      name: "João Batista",
      role: "Lavador",
      phone: "(11) 99777-8888",
      commissionRate: 8.0,
      active: true,
    },
  });

  // 3. Clientes e Veículos
  const cliRoberto = await prisma.customer.create({
    data: {
      name: "Roberto Albuquerque",
      phone: "(11) 98123-4567",
      email: "roberto.albuquerque@gmail.com",
      document: "123.456.789-00",
      address: "Rua das Flores, 120 - Jd. Paulista",
      vehicles: {
        create: [
          {
            plate: "BRA2E19",
            brand: "Toyota",
            model: "Corolla XEi 2.0",
            year: 2022,
            color: "Prata",
            category: "Sedan",
            currentKm: 42000,
          },
          {
            plate: "FKT9081",
            brand: "Jeep",
            model: "Compass Longitude",
            year: 2021,
            color: "Preto",
            category: "SUV",
            currentKm: 58000,
          },
        ],
      },
    },
    include: { vehicles: true },
  });

  const cliMariana = await prisma.customer.create({
    data: {
      name: "Mariana Souza Lima",
      phone: "(11) 97654-3210",
      email: "mariana.lima@outlook.com",
      document: "321.654.987-11",
      address: "Alameda Santos, 850 - Cerqueira César",
      vehicles: {
        create: [
          {
            plate: "RXT4B32",
            brand: "Honda",
            model: "HR-V Touring",
            year: 2023,
            color: "Branco Pérola",
            category: "SUV",
            currentKm: 18500,
          },
        ],
      },
    },
    include: { vehicles: true },
  });

  const cliFernando = await prisma.customer.create({
    data: {
      name: "Fernando Dias Costa",
      phone: "(11) 99876-5432",
      email: "fernando.costa@empresa.com.br",
      document: "987.123.456-22",
      address: "Av. Paulista, 1000 - Bela Vista",
      vehicles: {
        create: [
          {
            plate: "ABC1234",
            brand: "Volkswagen",
            model: "Gol 1.6 MSI",
            year: 2019,
            color: "Vermelho",
            category: "Hatch",
            currentKm: 89000,
          },
        ],
      },
    },
    include: { vehicles: true },
  });

  const cliBeatriz = await prisma.customer.create({
    data: {
      name: "Beatriz Oliveira Mendes",
      phone: "(11) 98456-7890",
      email: "beatriz.mendes@gmail.com",
      document: "456.789.123-33",
      address: "Rua Augusta, 400 - Consolação",
      vehicles: {
        create: [
          {
            plate: "MNO5X67",
            brand: "Hyundai",
            model: "Creta Prestige",
            year: 2020,
            color: "Cinza",
            category: "SUV",
            currentKm: 65000,
          },
        ],
      },
    },
    include: { vehicles: true },
  });

  // 4. Lava-Jato: Tickets Ativos e Históricos
  const corolla = cliRoberto.vehicles[0];
  const compass = cliRoberto.vehicles[1];
  const hrv = cliMariana.vehicles[0];
  const gol = cliFernando.vehicles[0];
  const creta = cliBeatriz.vehicles[0];

  // Ticket 1: AGUARDANDO
  await prisma.washTicket.create({
    data: {
      serviceType: "Lavagem Completa + Cera",
      price: 80.0,
      status: "AGUARDANDO",
      notes: "Cuidado extra com tapetes internos de veludo",
      vehicleId: corolla.id,
      employeeId: funcPedro.id,
      enteredAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min atrás
    },
  });

  // Ticket 2: EM_LAVAGEM
  await prisma.washTicket.create({
    data: {
      serviceType: "Lavagem Simples (Ducha + Aspiração)",
      price: 50.0,
      status: "EM_LAVAGEM",
      notes: "Cliente aguardando na sala de espera",
      vehicleId: hrv.id,
      employeeId: funcJoao.id,
      enteredAt: new Date(Date.now() - 60 * 60 * 1000), // 1h atrás
    },
  });

  // Ticket 3: FINALIZADO (Pronto para aviso no WhatsApp!)
  const washFinalizado = await prisma.washTicket.create({
    data: {
      serviceType: "Higienização Interna + Lavagem Geral",
      price: 180.0,
      status: "FINALIZADO",
      notes: "Cheirinho novo aplicado. Pronto para retirada.",
      vehicleId: compass.id,
      employeeId: funcPedro.id,
      enteredAt: new Date(Date.now() - 120 * 60 * 1000), // 2h atrás
      finishedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min atrás
      notifiedWhatsapp: false,
    },
  });

  // Ticket 4: ENTREGUE (com pagamento registrado no caixa de hoje)
  const washEntregue = await prisma.washTicket.create({
    data: {
      serviceType: "Lavagem Completa",
      price: 70.0,
      status: "ENTREGUE",
      paymentMethod: "PIX",
      paymentStatus: "PAGO",
      vehicleId: creta.id,
      employeeId: funcPedro.id,
      enteredAt: new Date(Date.now() - 240 * 60 * 1000),
      finishedAt: new Date(Date.now() - 120 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 60 * 60 * 1000),
      notifiedWhatsapp: true,
    },
  });

  await prisma.financialTransaction.create({
    data: {
      description: `Lavagem Ticket #${washEntregue.ticketNumber} - Hyundai Creta (${creta.plate})`,
      type: "RECEITA",
      category: "LAVA_JATO",
      amount: 70.0,
      paymentMethod: "PIX",
      washTicketId: washEntregue.id,
      date: new Date(),
    },
  });

  // Ticket 5: Lavagem Antiga (25 dias atrás) para simular alerta de CRM
  await prisma.washTicket.create({
    data: {
      serviceType: "Lavagem Completa",
      price: 60.0,
      status: "ENTREGUE",
      paymentMethod: "DINHEIRO",
      paymentStatus: "PAGO",
      vehicleId: gol.id,
      employeeId: funcJoao.id,
      enteredAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 dias atrás
      finishedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    },
  });

  // 5. Ordens de Serviço (OS)

  // OS 1: EM_EXECUCAO
  const os1 = await prisma.serviceOrder.create({
    data: {
      customerId: cliFernando.id,
      vehicleId: gol.id,
      employeeId: funcCarlos.id,
      status: "EM_EXECUCAO",
      entryKm: 89000,
      problemDescription: "Barulho metálico na roda dianteira direita ao frear e pedal duro.",
      technicalReport: "Pastilhas e discos de freio dianteiros desgastados no limite. Fluido de freio contaminado.",
      discount: 20.0,
      totalParts: 340.0,
      totalServices: 220.0,
      grandTotal: 540.0,
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            type: "PECA",
            name: "Jogo de Pastilhas de Freio Dianteiras Fras-le",
            quantity: 1,
            unitPrice: 160.0,
            totalPrice: 160.0,
          },
          {
            type: "PECA",
            name: "Par de Discos de Freio Ventilados Fremax",
            quantity: 1,
            unitPrice: 180.0,
            totalPrice: 180.0,
          },
          {
            type: "SERVICO",
            name: "Mão de Obra: Troca de Discos e Pastilhas + Sangria",
            quantity: 1,
            unitPrice: 150.0,
            totalPrice: 150.0,
          },
          {
            type: "SERVICO",
            name: "Fluido de Freio DOT 4 + Limpeza do Sistema",
            quantity: 1,
            unitPrice: 70.0,
            totalPrice: 70.0,
          },
        ],
      },
    },
  });

  // OS 2: ORCAMENTO
  await prisma.serviceOrder.create({
    data: {
      customerId: cliMariana.id,
      vehicleId: hrv.id,
      employeeId: funcMarcos.id,
      status: "ORCAMENTO",
      entryKm: 18500,
      problemDescription: "Revisão periódica de 20.000 KM e alinhamento da direção.",
      technicalReport: "Necessário troca de óleo do motor, filtro de óleo, filtro de ar e higienização do ar condicionado.",
      discount: 0.0,
      totalParts: 280.0,
      totalServices: 150.0,
      grandTotal: 430.0,
      items: {
        create: [
          {
            type: "PECA",
            name: "Óleo 0W20 Sintético Honda Original (4L)",
            quantity: 4,
            unitPrice: 55.0,
            totalPrice: 220.0,
          },
          {
            type: "PECA",
            name: "Filtro de Óleo Fram",
            quantity: 1,
            unitPrice: 60.0,
            totalPrice: 60.0,
          },
          {
            type: "SERVICO",
            name: "Mão de Obra: Troca de Óleo + Filtros",
            quantity: 1,
            unitPrice: 80.0,
            totalPrice: 80.0,
          },
          {
            type: "SERVICO",
            name: "Alinhamento 3D e Balanceamento das 4 rodas",
            quantity: 1,
            unitPrice: 70.0,
            totalPrice: 70.0,
          },
        ],
      },
    },
  });

  // OS 3: CONCLUÍDA Antiga (7 meses atrás) -> Ótimo para disparar alerta de troca de óleo no CRM!
  const osAntiga = await prisma.serviceOrder.create({
    data: {
      customerId: cliRoberto.id,
      vehicleId: corolla.id,
      employeeId: funcCarlos.id,
      status: "CONCLUIDO",
      entryKm: 32000,
      problemDescription: "Revisão dos 30.000 KM com troca de óleo.",
      technicalReport: "Troca completa de óleo sintético, filtro de óleo e filtro de ar de motor realizada com sucesso.",
      discount: 0.0,
      totalParts: 260.0,
      totalServices: 120.0,
      grandTotal: 380.0,
      paymentMethod: "CARTAO_CREDITO",
      paymentStatus: "PAGO",
      createdAt: new Date(Date.now() - 210 * 24 * 60 * 60 * 1000), // ~7 meses atrás
      completedAt: new Date(Date.now() - 210 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            type: "PECA",
            name: "Óleo 5W30 Sintético 100% (4,5L)",
            quantity: 1,
            unitPrice: 200.0,
            totalPrice: 200.0,
          },
          {
            type: "PECA",
            name: "Filtro de Óleo Mann Filter",
            quantity: 1,
            unitPrice: 60.0,
            totalPrice: 60.0,
          },
          {
            type: "SERVICO",
            name: "Serviço de Troca de Óleo e Inspeção de 30 Itens",
            quantity: 1,
            unitPrice: 120.0,
            totalPrice: 120.0,
          },
        ],
      },
    },
  });

  // 6. Transações Financeiras extras de hoje (Caixa Diário)
  await prisma.financialTransaction.create({
    data: {
      description: "Recebimento OS #1002 - Sinal de Serviço (Troca de Amortecedores)",
      type: "RECEITA",
      category: "ORDEM_SERVICO",
      amount: 450.0,
      paymentMethod: "CARTAO_CREDITO",
      date: new Date(),
    },
  });

  await prisma.financialTransaction.create({
    data: {
      description: "Lavagem Rápida Avulsa - Fiat Uno (Dinheiro)",
      type: "RECEITA",
      category: "LAVA_JATO",
      amount: 40.0,
      paymentMethod: "DINHEIRO",
      date: new Date(),
    },
  });

  await prisma.financialTransaction.create({
    data: {
      description: "Compra de Shampoo Automotivo Neutro e Pretinho (Galão 20L)",
      type: "DESPESA",
      category: "COMPRA_PECA",
      amount: 145.0,
      paymentMethod: "PIX",
      date: new Date(),
    },
  });

  console.log("✅ Seed executado com sucesso!");
  console.log("📊 Dados populados: 4 funcionários, 4 clientes, 5 veículos, 5 lavagens, 3 ordens de serviço e transações financeiras.");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
