"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Phone,
  Percent,
  Wrench,
  Droplets,
  DollarSign,
  Edit2,
  X,
  Sparkles,
  Shield,
  KeyRound,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Check,
  Search,
  Sliders,
  RotateCcw,
  LayoutDashboard,
  ShoppingCart,
  Package,
  ListOrdered,
  Truck,
  CircleDollarSign,
  BarChart3,
  MessageSquare,
  Settings,
} from "lucide-react";
import { formatCurrency, formatPhone } from "@/lib/formatters";
import {
  useAuth,
  ROLE_CONFIG,
  AccessLevel,
  EmployeeUser,
  SYSTEM_MODULES,
} from "@/lib/authContext";

export default function EquipePage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("TODOS");
  const [activeTab, setActiveTab] = useState<"USUARIOS" | "PERMISSOES">("USUARIOS");

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    role: "Mecânico",
    accessLevel: "MECANICO" as AccessLevel,
    pinCode: "1234",
    email: "",
    phone: "",
    commissionRate: "10",
    active: true,
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    reloadEmployees: reloadAuthEmployees,
    isEnforced,
    setIsEnforced,
    permissionsMap,
    togglePermission,
    resetPermissions,
    currentEmployee,
  } = useAuth();

  const [selectedRoleToEditPermissions, setSelectedRoleToEditPermissions] =
    useState<AccessLevel>("LAVADOR");

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/equipe");
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleOpenNew = () => {
    setEditingEmployee(null);
    setFormData({
      name: "",
      role: "Mecânico",
      accessLevel: "MECANICO",
      pinCode: "1234",
      email: "",
      phone: "",
      commissionRate: "10",
      active: true,
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: any) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      role: emp.role,
      accessLevel: (emp.accessLevel as AccessLevel) || "MECANICO",
      pinCode: emp.pinCode || "1234",
      email: emp.email || "",
      phone: emp.phone || "",
      commissionRate: String(emp.commissionRate || 0),
      active: emp.active !== undefined ? emp.active : true,
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const url = "/api/equipe";
      const method = editingEmployee ? "PUT" : "POST";
      const body = {
        id: editingEmployee?.id,
        ...formData,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setSuccessMessage(
          editingEmployee
            ? "Usuário e perfil atualizados com sucesso!"
            : "Novo usuário cadastrado com sucesso!"
        );
        setTimeout(() => setSuccessMessage(""), 3500);
        loadEmployees();
        reloadAuthEmployees();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Erro ao salvar funcionário");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar funcionário");
    } finally {
      setSaving(false);
    }
  };

  // Filtragem de funcionários
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.toLowerCase().includes(search.toLowerCase()) ||
      (emp.phone && emp.phone.includes(search));

    const matchesRole =
      selectedRoleFilter === "TODOS" || emp.accessLevel === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  const allRoles: AccessLevel[] = ["ADMIN", "GERENTE", "ATENDENTE", "MECANICO", "LAVADOR"];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600" />
            Controle de Usuários, Equipe & Perfis de Acesso
          </h1>
          <p className="text-sm text-slate-500">
            Gerencie o login dos colaboradores, personalize as permissões de cada perfil e defina comissões.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs de Navegação: Usuários vs Matriz de Permissões */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("USUARIOS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "USUARIOS"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" />
          Colaboradores & Usuários ({employees.length})
        </button>

        <button
          onClick={() => setActiveTab("PERMISSOES")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "PERMISSOES"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Shield className="w-4 h-4 text-amber-500" />
          Configurar Permissões dos Perfis
        </button>
      </div>

      {activeTab === "USUARIOS" ? (
        <>
          {/* Card de Status do Bloqueio */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isEnforced ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {isEnforced ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    Controle de Acesso Modular:{" "}
                    <span className={isEnforced ? "text-emerald-700" : "text-amber-700"}>
                      {isEnforced ? "🟢 ATIVADO (Menus ocultados conforme o cargo)" : "🟡 MODO LIVRE DE TESTES"}
                    </span>
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isEnforced
                    ? "Cada colaborador enxerga estritamente os módulos que você liberou para o cargo dele."
                    : "Todos os módulos estão liberados para navegação rápida de testes."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEnforced(!isEnforced)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all ${
                isEnforced
                  ? "bg-slate-800 hover:bg-slate-900 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {isEnforced ? "Mudar para Modo Livre" : "Ativar Bloqueio Rigoroso"}
            </button>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, cargo ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "TODOS", label: "Todos" },
                { id: "ADMIN", label: "👑 Admin" },
                { id: "GERENTE", label: "👔 Gerente" },
                { id: "ATENDENTE", label: "🏷️ Atendente" },
                { id: "MECANICO", label: "🔧 Mecânico" },
                { id: "LAVADOR", label: "🧼 Lavador" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedRoleFilter(tab.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedRoleFilter === tab.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Usuários */}
          {loading ? (
            <div className="text-center py-12 text-slate-400">Carregando usuários...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">Nenhum usuário encontrado</h3>
              <p className="text-xs text-slate-500 mt-1">
                Cadastre novos funcionários para gerenciar permissões e comissões.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((emp) => {
                const roleConfig =
                  ROLE_CONFIG[emp.accessLevel as AccessLevel] || ROLE_CONFIG.MECANICO;
                const allowedCount = (permissionsMap[emp.accessLevel as AccessLevel] || []).length;

                return (
                  <div
                    key={emp.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all group"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shadow-inner">
                            {roleConfig.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                              {emp.name}
                            </h3>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${roleConfig.badgeColor}`}
                            >
                              {roleConfig.label}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenEdit(emp)}
                          title="Editar Usuário e Perfil"
                          className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Informações do Colaborador */}
                      <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Cargo:</span>
                          <strong className="text-slate-800">{emp.role}</strong>
                        </div>

                        {emp.phone && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">WhatsApp:</span>
                            <strong className="text-slate-800">{formatPhone(emp.phone)}</strong>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">PIN Rápido:</span>
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {emp.pinCode ? `•••• (${emp.pinCode})` : "Sem PIN"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Módulos Liberados:</span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {allowedCount} de {SYSTEM_MODULES.length} módulos
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Comissão:</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {emp.commissionRate || 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Métricas de Produção */}
                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Produção</div>
                        <div className="text-xs font-black text-slate-800">
                          {emp.stats?.totalWashes || 0} lav. • {emp.stats?.totalOS || 0} OS
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Comissão Est.</div>
                        <div className="text-xs font-black text-emerald-600">
                          {formatCurrency(emp.stats?.estimatedCommission || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ABA DE CONFIGURAÇÃO DE PERMISSÕES DOS PERFIS */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Painel do Administrador: Liberar / Bloquear Módulos por Perfil
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Marque ou desmarque os módulos que você deseja liberar para cada cargo da oficina. As alterações têm efeito imediato!
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Deseja restaurar as permissões padrão recomendadas de fábrica?")) {
                    resetPermissions();
                    setSuccessMessage("Permissões restauradas para o padrão de fábrica com sucesso!");
                    setTimeout(() => setSuccessMessage(""), 3500);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Padrão
              </button>
            </div>

            {/* Seletor de Perfil para Configuração */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {allRoles.map((roleKey) => {
                const cfg = ROLE_CONFIG[roleKey];
                const isSelected = selectedRoleToEditPermissions === roleKey;
                const allowedCount = (permissionsMap[roleKey] || []).length;

                return (
                  <button
                    key={roleKey}
                    onClick={() => setSelectedRoleToEditPermissions(roleKey)}
                    className={`p-3 rounded-2xl border transition-all flex items-center gap-3 text-left min-w-[200px] ${
                      isSelected
                        ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-2xl">{cfg.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{cfg.label}</div>
                      <div className="text-[10px] text-slate-500">
                        {allowedCount} de {SYSTEM_MODULES.length} liberados
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Grid de Módulos com Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  Módulos do Sistema para:{" "}
                  <span className="text-blue-600">
                    {ROLE_CONFIG[selectedRoleToEditPermissions]?.label}
                  </span>
                </h3>

                {selectedRoleToEditPermissions === "ADMIN" && (
                  <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    👑 O Administrador sempre tem acesso irrestrito a todos os módulos.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SYSTEM_MODULES.map((mod) => {
                  const isAllowed = (
                    permissionsMap[selectedRoleToEditPermissions] || []
                  ).includes(mod.href);

                  return (
                    <div
                      key={mod.id}
                      onClick={() => {
                        if (selectedRoleToEditPermissions !== "ADMIN") {
                          togglePermission(selectedRoleToEditPermissions, mod.href);
                          setSuccessMessage(
                            `Permissão do módulo "${mod.name}" atualizada para ${ROLE_CONFIG[selectedRoleToEditPermissions]?.label}!`
                          );
                          setTimeout(() => setSuccessMessage(""), 2500);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isAllowed
                          ? "bg-emerald-50/70 border-emerald-200 hover:border-emerald-300"
                          : "bg-slate-50 border-slate-200 opacity-60 hover:opacity-100"
                      } ${selectedRoleToEditPermissions === "ADMIN" ? "cursor-default" : ""}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isAllowed ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          />
                          <h4 className="font-bold text-xs text-slate-900">{mod.name}</h4>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono pl-4">
                          {mod.href} • {mod.category}
                        </span>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                          isAllowed
                            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {isAllowed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "✕"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Criar / Editar Usuário e Perfil */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingEmployee ? "Alterar Usuário & Perfil de Acesso" : "Cadastrar Novo Usuário"}
                  </h3>
                  <p className="text-xs text-slate-500">Defina o nível de acesso e permissões</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Nome Completo do Funcionário / Usuário *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo / João Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Perfil de Acesso no Sistema *
                  </label>
                  <select
                    value={formData.accessLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, accessLevel: e.target.value as AccessLevel })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="ADMIN">👑 Administrador (Tudo Liberado)</option>
                    <option value="GERENTE">👔 Gerente (Operação & Financeiro)</option>
                    <option value="ATENDENTE">🏷️ Atendente / Caixa (PDV, OS & Caixa)</option>
                    <option value="MECANICO">🔧 Mecânico / Técnico (Apenas Oficina & OS)</option>
                    <option value="LAVADOR">🧼 Operador Lava-Jato (Apenas Pátio & Lavagens)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Cargo / Função na Oficina *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mecânico Chefe, Lavador Líder, Caixa"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    PIN / Senha Rápida (4 dígitos)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Ex: 1234"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Comissão Padrão (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="10"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Status da Conta
                  </label>
                  <select
                    value={formData.active ? "true" : "false"}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value === "true" })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="true">🟢 Ativo / Liberado</option>
                    <option value="false">🔴 Inativo / Bloqueado</option>
                  </select>
                </div>
              </div>

              {/* Matriz de Permissões Visual do Perfil Selecionado */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span>Permissões deste Perfil ({ROLE_CONFIG[formData.accessLevel]?.label}):</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {ROLE_CONFIG[formData.accessLevel]?.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar Usuário & Perfil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
