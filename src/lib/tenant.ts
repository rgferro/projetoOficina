import { prisma } from "./prisma";
import { verifySessionToken, UserSessionPayload } from "./auth";

export interface TenantContext {
  tenantId: string;
  session: UserSessionPayload | null;
  isMaster: boolean;
}

/**
 * Extrai o contexto do Tenant (Oficina) da requisicao de forma segura.
 * Verifica Cookies (torque_token, torque_session), Header Authorization ou fallback.
 */
export async function getTenantContext(req?: Request): Promise<TenantContext> {
  let token: string | null = null;

  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").map((c) => c.trim());
        const torqueCookie = cookies.find((c) => c.startsWith("torque_token="));
        if (torqueCookie) {
          token = torqueCookie.split("=")[1];
        } else {
          const sessionCookie = cookies.find((c) => c.startsWith("torque_session="));
          if (sessionCookie) {
            token = sessionCookie.split("=")[1];
          }
        }
      }
    }
  }

  // Tenta extrair via next/headers se disponivel
  if (!token) {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      token = cookieStore.get("torque_token")?.value || cookieStore.get("torque_session")?.value || null;
    } catch (e) {
      // Ignora erro se fora do ciclo de requisicao HTTP
    }
  }

  const session = token ? verifySessionToken(token) : null;

  if (session && session.tenantId) {
    return {
      tenantId: session.tenantId,
      session,
      isMaster: !!session.isMaster,
    };
  }

  // Fallback: Busca a primeira oficina ativa ou cria uma padrao
  let defaultTenant = await prisma.tenant.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  if (!defaultTenant) {
    defaultTenant = await prisma.tenant.create({
      data: {
        name: "AutoGestão Oficina Principal",
        ownerName: "Administrador Principal",
        ownerEmail: "admin@oficina.com.br",
        plan: "STARTER",
        maxUsers: 5,
        subscriptionStatus: "active",
      },
    });
  }

  return {
    tenantId: defaultTenant.id,
    session: null,
    isMaster: false,
  };
}

export const DEFAULT_SERVICES_LIST = [
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
];

/**
 * Garante que uma nova oficina tenha configuracoes iniciais e tabela de servicos padrao populados
 */
export async function ensureTenantDefaults(tenantId: string, tenantName?: string) {
  try {
    // 1. Configurações da oficina
    const existingSettings = await prisma.workshopSetting.findUnique({
      where: { tenantId },
    });

    if (!existingSettings) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      await prisma.workshopSetting.create({
        data: {
          tenantId,
          workshopName: tenantName || tenant?.name || "Oficina & Centro Automotivo",
          cnpj: tenant?.document || "",
          phone: tenant?.ownerPhone || "",
          email: tenant?.ownerEmail || "",
          warrantyDays: 90,
        },
      });
    }

    // 2. Serviços padrão para o tenant
    const servicesCount = await prisma.standardService.count({
      where: { tenantId },
    });

    if (servicesCount === 0) {
      for (const service of DEFAULT_SERVICES_LIST) {
        await prisma.standardService.create({
          data: {
            ...service,
            tenantId,
          },
        });
      }
    }
  } catch (err) {
    console.error("Erro ao inicializar padroes do tenant:", err);
  }
}
