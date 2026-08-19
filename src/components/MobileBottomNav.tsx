"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  ShoppingCart,
  Droplets,
  Menu,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";

interface MobileBottomNavProps {
  onOpenSidebar: () => void;
}

export function MobileBottomNav({ onOpenSidebar }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { canAccess } = useAuth();

  const primaryShortcuts = [
    {
      name: "Início",
      href: "/dashboard",
      icon: LayoutDashboard,
      match: (p: string) => p === "/dashboard" || p === "/",
    },
    {
      name: "Oficina",
      href: "/oficina",
      icon: Wrench,
      match: (p: string) => p.startsWith("/oficina"),
    },
    {
      name: "PDV",
      href: "/pdv",
      icon: ShoppingCart,
      match: (p: string) => p.startsWith("/pdv"),
    },
    {
      name: "Lava-Jato",
      href: "/lavajato",
      icon: Droplets,
      match: (p: string) => p.startsWith("/lavajato"),
    },
  ];

  // Verifica se a página atual pertence a um item fora dos atalhos primários (ex: Estoque, Clientes, Financeiro, etc.)
  const isOtherSectionActive = !primaryShortcuts.some((item) => item.match(pathname));

  return (
    <nav
      aria-label="Navegação rápida mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around no-print"
    >
      {primaryShortcuts.map((item) => {
        const isActive = item.match(pathname);
        const Icon = item.icon;
        const hasPermission = canAccess ? canAccess(item.href) : true;

        if (!hasPermission) return null;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-90 select-none ${
              isActive
                ? "text-blue-600 font-bold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? "scale-110 stroke-[2.5]" : "stroke-[1.75]"
                }`}
              />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </div>
            <span className="text-[10px] leading-tight mt-1 truncate max-w-full">
              {item.name}
            </span>
          </Link>
        );
      })}

      {/* Botão Mais / Menu Completo */}
      <button
        type="button"
        onClick={onOpenSidebar}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-90 select-none ${
          isOtherSectionActive
            ? "text-blue-600 font-bold"
            : "text-slate-500 hover:text-slate-900 font-medium"
        }`}
        aria-label="Abrir menu completo com mais opções"
      >
        <div className="relative">
          <Menu
            className={`w-5 h-5 transition-transform duration-200 ${
              isOtherSectionActive ? "scale-110 stroke-[2.5]" : "stroke-[1.75]"
            }`}
          />
          {isOtherSectionActive && (
            <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
          )}
        </div>
        <span className="text-[10px] leading-tight mt-1">Mais</span>
      </button>
    </nav>
  );
}

export default MobileBottomNav;
