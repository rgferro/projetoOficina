export type AccessLevel = "ADMIN" | "GERENTE" | "ATENDENTE" | "MECANICO" | "LAVADOR";

export interface EmployeeUser {
  id: string;
  name: string;
  role: string;
  accessLevel: AccessLevel;
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

// ==========================================
// MATRIZ DE MÓDULOS E RECURSOS POR PLANO SAAS
// ==========================================
export type SaaSPlan = "STARTER" | "PRO" | "ELITE";

export const PLAN_PERMISSIONS_MAP: Record<string, string[]> = {
  STARTER: [
    "/",
    "/dashboard",
    "/oficina",
    "/lavajato",
    "/financeiro",
    "/clientes",
    "/servicos",
    "/manual",
    "/assinatura",
    "/configuracoes",
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
    "/pdv",
    "/lavajato",
    "/estoque",
    "/fornecedores",
    "/crm",
    "/financeiro",
    "/equipe",
    "/manual",
    "/assinatura",
    "/configuracoes",
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
    "/pdv",
    "/lavajato",
    "/estoque",
    "/fornecedores",
    "/crm",
    "/financeiro",
    "/relatorios",
    "/equipe",
    "/manual",
    "/assinatura",
    "/master-admin",
    "/configuracoes",
    "/sobre",
    "/contato",
    "/termos",
    "/privacidade",
  ],
};

export interface PlanFeatureInfo {
  requiredPlan: SaaSPlan;
  moduleName: string;
  reason: string;
}

export const MODULE_PLAN_REQUIREMENTS: Record<string, PlanFeatureInfo> = {
  "/pdv": {
    requiredPlan: "PRO",
    moduleName: "PDV Balcão de Vendas",
    reason: "O PDV de Balcão com vendas rápidas de peças está disponível a partir do Plano Torque Oficina Pro.",
  },
  "/estoque": {
    requiredPlan: "PRO",
    moduleName: "Estoque de Peças",
    reason: "O controle de estoque de peças e produtos com baixa automática está disponível a partir do Plano Torque Oficina Pro.",
  },
  "/fornecedores": {
    requiredPlan: "PRO",
    moduleName: "Fornecedores",
    reason: "O cadastro e gestão de fornecedores de peças está disponível a partir do Plano Torque Oficina Pro.",
  },
  "/crm": {
    requiredPlan: "PRO",
    moduleName: "CRM WhatsApp Alertas",
    reason: "Os alertas automáticos de revisão de óleo e mensagens de WhatsApp estão disponíveis a partir do Plano Torque Oficina Pro.",
  },
  "/equipe": {
    requiredPlan: "PRO",
    moduleName: "Equipe & Controle de Usuários",
    reason: "A gestão de colaboradores e múltiplos usuários está disponível a partir do Plano Torque Oficina Pro (até 4 usuários inclusos).",
  },
  "/relatorios": {
    requiredPlan: "ELITE",
    moduleName: "Relatórios & BI Avançados",
    reason: "A inteligência de negócios (BI), DRE avançado e produtividade de equipe são exclusivos do Plano Torque Oficina Elite.",
  },
};

export function isRouteAllowedForPlan(plan: string | null | undefined, route: string): boolean {
  if (route.startsWith("/master-admin")) return true;
  const effectivePlan = (plan?.toUpperCase() as SaaSPlan) || "STARTER";
  const allowedList = PLAN_PERMISSIONS_MAP[effectivePlan] || PLAN_PERMISSIONS_MAP.STARTER;
  return allowedList.some((p) => (p === "/dashboard" || p === "/" ? route === "/" || route === "/dashboard" : route.startsWith(p)));
}

// Rota principal / Tela inicial de trabalho por perfil
export const ROLE_DEFAULT_ROUTES: Record<AccessLevel, string> = {
  ADMIN: "/dashboard",
  GERENTE: "/dashboard",
  ATENDENTE: "/pdv",
  MECANICO: "/oficina",
  LAVADOR: "/lavajato",
};

export function getDefaultRouteForRole(accessLevel?: string | null, isMaster?: boolean, plan?: string | null): string {
  if (isMaster) return "/master-admin";
  
  // Se estiver no plano Starter e for tentar ir para uma rota bloqueada, manda para Oficina
  if (plan === "STARTER") {
    if (accessLevel === "ADMIN" || accessLevel === "GERENTE") return "/dashboard";
    return "/oficina";
  }

  if (!accessLevel) return "/dashboard";
  return ROLE_DEFAULT_ROUTES[accessLevel as AccessLevel] || "/dashboard";
}

