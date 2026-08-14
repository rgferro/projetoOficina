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

export const ROLE_CONFIG: Record<
  AccessLevel,
  { label: string; badgeColor: string; icon: string; description: string }
> = {
  ADMIN: {
    label: "Administrador",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    icon: "👑",
    description: "Acesso total a todos os módulos, financeiro, configurações e equipe.",
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

// Matriz de rotas permitidas por perfil
export const PERMISSIONS_MAP: Record<AccessLevel, string[]> = {
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
    "/configuracoes",
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
  ],
  MECANICO: [
    "/oficina",
    "/servicos",
    "/estoque",
    "/clientes",
  ],
  LAVADOR: [
    "/lavajato",
    "/clientes",
  ],
};
