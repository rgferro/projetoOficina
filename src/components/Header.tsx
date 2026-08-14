"use client";

import Link from "next/link";
import { Menu, Plus, Droplets, Wrench, UserPlus, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const d = new Date();
    const formatted = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
    setCurrentDate(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-slate-800 hidden sm:block">
            Painel Operacional
          </h2>
          <p className="text-xs text-slate-500 font-medium">{currentDate}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Ações Rápidas */}
        <Link
          href="/lavajato?action=new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 text-xs font-semibold border border-cyan-200 transition-colors"
        >
          <Droplets className="w-3.5 h-3.5 text-cyan-600" />
          <span className="hidden sm:inline">Entrada</span> Lava-Jato
        </Link>

        <Link
          href="/oficina/nova"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-sm shadow-blue-500/20 transition-colors"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Nova OS</span>
        </Link>

        <Link
          href="/clientes?action=new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline">Cliente</span>
        </Link>
      </div>
    </header>
  );
}
