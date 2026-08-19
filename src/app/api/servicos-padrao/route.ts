import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_SERVICES = [
  // Mecânica Geral & Revisão
  {
    name: "Troca de Óleo do Motor + Filtro de Óleo",
    category: "Revisão Preventiva",
    defaultPrice: 70.0,
    estimatedMinutes: 30,
    description: "Drenagem do cárter, substituição do filtro de óleo e inspeção de 15 pontos de segurança.",
  },
  {
    name: "Alinhamento 3D + Balanceamento das 4 Rodas",
    category: "Geometria & Suspensão",
    defaultPrice: 130.0,
    estimatedMinutes: 45,
    description: "Alinhamento a laser computadorizado e balanceamento dinâmico das 4 rodas.",
  },
  {
    name: "Troca de Discos e Pastilhas de Freio Dianteiro",
    category: "Freios",
    defaultPrice: 150.0,
    estimatedMinutes: 60,
    description: "Substituição completa das pastilhas e discos dianteiros, limpeza e sangria do sistema.",
  },
  {
    name: "Diagnóstico Eletrônico com Scanner Automotivo",
    category: "Injeção & Diagnóstico",
    defaultPrice: 90.0,
    estimatedMinutes: 30,
    description: "Varredura completa de falhas em injeção, ABS, Airbag e reset de luz de revisão.",
  },
  {
    name: "Limpeza de Bicos Injetores por Ultrassom",
    category: "Injeção & Diagnóstico",
    defaultPrice: 160.0,
    estimatedMinutes: 60,
    description: "Teste de vazão, equalização e limpeza na cuba de ultrassom com troca de filtros/orings.",
  },
  {
    name: "Limpeza do Sistema de Arrefecimento + Aditivo",
    category: "Arrefecimento & Conforto",
    defaultPrice: 140.0,
    estimatedMinutes: 45,
    description: "Flushing químico com água desmineralizada e aplicação de aditivo concentrado orgânico.",
  },
  {
    name: "Higienização de Ar Condicionado + Filtro de Cabine",
    category: "Arrefecimento & Conforto",
    defaultPrice: 90.0,
    estimatedMinutes: 30,
    description: "Aplicação de ozônio e substituição do elemento filtrante de pólen do habitáculo.",
  },
  {
    name: "Troca de Amortecedores Dianteiros e Batentes",
    category: "Geometria & Suspensão",
    defaultPrice: 190.0,
    estimatedMinutes: 90,
    description: "Substituição do par de amortecedores, coxins superiores, batentes e coifas.",
  },
  {
    name: "Troca do Kit de Embreagem (Disco, Platô e Rolamento)",
    category: "Mecânica Geral",
    defaultPrice: 380.0,
    estimatedMinutes: 180,
    description: "Remoção da transmissão manual, instalação do kit de embreagem e regulagem de cabo/atuador.",
  },
  {
    name: "Troca da Correia Dentada e Rolamento Tensor",
    category: "Mecânica Geral",
    defaultPrice: 240.0,
    estimatedMinutes: 120,
    description: "Sincronismo com ferramentas de ponto e substituição de correia dentada e tensor.",
  },
  {
    name: "Troca de Bateria Automotiva + Teste de Carga",
    category: "Elétrica & Baterias",
    defaultPrice: 45.0,
    estimatedMinutes: 20,
    description: "Instalação da bateria nova, verificação da corrente de partida (CCA) e alternador.",
  },
  // Estética Automotiva & Lava-Jato
  {
    name: "Lavagem Simples (Ducha + Secagem)",
    category: "Estética & Lava-Jato",
    defaultPrice: 35.0,
    estimatedMinutes: 30,
    description: "Enxágue com shampoo automotivo neutro, caixa de rodas e secagem rápida.",
  },
  {
    name: "Lavagem Completa com Cera e Aspiração",
    category: "Estética & Lava-Jato",
    defaultPrice: 65.0,
    estimatedMinutes: 60,
    description: "Lavagem externa com cera líquida, aspiração interna profunda, painel e pretinho.",
  },
  {
    name: "Polimento Técnico e Cristalização de Pintura",
    category: "Estética & Lava-Jato",
    defaultPrice: 390.0,
    estimatedMinutes: 240,
    description: "Eliminação de micro riscos, refino, lustro e aplicação de selante sintético protetor.",
  },
  {
    name: "Higienização Interna dos Bancos e Teto",
    category: "Estética & Lava-Jato",
    defaultPrice: 220.0,
    estimatedMinutes: 150,
    description: "Extração de sujidades em estofados/couro, higienização do carpete e eliminação de ácaros.",
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    // Verifica se existem serviços mecânicos no banco; se houver apenas serviços de lavagem ou nenhum, popula os padrão
    const totalCount = await prisma.standardService.count();
    const mecanicaCount = await prisma.standardService.count({
      where: {
        category: {
          in: ["Mecânica Geral", "Geometria & Suspensão", "Freios", "Revisão Preventiva", "Injeção & Diagnóstico"],
        },
      },
    });

    if (totalCount === 0 || mecanicaCount === 0) {
      for (const def of DEFAULT_SERVICES) {
        const exists = await prisma.standardService.findFirst({
          where: { name: def.name },
        });
        if (!exists) {
          await prisma.standardService.create({
            data: def,
          });
        }
      }
    }

    const services = await prisma.standardService.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { category: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar tabela de serviços" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "seed-defaults") {
      for (const def of DEFAULT_SERVICES) {
        const exists = await prisma.standardService.findFirst({
          where: { name: def.name },
        });
        if (!exists) {
          await prisma.standardService.create({
            data: def,
          });
        }
      }
      const all = await prisma.standardService.findMany({ orderBy: { name: "asc" } });
      return NextResponse.json(all, { status: 200 });
    }

    const { name, category, defaultPrice, estimatedMinutes, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome do serviço é obrigatório" }, { status: 400 });
    }

    const service = await prisma.standardService.create({
      data: {
        name,
        category: category || "Mecânica Geral",
        defaultPrice: Number(defaultPrice) || 0,
        estimatedMinutes: Number(estimatedMinutes) || 60,
        description: description || null,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao criar serviço" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, category, defaultPrice, estimatedMinutes, description } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const updated = await prisma.standardService.update({
      where: { id },
      data: {
        name,
        category,
        defaultPrice: Number(defaultPrice) || 0,
        estimatedMinutes: Number(estimatedMinutes) || 60,
        description,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await prisma.standardService.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir" }, { status: 500 });
  }
}
