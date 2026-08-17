"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Droplets,
  Wrench,
  Package,
  ListOrdered,
  Users,
  UserCheck,
  CircleDollarSign,
  BarChart3,
  MessageSquare,
  Settings,
  Truck,
  ShoppingCart,
  X,
  CreditCard,
  Crown,
  BookOpen,
  Zap,
  Lock,
  Sparkles,
} from "lucide-react";
import { useAuth, ROLE_CONFIG } from "@/lib/authContext";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentEmployee, canAccess, isEnforced } = useAuth();
  const [isMasterUser, setIsMasterUser] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("torque_user");
        if (saved) {
          const u = JSON.parse(saved);
          if (u.email === "rafael.gielow@gmail.com" || u.isMaster === true) {
            setIsMasterUser(true);
          }
        }
      } catch (e) {}
    }
  }, []);

  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "PDV Balcão", href: "/pdv", icon: ShoppingCart, badge: "Vendas" },
    { name: "Lava-Jato", href: "/lavajato", icon: Droplets, badge: "Pátio" },
    { name: "Oficina & OS", href: "/oficina", icon: Wrench },
    { name: "Estoque de Peças", href: "/estoque", icon: Package },
    { name: "Tabela de Serviços", href: "/servicos", icon: ListOrdered },
    { name: "Fornecedores", href: "/fornecedores", icon: Truck },
    { name: "Clientes & Veículos", href: "/clientes", icon: Users },
    { name: "Equipe & Usuários", href: "/equipe", icon: UserCheck },
    { name: "Caixa & Financeiro", href: "/financeiro", icon: CircleDollarSign },
    { name: "Relatórios & BI", href: "/relatorios", icon: BarChart3 },
    { name: "CRM WhatsApp", href: "/crm", icon: MessageSquare, badge: "Alertas" },
    { name: "Assinatura & Planos", href: "/assinatura", icon: CreditCard, badge: "SaaS" },
    { name: "Manual & Guia", href: "/manual", icon: BookOpen, badge: "Ajuda" },
    { name: "Ajustes da Oficina", href: "/configuracoes", icon: Settings },
  ];

  // Apenas inclui "Master Admin" se o usuário for rafael.gielow@gmail.com
  const navigation = isMasterUser
    ? [
        ...baseNavigation.slice(0, 14),
        { name: "Master Admin", href: "/master-admin", icon: Crown, badge: "Admin" },
        baseNavigation[14],
      ]
    : baseNavigation;

  const currentRole = currentEmployee
    ? ROLE_CONFIG[currentEmployee.accessLevel]
    : ROLE_CONFIG.ADMIN;

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950">
          <Link href="/dashboard" className="flex items-center gap-3 font-bold text-lg tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-white">Torque</span>
              <span className="text-amber-400 font-black ml-1">ERP</span>
              <span className="block text-[9px] text-slate-400 font-normal tracking-widest uppercase">
                torquerp.com.br
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Card */}
        <div className="px-4 pt-3 pb-1">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <span className="text-base">{currentRole?.icon || "👤"}</span>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-200 truncate">
                  {currentEmployee?.name || "Operador"}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {currentRole?.label || "Administrador"}
                </div>
              </div>
            </div>
            {isEnforced && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Restrito
              </span>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 py-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Menu do Sistema</span>
          </div>

          {navigation.map((item) => {
            const hasAccess = canAccess(item.href);

            if (isEnforced && !hasAccess) {
              return null;
            }

            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                id={`tour-nav-${item.href.replace("/", "")}`}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : item.badge === "Admin"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : item.badge === "SaaS"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Botão Guia de Primeiros Passos no Sidebar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("torque:open-onboarding-tour"));
              if (onClose) onClose();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-95 border border-blue-400/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Guia Passo a Passo</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 text-[10px] text-slate-400 flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-400">
            <Link href="/sobre" className="hover:text-white transition-colors">Sobre</Link>
            <span>•</span>
            <Link href="/contato" className="hover:text-white transition-colors">Contato</Link>
            <span>•</span>
            <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
            <span>•</span>
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          </div>
          <div className="text-[9px] text-slate-400 text-center pt-1 border-t border-slate-900">
            Torque ERP © 2026 • torquerp.com.br
          </div>
        </div>
      </aside>
    </>
  );
}
