import { describe, it, expect } from "vitest";
import { PERMISSIONS_MAP, ROLE_CONFIG, AccessLevel } from "@/lib/permissions";

describe("Controle de Usuários e Matriz de Permissões por Módulo", () => {
  it("deve garantir que o Administrador tem acesso total a todos os módulos", () => {
    const adminRoutes = PERMISSIONS_MAP.ADMIN;
    expect(adminRoutes).toContain("/financeiro");
    expect(adminRoutes).toContain("/configuracoes");
    expect(adminRoutes).toContain("/equipe");
    expect(adminRoutes).toContain("/lavajato");
    expect(adminRoutes).toContain("/oficina");
    expect(adminRoutes).toContain("/pdv");
  });

  it("deve garantir que o Operador de Lava-Jato NÃO tem acesso ao Caixa ou Configurações", () => {
    const lavadorRoutes = PERMISSIONS_MAP.LAVADOR;
    expect(lavadorRoutes).toContain("/lavajato");
    expect(lavadorRoutes).not.toContain("/financeiro");
    expect(lavadorRoutes).not.toContain("/configuracoes");
    expect(lavadorRoutes).not.toContain("/pdv");
  });

  it("deve garantir que o Mecânico tem acesso a Ordens de Serviço mas NÃO ao Caixa", () => {
    const mecanicoRoutes = PERMISSIONS_MAP.MECANICO;
    expect(mecanicoRoutes).toContain("/oficina");
    expect(mecanicoRoutes).toContain("/servicos");
    expect(mecanicoRoutes).not.toContain("/financeiro");
    expect(mecanicoRoutes).not.toContain("/lavajato");
  });

  it("deve conter configurações de crachás visuais para todos os 5 perfis", () => {
    const roles: AccessLevel[] = ["ADMIN", "GERENTE", "ATENDENTE", "MECANICO", "LAVADOR"];
    roles.forEach((r) => {
      expect(ROLE_CONFIG[r]).toBeDefined();
      expect(ROLE_CONFIG[r].label).toBeDefined();
      expect(ROLE_CONFIG[r].icon).toBeDefined();
      expect(ROLE_CONFIG[r].badgeColor).toBeDefined();
    });
  });
});
