import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando o povoamento completo do ERP Automotivo v2.0...");

  // Limpeza prévia segura
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.serviceOrderPayment.deleteMany();
  await prisma.serviceOrderPhoto.deleteMany();
  await prisma.serviceOrderItem.deleteMany();
  await prisma.accountReceivable.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.washTicket.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.standardService.deleteMany();
  await prisma.accountPayable.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.cashShift.deleteMany();
  await prisma.financialTransaction.deleteMany();
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
      whatsappBirthdayTemplate:
        "🎉 Parabéns {nome}! A equipe do {oficina} deseja a você um feliz aniversário com muita saúde e sucesso! Venha comemorar conosco e ganhe 15% de desconto em qualquer serviço neste mês! 🎁🚗",
    },
  });

  // 2. Fornecedores
  const supDistr = await prisma.supplier.create({
    data: {
      name: "Distribuidora de Peças Brasil S/A",
      document: "11.222.333/0001-44",
      contactName: "Rodrigo Vendas",
      phone: "(11) 97777-1111",
      email: "pedidos@pecasbrasil.com.br",
      city: "São Paulo",
      state: "SP",
      pixKey: "11222333000144",
    },
  });

  const supLub = await prisma.supplier.create({
    data: {
      name: "Lubrificantes & Filtros Express",
      document: "55.666.777/0001-88",
      contactName: "Fernanda",
      phone: "(11) 98888-2222",
      email: "contato@lubexpress.com.br",
      city: "Guarulhos",
      state: "SP",
    },
  });

  // 3. Produtos em Estoque
  const pOleo5w30 = await prisma.product.create({
    data: {
      sku: "OLEO-5W30-MOT",
      barcode: "7891234560011",
      name: "Óleo 5W30 100% Sintético Mobil Super (1L)",
      brand: "Mobil",
      category: "Lubrificantes",
      unit: "L",
      costPrice: 28.5,
      profitMargin: 57.89,
      salePrice: 45.0,
      currentStock: 36,
      minStock: 10,
      shelfLocation: "Prateleira A1",
      supplierId: supLub.id,
    },
  });

  const pOleo0w20 = await prisma.product.create({
    data: {
      sku: "OLEO-0W20-HON",
      barcode: "7891234560028",
      name: "Óleo 0W20 Sintético Original Honda (1L)",
      brand: "Honda Genuine",
      category: "Lubrificantes",
      unit: "L",
      costPrice: 38.0,
      profitMargin: 57.89,
      salePrice: 60.0,
      currentStock: 18,
      minStock: 8,
      shelfLocation: "Prateleira A2",
      supplierId: supLub.id,
    },
  });

  const pPastilhaGol = await prisma.product.create({
    data: {
      sku: "PST-FRAS-042",
      barcode: "7891234560035",
      name: "Jogo de Pastilhas de Freio Dianteira Gol G5/G6/G7",
      brand: "Fras-le",
      category: "Freios",
      unit: "JG",
      costPrice: 95.0,
      profitMargin: 68.42,
      salePrice: 160.0,
      currentStock: 8,
      minStock: 3,
      shelfLocation: "Prateleira F2",
      supplierId: supDistr.id,
    },
  });

  const pDiscoFremax = await prisma.product.create({
    data: {
      sku: "DSC-FMX-109",
      barcode: "7891234560042",
      name: "Par de Discos de Freio Ventilados Dianteiros",
      brand: "Fremax",
      category: "Freios",
      unit: "PAR",
      costPrice: 110.0,
      profitMargin: 63.64,
      salePrice: 180.0,
      currentStock: 4,
      minStock: 2,
      shelfLocation: "Prateleira F4",
      supplierId: supDistr.id,
    },
  });

  const pFiltroOleo = await prisma.product.create({
    data: {
      sku: "FLT-MANN-712",
      barcode: "7891234560059",
      name: "Filtro de Óleo Blindado W712",
      brand: "Mann Filter",
      category: "Filtros",
      unit: "UN",
      costPrice: 18.0,
      profitMargin: 94.44,
      salePrice: 35.0,
      currentStock: 15,
      minStock: 5,
      shelfLocation: "Prateleira B1",
      supplierId: supLub.id,
    },
  });

  const pPalhetaBosh = await prisma.product.create({
    data: {
      sku: "PALH-AERO-24",
      barcode: "7891234560066",
      name: "Par de Palhetas Aerotwin 24/16 Silicone",
      brand: "Bosch",
      category: "Acessórios",
      unit: "PAR",
      costPrice: 42.0,
      profitMargin: 90.48,
      salePrice: 80.0,
      currentStock: 1, // ALERTA: abaixo do estoque mínimo!
      minStock: 4,
      shelfLocation: "Balcão Frente",
      supplierId: supDistr.id,
    },
  });

  // 4. Serviços Padronizados
  await prisma.standardService.createMany({
    data: [
      {
        name: "Alinhamento 3D + Balanceamento 4 Rodas",
        category: "Geometria",
        defaultPrice: 120.0,
        estimatedMinutes: 45,
        description: "Alinhamento a laser computadorizado e balanceamento dinâmico das 4 rodas.",
      },
      {
        name: "Mão de Obra: Troca de Óleo + Filtros",
        category: "Revisão Preventiva",
        defaultPrice: 60.0,
        estimatedMinutes: 30,
        description: "Drenagem do óleo usado, substituição do filtro e inspeção de 15 pontos de segurança.",
      },
      {
        name: "Troca de Discos e Pastilhas de Freio + Sangria",
        category: "Freios",
        defaultPrice: 150.0,
        estimatedMinutes: 60,
        description: "Substituição completa das pastilhas e discos, limpeza das pinças e sangria com fluido novo.",
      },
      {
        name: "Higienização de Ar Condicionado + Filtro de Cabine",
        category: "Arrefecimento & Conforto",
        defaultPrice: 90.0,
        estimatedMinutes: 30,
        description: "Aplicação de ozônio e substituição do elemento filtrante de pólen.",
      },
      {
        name: "Diagnóstico com Scanner Eletrônico de Injeção",
        category: "Diagnóstico",
        defaultPrice: 80.0,
        estimatedMinutes: 30,
        description: "Leitura de códigos de falha (DTC), teste de atuadores e reset de parâmetros.",
      },
    ],
  });

  // 5. Funcionários com Níveis de Acesso
  const funcCarlos = await prisma.employee.create({
    data: {
      name: "Carlos Silva (Mecânico Líder)",
      role: "Mecânico Líder",
      accessLevel: "MECANICO",
      phone: "(11) 99111-2222",
      commissionRate: 15.0,
      active: true,
    },
  });

  const funcMarcos = await prisma.employee.create({
    data: {
      name: "Marcos Vinicius",
      role: "Mecânico",
      accessLevel: "MECANICO",
      phone: "(11) 99333-4444",
      commissionRate: 10.0,
      active: true,
    },
  });

  const funcPedro = await prisma.employee.create({
    data: {
      name: "Pedro Santos",
      role: "Lavador Especialista",
      accessLevel: "LAVADOR",
      phone: "(11) 99555-6666",
      commissionRate: 8.0,
      active: true,
    },
  });

  const funcAna = await prisma.employee.create({
    data: {
      name: "Ana Beatriz (Gerente/Balcão)",
      role: "Gerente / Atendente",
      accessLevel: "GERENTE",
      phone: "(11) 99888-0000",
      commissionRate: 3.0,
      active: true,
    },
  });

  // 6. Clientes com aniversários
  const currentMonth = new Date().getMonth(); // Mês atual para teste do CRM de aniversariantes

  const cliRoberto = await prisma.customer.create({
    data: {
      name: "Roberto Albuquerque",
      type: "PF",
      phone: "(11) 98123-4567",
      email: "roberto.albuquerque@gmail.com",
      document: "123.456.789-00",
      birthDate: new Date(1985, currentMonth, 18), // Aniversariante deste mês!
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
      type: "PF",
      phone: "(11) 97654-3210",
      email: "mariana.lima@outlook.com",
      document: "321.654.987-11",
      birthDate: new Date(1992, (currentMonth + 3) % 12, 10),
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
      name: "Transportadora Costa Express Ltda",
      type: "PJ",
      phone: "(11) 99876-5432",
      email: "financeiro@costaexpress.com.br",
      document: "12.345.678/0001-99",
      stateRegistration: "112.334.556.778",
      address: "Av. do Cursino, 3000 - Saúde",
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

  // 7. Lava-Jato
  const corolla = cliRoberto.vehicles[0];
  const compass = cliRoberto.vehicles[1];
  const hrv = cliMariana.vehicles[0];
  const gol = cliFernando.vehicles[0];

  await prisma.washTicket.create({
    data: {
      ticketNumber: 1001,
      serviceType: "Lavagem Completa + Cera",
      price: 90.0,
      status: "AGUARDANDO",
      notes: "Cuidado extra com tapetes",
      vehicleId: corolla.id,
      employeeId: funcPedro.id,
    },
  });

  await prisma.washTicket.create({
    data: {
      ticketNumber: 1002,
      serviceType: "Lavagem Simples",
      price: 50.0,
      status: "EM_LAVAGEM",
      vehicleId: hrv.id,
      employeeId: funcPedro.id,
    },
  });

  await prisma.washTicket.create({
    data: {
      ticketNumber: 1003,
      serviceType: "Higienização Interna + Cera",
      price: 180.0,
      status: "FINALIZADO",
      vehicleId: compass.id,
      employeeId: funcPedro.id,
    },
  });

  // 8. Ordem de Serviço com Defeito Reclamado vs Constatado e Fotos
  const os1 = await prisma.serviceOrder.create({
    data: {
      osNumber: 1001,
      customerId: cliFernando.id,
      vehicleId: gol.id,
      employeeId: funcCarlos.id,
      status: "EM_EXECUCAO",
      entryKm: 89000,
      defectClaimed: "Barulho metálico áspero ao frear e pedal de freio com vibração excessiva.",
      defectFound: "Discos de freio dianteiros abaixo da espessura mínima (empenados). Pastilhas no ferro.",
      discount: 20.0,
      totalParts: 340.0,
      totalServices: 220.0,
      grandTotal: 540.0,
      paidAmount: 200.0, // Pagamento de sinal parcial de R$ 200
      remainingBalance: 340.0,
      paymentStatus: "PARCIAL",
      items: {
        create: [
          {
            type: "PECA",
            name: "Jogo de Pastilhas de Freio Fras-le Gol",
            quantity: 1,
            unitPrice: 160.0,
            totalPrice: 160.0,
            productId: pPastilhaGol.id,
            employeeId: funcCarlos.id,
          },
          {
            type: "PECA",
            name: "Par de Discos de Freio Fremax Ventilados",
            quantity: 1,
            unitPrice: 180.0,
            totalPrice: 180.0,
            productId: pDiscoFremax.id,
            employeeId: funcCarlos.id,
          },
          {
            type: "SERVICO",
            name: "Mão de Obra: Troca de Discos, Pastilhas e Sangria",
            quantity: 1,
            unitPrice: 150.0,
            totalPrice: 150.0,
            employeeId: funcCarlos.id,
          },
          {
            type: "SERVICO",
            name: "Fluido de Freio DOT4 + Desengraxante",
            quantity: 1,
            unitPrice: 70.0,
            totalPrice: 70.0,
            employeeId: funcCarlos.id,
          },
        ],
      },
      photos: {
        create: [
          {
            type: "AVARIA",
            imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80",
            caption: "Pastilha antiga completamente gasta no limite do metal",
          },
          {
            type: "ANTES",
            imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80",
            caption: "Veículo na rampa do Box 1",
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 200.0,
            paymentMethod: "PIX",
            notes: "Sinal de 200 pago via PIX na aprovação do orçamento",
            date: new Date(),
          },
        ],
      },
    },
  });

  // 9. Venda Rápida de Balcão (PDV)
  const sale1 = await prisma.sale.create({
    data: {
      saleNumber: 1001,
      totalAmount: 125.0,
      discount: 5.0,
      grandTotal: 120.0,
      paymentMethod: "PIX",
      paidAmount: 120.0,
      changeAmount: 0.0,
      status: "CONCLUIDA",
      employeeId: funcAna.id,
      customerId: cliRoberto.id,
      items: {
        create: [
          {
            name: "Óleo 5W30 Mobil Super (1L)",
            quantity: 2,
            unitPrice: 45.0,
            totalPrice: 90.0,
            productId: pOleo5w30.id,
          },
          {
            name: "Filtro de Óleo Blindado W712",
            quantity: 1,
            unitPrice: 35.0,
            totalPrice: 35.0,
            productId: pFiltroOleo.id,
          },
        ],
      },
    },
  });

  // 10. Turno de Caixa Aberto
  await prisma.cashShift.create({
    data: {
      openedAt: new Date(new Date().setHours(8, 0, 0, 0)),
      initialBalance: 200.0, // Fundo de troco de R$ 200
      status: "ABERTO",
      employeeId: funcAna.id,
      notes: "Turno aberto normalmente com fundo de R$ 200 em notas e moedas.",
    },
  });

  // 11. Contas a Pagar & Receber
  await prisma.accountPayable.createMany({
    data: [
      {
        description: "Boleto Distribuidora Peças Brasil (NF 8921)",
        category: "PEÇAS",
        amount: 850.0,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Vence em 5 dias
        status: "PENDENTE",
        supplierId: supDistr.id,
      },
      {
        description: "Conta de Energia Elétrica - Enel",
        category: "ENERGIA",
        amount: 420.0,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        status: "PENDENTE",
      },
    ],
  });

  await prisma.accountReceivable.create({
    data: {
      description: "Faturamento OS #1001 (Saldo Restante) - Transportadora Costa",
      amount: 340.0,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "PENDENTE",
      customerId: cliFernando.id,
      serviceOrderId: os1.id,
    },
  });

  // 12. Transações de Caixa de Hoje
  await prisma.financialTransaction.create({
    data: {
      description: "Venda PDV #1001 - Lubrificantes e Filtro",
      type: "RECEITA",
      category: "PDV_BALCAO",
      amount: 120.0,
      paymentMethod: "PIX",
      saleId: sale1.id,
      date: new Date(),
    },
  });

  await prisma.financialTransaction.create({
    data: {
      description: "Sinal OS #1001 - Pastilhas e Discos de Freio",
      type: "RECEITA",
      category: "ORDEM_SERVICO",
      amount: 200.0,
      paymentMethod: "PIX",
      serviceOrderId: os1.id,
      date: new Date(),
    },
  });

  console.log("✅ Seed v2.0 executado com sucesso!");
  console.log("📦 Dados populados: Produtos em estoque, Tabela de Serviços, Fornecedores, PDV, Contas a Pagar/Receber, Turno de Caixa e Aniversariantes.");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
