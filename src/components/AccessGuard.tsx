"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, ROLE_CONFIG, MODULE_PLAN_REQUIREMENTS, isRouteAllowedForPlan } from "@/lib/authContext";
import { getDefaultRouteForRole } from "@/lib/permissions";
import { ShieldAlert, ArrowLeft, Sparkles, Lock, Zap } from "lucide-react";
import Link from "next/link";

export function AccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentEmployee, currentPlan, canAccess, isEnforced } = useAuth();

  // 1. Rota de Super Admin (/master-admin) tem seu próprio controle estrito de acesso e nunca deve exibir paywall de plano SaaS
  if (pathname.startsWith("/master-admin")) {
    return <>{children}</>;
  }

  // 2. Se for o Super Administrador (Rafael), tem acesso irrestrito a todos os módulos
  if (
    currentEmployee?.email === "rafael.gielow@gmail.com" ||
    currentEmployee?.role === "Super Administrador" ||
    (currentEmployee as any)?.isMaster === true
  ) {
    return <>{children}</>;
  }

  const isPlanAllowed = isRouteAllowedForPlan(currentPlan, pathname);
  const hasAccess = canAccess(pathname);
  const defaultAllowedRoute = getDefaultRouteForRole(currentEmployee?.accessLevel, false, currentPlan);

  useEffect(() => {
    // Se o usuário tentar acessar a rota raiz /dashboard e seu cargo não tem permissão (ex: Mecânico ou Lavador),
    // redireciona automaticamente para a tela de trabalho principal dele
    if (isEnforced && !hasAccess && (pathname === "/dashboard" || pathname === "/")) {
      router.replace(defaultAllowedRoute);
    }
  }, [isEnforced, hasAccess, pathname, defaultAllowedRoute, router]);

  if (isEnforced && !hasAccess) {
    // 1. Caso o bloqueio seja do PLANO SAAS (ex: Plano Starter tentando acessar PDV, Financeiro, Lava-Jato, Relatórios)
    if (!isPlanAllowed) {
      const requirement = Object.entries(MODULE_PLAN_REQUIREMENTS).find(([routeKey]) =>
        pathname.startsWith(routeKey)
      )?.[1];

      const requiredPlanName =
        requirement?.requiredPlan === "ELITE" ? "Torque Oficina Elite" : "Torque Oficina Pro";
      const moduleTitle = requirement?.moduleName || "Módulo Premium";
      const explanation =
        requirement?.reason ||
        `O recurso ${pathname} está disponível nos planos pagos do Torque ERP.`;

      return (
        <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xl shadow-orange-500/20">
            <Lock className="w-10 h-10" />
          </div>

          <div className="max-w-lg space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span>Disponível no {requiredPlanName}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {moduleTitle}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              {explanation}
            </p>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 max-w-md mx-auto">
              Seu plano atual é o <strong className="text-slate-800">Torque Starter (Gratuito)</strong>.
              Faça upgrade para liberar múltiplos usuários, PDV balcão, estoque de peças com baixa automática, CRM WhatsApp e relatórios.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/assinatura"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-current" />
              Ver Planos & Fazer Upgrade
            </Link>

            <Link
              href={defaultAllowedRoute}
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para {defaultAllowedRoute === "/oficina" ? "Oficina & OS" : "Início"}
            </Link>
          </div>
        </div>
      );
    }

    // 2. Caso o bloqueio seja de PERFIL/CARGO DO COLABORADOR
    const roleConfig = currentEmployee
      ? ROLE_CONFIG[currentEmployee.accessLevel]
      : ROLE_CONFIG.MECANICO;

    let defaultLabel = "Ir para Minha Tela Principal";
    if (currentEmployee?.accessLevel === "LAVADOR") {
      defaultLabel = "Ir para o Lava-Jato";
    } else if (currentEmployee?.accessLevel === "MECANICO") {
      defaultLabel = "Ir para Oficina & OS";
    } else if (currentEmployee?.accessLevel === "ATENDENTE") {
      defaultLabel = "Ir para o PDV Balcão";
    }

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center text-amber-700 shadow-xl shadow-amber-500/10">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="max-w-md space-y-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border ${roleConfig.badgeColor}`}>
            <span>{roleConfig.icon}</span>
            <span>Perfil: {roleConfig.label}</span>
          </span>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Módulo Restrito
          </h1>

          <p className="text-xs text-slate-500 leading-relaxed">
            O usuário <strong className="text-slate-800">{currentEmployee?.name}</strong> não possui permissão de acesso ao módulo <strong className="text-slate-800 font-mono">{pathname}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href={defaultAllowedRoute}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {defaultLabel}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
