"use client";

import Link from "next/link";
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
  Unlock,
  KeyRound,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth, ROLE_CONFIG, EmployeeUser } from "@/lib/authContext";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState("");
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [targetEmployee, setTargetEmployee] = useState<EmployeeUser | null>(null);

  const {
    currentEmployee,
    employees,
    isEnforced,
    setIsEnforced,
    switchEmployee,
    loginWithPin,
  } = useAuth();

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

  const handleSelectEmployee = (emp: EmployeeUser) => {
    // Se o operador tiver PIN e o modo restrito estiver ligado, pede o PIN
    if (isEnforced && emp.pinCode && emp.id !== currentEmployee?.id) {
      setTargetEmployee(emp);
      setPinInput("");
      setPinError("");
      return;
    }

    switchEmployee(emp);
    setIsSwitchModalOpen(false);
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployee) return;

    const result = loginWithPin(targetEmployee.id, pinInput);
    if (result.success) {
      setTargetEmployee(null);
      setPinInput("");
      setIsSwitchModalOpen(false);
    } else {
      setPinError(result.message || "PIN inválido");
    }
  };

  const currentRole = currentEmployee
    ? ROLE_CONFIG[currentEmployee.accessLevel]
    : ROLE_CONFIG.ADMIN;

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
          {/* Seletor de Operador / Perfil Ativo */}
          <button
            type="button"
            onClick={() => setIsSwitchModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-left group"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
              {currentRole?.icon || "👤"}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-none truncate max-w-[130px]">
                {currentEmployee?.name || "Operador"}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                <span>{currentRole?.label || "Administrador"}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isEnforced ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  title={isEnforced ? "Modo Restrito" : "Modo Livre"}
                />
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 ml-1" />
          </button>

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

      {/* Modal: Trocar de Operador / Gestão de Perfis */}
      {isSwitchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Controle de Usuários & Operadores
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selecione o operador atual para simular acessos
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSwitchModalOpen(false);
                  setTargetEmployee(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternador de Modo de Restrição */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  {isEnforced ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      Modo Restrito por Perfil (Ativo)
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      Modo Demonstração / Acesso Livre
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isEnforced
                    ? "Oculta menus restritos para cada cargo (ex: lavador não vê caixa)."
                    : "Todos os módulos liberados para navegação rápida de testes."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEnforced(!isEnforced)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  isEnforced
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-emerald-600 text-white shadow-sm"
                }`}
              >
                {isEnforced ? "Mudar p/ Livre" : "Ativar Bloqueio"}
              </button>
            </div>

            {/* Confirmação de PIN caso necessário */}
            {targetEmployee ? (
              <form onSubmit={handleConfirmPin} className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  Digite o PIN de 4 dígitos para {targetEmployee.name}:
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    placeholder="PIN (ex: 1234)"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-blue-300 text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetEmployee(null)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Voltar
                  </button>
                </div>
                {pinError && <p className="text-xs text-red-600 font-bold">{pinError}</p>}
              </form>
            ) : (
              /* Lista de Usuários Disponíveis */
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {employees.map((emp) => {
                  const roleConfig = ROLE_CONFIG[emp.accessLevel] || ROLE_CONFIG.MECANICO;
                  const isSelected = emp.id === currentEmployee?.id;

                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleSelectEmployee(emp)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg">
                          {roleConfig.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {emp.name}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${roleConfig.badgeColor}`}
                            >
                              {roleConfig.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {emp.role} {emp.phone && `• ${emp.phone}`}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ação para o Administrador Gerenciar Usuários */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/equipe"
                onClick={() => setIsSwitchModalOpen(false)}
                className="text-blue-600 font-bold hover:underline flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                Painel Completo: Criar & Alterar Perfis de Usuários
              </Link>
              <button
                type="button"
                onClick={() => setIsSwitchModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
