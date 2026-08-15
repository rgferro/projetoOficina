"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth, ROLE_CONFIG } from "@/lib/authContext";
import { ShieldAlert, ArrowLeft, Users, Droplets, Wrench, ShoppingCart } from "lucide-react";
import Link from "next/link";

export function AccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentEmployee, canAccess, isEnforced } = useAuth();

  const hasAccess = canAccess(pathname);

  if (isEnforced && !hasAccess) {
    const roleConfig = currentEmployee
      ? ROLE_CONFIG[currentEmployee.accessLevel]
      : ROLE_CONFIG.LAVADOR;

    // Sugere a melhor rota permitida para o perfil
    let defaultAllowedRoute = "/";
    let defaultLabel = "Início";

    if (currentEmployee?.accessLevel === "LAVADOR") {
      defaultAllowedRoute = "/lavajato";
      defaultLabel = "Ir para o Lava-Jato";
    } else if (currentEmployee?.accessLevel === "MECANICO") {
      defaultAllowedRoute = "/oficina";
      defaultLabel = "Ir para Oficina & OS";
    } else if (currentEmployee?.accessLevel === "ATENDENTE") {
      defaultAllowedRoute = "/pdv";
      defaultLabel = "Ir para o PDV Balcão";
    }

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center text-amber-700 shadow-xl shadow-amber-500/10 animate-bounce">
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

          <p className="text-[11px] text-slate-400 italic">
            Para acessar esta tela, solicite autorização ao Administrador ou alterne para um usuário com privilégios no topo da tela.
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

          <Link
            href="/clientes"
            className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all"
          >
            Clientes & Veículos
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
