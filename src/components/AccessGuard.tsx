"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, ROLE_CONFIG } from "@/lib/authContext";
import { getDefaultRouteForRole, isRouteAllowedForPlan } from "@/lib/permissions";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function AccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentEmployee, currentPlan, canAccess, isEnforced } = useAuth();

  const isPlanAllowed = isRouteAllowedForPlan(currentPlan, pathname);
  const hasAccess = canAccess(pathname);
  const isBlockedByPlan = !isRouteAllowedForPlan(currentPlan, pathname);
  const defaultAllowedRoute = getDefaultRouteForRole(currentEmployee?.accessLevel);

  useEffect(() => {
    // Se o usuário tentar acessar a rota raiz /dashboard e seu cargo não tem permissão (ex: Mecânico ou Lavador),
    // redireciona automaticamente para a tela de trabalho principal dele
    if (isEnforced && !hasAccess && (pathname === "/dashboard" || pathname === "/")) {
      router.replace(defaultAllowedRoute);
    }
  }, [isEnforced, hasAccess, pathname, defaultAllowedRoute, router]);

  if (isEnforced && !hasAccess) {
    if (isBlockedByPlan) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 shadow-xl shadow-blue-500/10">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div className="max-w-md space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
              <span>Plano Atual: {currentPlan}</span>
            </span>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Recurso Disponível em Plano Superior
            </h1>

            <p className="text-xs text-slate-500 leading-relaxed">
              O módulo <strong className="text-slate-800 font-mono">{pathname}</strong> não está incluso no plano
              atual da sua oficina. Faça upgrade para liberar este recurso agora.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/assinatura"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
            >
              Ver Planos e Fazer Upgrade
            </Link>
            <Link
              href={defaultAllowedRoute}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Minha Tela
            </Link>
          </div>
        </div>
      );
    }

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
