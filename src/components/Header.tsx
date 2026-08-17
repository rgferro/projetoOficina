"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Droplets,
  Wrench,
  UserPlus,
  User,
  Shield,
  Check,
  ChevronDown,
  X,
  Lock,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth, ROLE_CONFIG } from "@/lib/authContext";
import { InteractiveTourModal } from "@/components/InteractiveTour";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export default function Header({ onOpenSidebar }: HeaderProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState("");
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { currentEmployee } = useAuth();

  useEffect(() => {
    const d = new Date();
    const formatted = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
    setCurrentDate(formatted.charAt(0).toUpperCase() + formatted.slice(1));

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("torque_user");
        if (saved) {
          setLoggedUser(JSON.parse(saved));
        }
      } catch (e) {}
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("torque_user");
      localStorage.removeItem("autogestao_current_employee");
      document.cookie = "torque_session=; Max-Age=0; path=/;";
    }
    router.push("/login");
  };

  const displayName = loggedUser?.name || currentEmployee?.name || "Usuário";
  const displayRole = loggedUser?.isOwner
    ? "Proprietário"
    : loggedUser?.role || currentEmployee?.role || "Administrador";

  return (
    <>
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
          {/* Botão de Tour Interativo / Tutorial */}
          <button
            id="tour-btn-guia"
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("torque:open-onboarding-tour"));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-blue-600/20 transition-all active:scale-95 border border-blue-400/30"
            title="Clique para abrir o Guia de Primeiros Passos do Administrador"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Guia Passo a Passo</span>
          </button>

          {/* Atalhos Rápidos */}
          <Link
            id="tour-btn-lavajato-top"
            href="/lavajato"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold border border-cyan-200/80 transition-colors shadow-sm"
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden md:inline">Entrada</span> Lava-Jato
          </Link>

          <Link
            id="tour-btn-nova-os"
            href="/oficina/nova"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition-all"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Nova OS</span>
          </Link>

          {/* Usuário Logado & Menu de Logout */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-left group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-none truncate max-w-[130px]">
                  {displayName}
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                  <span>{displayRole}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 ml-0.5" />
            </button>

            {/* Dropdown Menu do Usuário */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-fadeIn space-y-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-900 truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{loggedUser?.email || ""}</p>
                  <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    {displayRole}
                  </span>
                </div>

                <Link
                  href="/equipe"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>Gerenciar Equipe</span>
                </Link>

                <Link
                  href="/configuracoes"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span>Ajustes da Oficina</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border-t border-slate-100"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal de Tour Guiado */}
      <InteractiveTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </>
  );
}

export { Header };
