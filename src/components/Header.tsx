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
  ChevronDown,
  Lock,
  LogOut,
  Sparkles,
  Settings,
  KeyRound,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/authContext";
import { InteractiveTourModal } from "@/components/InteractiveTour";
import PageTourButton from "@/components/PageTourButton";
import { UserProfileModal } from "@/components/UserProfileModal";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export default function Header({ onOpenSidebar }: HeaderProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState("");
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { currentEmployee, canAccess } = useAuth();

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
      document.cookie = "torque_token=; Max-Age=0; path=/;";
    }
    router.push("/login");
  };

  const displayName = loggedUser?.name || currentEmployee?.name || "Usuário";
  const displayRole = loggedUser?.isOwner
    ? "Proprietário"
    : loggedUser?.role || currentEmployee?.role || "Colaborador";

  const canCreateDirectly =
    !currentEmployee ||
    currentEmployee.accessLevel === "ADMIN" ||
    currentEmployee.accessLevel === "GERENTE" ||
    currentEmployee.accessLevel === "ATENDENTE";

  const activeUserForModal = {
    id: loggedUser?.id || currentEmployee?.id,
    name: displayName,
    email: loggedUser?.email || currentEmployee?.email,
    phone: loggedUser?.phone || currentEmployee?.phone,
    role: displayRole,
    accessLevel: currentEmployee?.accessLevel || loggedUser?.accessLevel || "MECANICO",
    workshopName: loggedUser?.workshopName || "Torque ERP",
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between no-print">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex-shrink-0"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden sm:block truncate">
            <h2 className="text-sm font-semibold text-slate-800">
              Painel Operacional
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate">{currentDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Botão Contextual de Tutorial da Tela Atual */}
          <PageTourButton />

          {/* Botão de Guia Geral do Fluxo */}
          <button
            id="tour-btn-guia"
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("torque:open-onboarding-tour"));
            }}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            title="Clique para abrir o Guia Passo a Passo"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Guia do Fluxo</span>
          </button>

          {/* Atalhos Rápidos (Condicionados à Permissão de Criação) */}
          {canAccess("/lavajato") && canCreateDirectly && (
            <Link
              id="tour-btn-lavajato-top"
              href="/lavajato"
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold border border-cyan-200/80 transition-colors shadow-sm flex-shrink-0"
              title="Entrada no Lava-Jato"
            >
              <Droplets className="w-4 h-4 text-cyan-600 flex-shrink-0" />
              <span className="hidden lg:inline">Lava-Jato</span>
            </Link>
          )}

          {canAccess("/oficina") && canCreateDirectly && (
            <Link
              id="tour-btn-nova-os"
              href="/oficina/nova"
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition-all flex-shrink-0"
              title="Criar Nova Ordem de Serviço"
            >
              <Wrench className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Nova OS</span>
            </Link>
          )}

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
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-fadeIn space-y-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-900 truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{loggedUser?.email || ""}</p>
                  <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    {displayRole}
                  </span>
                </div>

                {/* Opção para Qualquer Usuário: Meus Dados & Senha */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsProfileOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors text-left"
                >
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>Meus Dados & Senha</span>
                </button>

                {/* Opções Restritas por Cargo */}
                {canAccess("/equipe") && (
                  <Link
                    href="/equipe"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <UserPlus className="w-4 h-4 text-slate-500" />
                    <span>Gerenciar Equipe</span>
                  </Link>
                )}

                {canAccess("/configuracoes") && (
                  <Link
                    href="/configuracoes"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Ajustes da Oficina</span>
                  </Link>
                )}

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

      {/* Modal: Meus Dados & Senha */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={activeUserForModal}
        onUserUpdated={(updated) => {
          setLoggedUser((prev: any) => ({ ...prev, ...updated }));
          if (typeof window !== "undefined") {
            const saved = localStorage.getItem("torque_user");
            if (saved) {
              const current = JSON.parse(saved);
              localStorage.setItem("torque_user", JSON.stringify({ ...current, ...updated }));
            }
          }
        }}
      />

      {/* Modal de Tour Guiado */}
      <InteractiveTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </>
  );
}

export { Header };
