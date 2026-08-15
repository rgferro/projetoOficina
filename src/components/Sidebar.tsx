"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Droplets,
  Wrench,
  Package,
  ListOrdered,
  Truck,
  Users,
  UserCheck,
  CircleDollarSign,
  BarChart3,
  MessageSquare,
  Settings,
  X,
  Car,
  Lock,
  BookOpen,
} from "lucide-react";
import { useAuth, ROLE_CONFIG } from "@/lib/authContext";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentEmployee, canAccess, isEnforced } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
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
    { name: "Manual & Guia", href: "/manual", icon: BookOpen, badge: "Ajuda" },
    { name: "Backup & Ajustes", href: "/configuracoes", icon: Settings },
  ];

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
          <Link href="/" className="flex items-center gap-3 font-bold text-lg tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="text-white">Auto</span>
              <span className="text-blue-400">Gestão</span>
              <span className="block text-[10px] text-slate-400 font-normal uppercase tracking-wider">
                ERP Automotivo Pro
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
            <span>Menu Operacional</span>
          </div>

          {navigation.map((item) => {
            const hasAccess = canAccess(item.href);

            // Se estiver em modo restrito e o operador não tiver acesso, não exibe no menu
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
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
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
                        ? "bg-white text-blue-700"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Local Server Status Badge */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="bg-slate-850/90 rounded-xl p-2.5 border border-slate-800 text-[11px]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-300">Servidor Web Local</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Ativo
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              SQLite: dev.db
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
