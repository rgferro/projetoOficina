export type AccessLevel = "ADMIN" | "GERENTE" | "ATENDENTE" | "MECANICO" | "LAVADOR";
export type SaaSPlan = "STARTER" | "PRO" | "ELITE";

export interface EmployeeUser {
  id: string;
  name: string;
  role: string;
  accessLevel: AccessLevel;
  plan?: SaaSPlan;
  pinCode?: string;
  email?: string;
  phone?: string;
  active: boolean;
}

export interface SystemModule {
  id: string;
  name: string;
  href: string;
  category: "Operacional" | "Gestão" | "Administrativo";
}

export const SYSTEM_MODULES: SystemModule[] = [
  { id: "dashboard", name: "Dashboard", href: "/dashboard", category: "Operacional" },
  { id: "pdv", name: "PDV Balcão", href: "/pdv", category: "Operacional" },
  { id: "lavajato", name: "Lava-Jato & Pátio", href: "/lavajato", category: "Operacional" },
  { id: "oficina", name: "Oficina & Ordens de Serviço", href: "/oficina", category: "Operacional" },
  { id: "estoque", name: "Estoque de Peças", href: "/estoque", category: "Gestão" },
  { id: "servicos", name: "Tabela de Serviços", href: "/servicos", category: "Operacional" },
  { id: "fornecedores", name: "Fornecedores", href: "/fornecedores", category: "Gestão" },
  { id: "clientes", name: "Clientes & Veículos", href: "/clientes", category: "Operacional" },
  { id: "equipe", name: "Equipe & Usuários", href: "/equipe", category: "Administrativo" },
  { id: "financeiro", name: "Caixa & Financeiro", href: "/financeiro", category: "Gestão" },
  { id: "relatorios", name: "Relatórios & BI", href: "/relatorios", category: "Gestão" },
  { id: "crm", name: "CRM WhatsApp", href: "/crm", category: "Gestão" },
  { id: "assinatura", name: "Assinatura & Planos", href: "/assinatura", category: "Administrativo" },
  { id: "manual", name: "Manual & Treinamento", href: "/manual", category: "Operacional" },
  { id: "configuracoes", name: "Ajustes da Oficina", href: "/configuracoes", category: "Administrativo" },
];

export const ROLE_CONFIG: Record<
  AccessLevel,
  { label: string; badgeColor: string; icon: string; description: string }
> = {
  ADMIN: {
    label: "Administrador",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    icon: "👑",
    description: "Acesso total e irrestrito a todos os módulos, configurações e equipe.",
  },
  GERENTE: {
    label: "Gerente",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    icon: "👔",
    description: "Acesso a vendas, ordens de serviço, relatórios e controle operacional.",
  },
  ATENDENTE: {
    label: "Atendente / Caixa",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: "🏷️",
    description: "Acesso ao PDV balcão, caixa diário, entrada de veículos e clientes.",
  },
  MECANICO: {
    label: "Mecânico / Técnico",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    icon: "🔧",
    description: "Acesso focado em Ordens de Serviço da oficina e tabela de serviços.",
  },
  LAVADOR: {
    label: "Operador de Lava-Jato",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300",
    icon: "🧼",
    description: "Acesso exclusivo ao Pátio de Lavagem e quadro Kanban (sem caixa/vendas).",
  },
};

// Matriz de rotas permitidas padrão por perfil
export const DEFAULT_PERMISSIONS_MAP: Record<AccessLevel, string[]> = {
  ADMIN: [
    "/",
    "/pdv",
    "/lavajato",
    "/oficina",
    "/estoque",
    "/servicos",
    "/fornecedores",
    "/clientes",
    "/equipe",
    "/financeiro",
    "/relatorios",
    "/crm",
    "/assinatura",
    "/manual",
    "/master-admin",
    "/configuracoes",
    "/sobre",
    "/contato",
    "/termos",
    "/privacidade",
  ],
  GERENTE: [
    "/",
    "/pdv",
    "/lavajato",
    "/oficina",
    "/estoque",
    "/servicos",
    "/fornecedores",
    "/clientes",
    "/equipe",
    "/financeiro",
    "/relatorios",
    "/crm",
    "/manual",
    "/sobre",
    "/contato",
    "/termos",
    "/privacidade",
  ],
  ATENDENTE: [
    "/",
    "/pdv",
    "/lavajato",
    "/oficina",
    "/servicos",
    "/clientes",
    "/financeiro",
    "/crm",
    "/manual",
    "/sobre",
    "/contato",
    "/termos",
    "/privacidade",
  ],
  MECANICO: [
    "/oficina",
    "/servicos",
    "/estoque",
    "/clientes",
    "/manual",
    "/sobre",
    "/contato",
    "/termos",
    "/privacidade",
  ],
  LAVADOR: [
    "/lavajato",
    "/manual",
    "/sobre",
    "/contato",
    "/termos",
    "/privacidade",
  ],
};

export const PERMISSIONS_MAP = DEFAULT_PERMISSIONS_MAP;

export const PLAN_PERMISSIONS_MAP: Record<SaaSPlan, string[]> = {
  STARTER: [
    "/",
    "/dashboard",
    "/oficina",
    "/clientes",
    "/servicos",
    "/manual",
    "/configuracoes",
    "/assinatura",
    "/sobre",
    "/contato",
    "/termos",
    "/privacidade",
  ],
  PRO: [
    "/",
    "/dashboard",
    "/oficina",
    "/clientes",
    "/servicos",
    "/manual",
    "/configuracoes",
    "/assinatura",
    "/pdv",
    "/lavajato",
    "/estoque",
    "/fornecedores",
    "/crm",
    "/financeiro",
    "/equipe",
    "/sobre",
    "/contato",
    "/termos",
    "/privacidade",
  ],
  ELITE: [
    "/",
    "/dashboard",
    "/oficina",
    "/clientes",
    "/servicos",
    "/manual",
    "/configuracoes",
    "/assinatura",
    "/pdv",
    "/lavajato",
    "/estoque",
    "/fornecedores",
    "/crm",
    "/financeiro",
    "/equipe",
    "/relatorios",
    "/sobre",
    "/contato",
    "/termos",
    "/privacidade",
  ],
};

export const PLAN_INCLUDED_USERS: Record<SaaSPlan, number> = {
  STARTER: 1,
  PRO: 4,
  ELITE: 10,
};

function normalizePath(path: string): string {
  if (!path) return "/";
  const onlyPath = path.split("?")[0].split("#")[0] || "/";
  return onlyPath.endsWith("/") && onlyPath !== "/" ? onlyPath.slice(0, -1) : onlyPath;
}

function matchesRoutePrefix(path: string, allowedRoute: string): boolean {
  if (allowedRoute === "/") {
    return path === "/" || path === "/dashboard";
  }
  return path === allowedRoute || path.startsWith(`${allowedRoute}/`);
}

export function isRouteAllowedForPlan(plan: string | null | undefined, route: string): boolean {
  const resolvedPlan: SaaSPlan =
    plan === "ELITE" || plan === "PRO" || plan === "STARTER" ? plan : "STARTER";
  const normalizedRoute = normalizePath(route);
  const allowedRoutes = PLAN_PERMISSIONS_MAP[resolvedPlan];

  return allowedRoutes.some((allowedRoute) => matchesRoutePrefix(normalizedRoute, allowedRoute));
}

// Rota principal / Tela inicial de trabalho por perfil
export const ROLE_DEFAULT_ROUTES: Record<AccessLevel, string> = {
  ADMIN: "/dashboard",
  GERENTE: "/dashboard",
  ATENDENTE: "/pdv",
  MECANICO: "/oficina",
  LAVADOR: "/lavajato",
};

export function getDefaultRouteForRole(accessLevel?: string | null, isMaster?: boolean): string {
  if (isMaster) return "/master-admin";
  if (!accessLevel) return "/dashboard";
  return ROLE_DEFAULT_ROUTES[accessLevel as AccessLevel] || "/dashboard";
}
