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
  Lock,
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
  Mail,
  Send,
  Link as LinkIcon,
  Copy,
  Trash2,
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
    email: "",
    phone: "",
    password: "",
    commissionRate: "10",
    active: true,
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

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
      if (Array.isArray(data)) {
        setEmployees(data);
      }
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
      email: "",
      phone: "",
      password: "",
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
      accessLevel: emp.accessLevel,
      email: emp.email || "",
      phone: emp.phone || "",
      password: "",
      commissionRate: String(emp.commissionRate || 0),
      active: emp.active,
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleCopyInviteLink = (inviteToken: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/convite?token=${inviteToken}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(inviteToken);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const url = "/api/equipe";
      const method = editingEmployee ? "PUT" : "POST";
      const body = editingEmployee
        ? { id: editingEmployee.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        setSuccessMessage(
          editingEmployee
            ? "Dados do colaborador atualizados com sucesso!"
            : data.message || "Convite enviado com sucesso para o e-mail do colaborador!"
        );
        setTimeout(() => setSuccessMessage(""), 5000);
        loadEmployees();
        reloadAuthEmployees();
      } else {
        setErrorMessage(data.error || "Erro ao salvar funcionário");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar funcionário");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este funcionário da equipe?")) return;

    try {
      const res = await fetch(`/api/equipe?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccessMessage("Funcionário removido com sucesso!");
        setTimeout(() => setSuccessMessage(""), 3000);
        loadEmployees();
        reloadAuthEmployees();
      }
    } catch (e) {
      alert("Erro ao remover funcionário");
    }
  };

  // Filtragem de funcionários
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.toLowerCase().includes(search.toLowerCase()) ||
      (emp.email && emp.email.toLowerCase().includes(search.toLowerCase())) ||
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
            Controle de Equipe & Perfis de Acesso
          </h1>
          <p className="text-sm text-slate-500">
            Adicione funcionários, envie convites por e-mail para criação de senha e controle permissões de cada cargo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="equipe-invite-btn"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Convidar Novo Funcionário
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs de Navegação: Usuários vs Matriz de Permissões */}
      <div id="equipe-roles-info" className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("USUARIOS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "USUARIOS"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" />
          Membros da Equipe ({employees.length})
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
          {/* Barra de Busca e Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por nome, cargo ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-400">Filtrar:</span>
              <button
                onClick={() => setSelectedRoleFilter("TODOS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedRoleFilter === "TODOS"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Todos ({employees.length})
              </button>
              {allRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    selectedRoleFilter === role
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {ROLE_CONFIG[role].label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Colaboradores */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Carregando equipe...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Nenhum funcionário encontrado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Adicione seu primeiro mecânico, atendente ou lavador clicando no botão acima para enviar o convite de acesso.
              </p>
            </div>
          ) : (
            <div id="equipe-list-table" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((emp) => {
                const roleConfig = ROLE_CONFIG[emp.accessLevel as AccessLevel] || ROLE_CONFIG.MECANICO;
                return (
                  <div
                    key={emp.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-blue-200 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 leading-tight">
                              {emp.name}
                            </h3>
                            <span className="text-xs text-slate-500 font-medium">
                              {emp.role}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleConfig.badgeColor}`}
                        >
                          {roleConfig.label}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="font-mono truncate">{emp.email || "Sem e-mail cadastrado"}</span>
                        </div>

                        {emp.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{formatPhone(emp.phone)}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Percent className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>Comissão: <strong>{emp.commissionRate}%</strong></span>
                        </div>
                      </div>

                      {/* Status de Senha / Convite */}
                      <div className="pt-1">
                        {emp.hasPassword ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Senha Ativa (Acesso Liberado)</span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                              <Mail className="w-3 h-3 text-amber-600" />
                              <span>Convite Enviado por E-mail</span>
                            </div>
                            {emp.inviteToken && (
                              <button
                                type="button"
                                onClick={() => handleCopyInviteLink(emp.inviteToken)}
                                className="block text-[10px] font-bold text-blue-600 hover:text-blue-800 underline"
                              >
                                {copiedToken === emp.inviteToken ? "✓ Link Copiado!" : "Copiar Link de Criar Senha"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>

                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* TAB 2: MATRIZ DE PERMISSÕES */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Personalização de Acessos por Perfil
              </h2>
              <p className="text-xs text-slate-500">
                Defina exatamente quais telas cada cargo pode acessar.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedRoleToEditPermissions}
                onChange={(e) => setSelectedRoleToEditPermissions(e.target.value as AccessLevel)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                {allRoles.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_CONFIG[role].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SYSTEM_MODULES.map((mod) => {
              const isAllowed = (permissionsMap[selectedRoleToEditPermissions] || []).includes(mod.href);
              return (
                <div
                  key={mod.id}
                  onClick={() => togglePermission(selectedRoleToEditPermissions, mod.href)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isAllowed
                      ? "bg-blue-50/60 border-blue-200 text-blue-900"
                      : "bg-slate-50 border-slate-200 text-slate-500 opacity-60"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{mod.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{mod.href}</div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isAllowed ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {isAllowed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE FUNCIONÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {editingEmployee ? "Editar Funcionário" : "Convidar Novo Funcionário"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nome Completo do Funcionário *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  E-mail do Funcionário (Receberá o Convite) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="mecanico@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
                />
                {!editingEmployee && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    ✉️ Um link seguro será enviado para este e-mail para ele criar sua senha.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Cargo na Oficina *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mecânico Líder"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Perfil de Permissão *
                  </label>
                  <select
                    value={formData.accessLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, accessLevel: e.target.value as AccessLevel })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="MECANICO">🔧 Mecânico (Oficina & OS)</option>
                    <option value="LAVADOR">🧼 Lavador (Pátio Lava-Jato)</option>
                    <option value="ATENDENTE">🏷️ Atendente (PDV & Caixa)</option>
                    <option value="GERENTE">👔 Gerente (Operação & Finanças)</option>
                    <option value="ADMIN">👑 Administrador</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Comissão (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="10"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {editingEmployee
                    ? "Alterar Senha de Acesso (Opcional - deixe em branco para manter)"
                    : "Senha de Acesso do Funcionário (Opcional)"}
                </label>
                <input
                  type="password"
                  placeholder={
                    editingEmployee
                      ? "Digite nova senha para alterar ou deixe em branco"
                      : "Defina a senha agora ou deixe em branco para ele criar via convite"
                  }
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {saving ? "Salvando..." : editingEmployee ? "Salvar Alterações" : "Salvar e Enviar Convite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
