"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Crown,
  Users,
  CreditCard,
  TrendingUp,
  Building2,
  Wrench,
  Droplets,
  ShoppingCart,
  ShieldCheck,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  Search,
  Lock,
  Unlock,
  ExternalLink,
  DollarSign,
  Calendar,
  Layers,
  Check,
  X,
  Edit,
  Star,
} from "lucide-react";
import { SAAS_PLANS } from "@/lib/mercadopago";

export default function MasterAdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"tenants" | "payments" | "messages">("tenants");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modal de edição de oficina (Igual ao Projeto Salão)
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [editPlan, setEditPlan] = useState("STARTER");
  const [editMaxUsers, setEditMaxUsers] = useState(1);
  const [editStatus, setEditStatus] = useState("active");
  const [editIsExempt, setEditIsExempt] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 4500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search,
        plan: selectedPlan,
        status: selectedStatus,
      });
      const res = await fetch(`/api/master-admin?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
      showToast("Erro ao carregar métricas do Master Admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("torque_user");
        if (saved) {
          const u = JSON.parse(saved);
          if (u.email === "rafael.gielow@gmail.com" || u.isMaster === true) {
            setIsMaster(true);
            return;
          }
        }
      } catch (e) {}
      setIsMaster(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isMaster) {
      fetchData();
    }
  }, [isMaster, selectedPlan, selectedStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleUpdatePlan = async () => {
    if (!editingTenant) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/master-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PLAN",
          tenantId: editingTenant.id,
          newPlan: editPlan,
          newMaxUsers: Number(editMaxUsers),
          newStatus: editStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Plano de "${editingTenant.name}" atualizado para ${editPlan}!`);
        setEditingTenant(null);
        fetchData();
      } else {
        alert(json.error || "Erro ao atualizar plano");
      }
    } catch (err: any) {
      alert(err.message || "Erro na requisição");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleExempt = async (tenantId: string) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/master-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_EXEMPT", tenantId }),
      });
      const json = await res.json();
      showToast(json.message || "Status de isenção atualizado!");
      fetchData();
    } catch (err) {
      showToast("Erro ao alternar isenção da oficina.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendDays = async (tenantId: string, days: number) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/master-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "EXTEND_DAYS", tenantId, addDays: days }),
      });
      const json = await res.json();
      showToast(json.message || `Assinatura estendida em +${days} dias!`);
      if (editingTenant) setEditingTenant(null);
      fetchData();
    } catch (err) {
      showToast("Erro ao estender validade.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (tenantId: string) => {
    try {
      const res = await fetch("/api/master-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_STATUS", tenantId }),
      });
      const json = await res.json();
      showToast(json.message || "Status da oficina atualizado!");
      fetchData();
    } catch (err) {
      showToast("Erro ao alternar status da oficina.");
    }
  };

  const handleImpersonate = async (tenantId: string) => {
    try {
      const reason = window.prompt(
        "Motivo do acesso de suporte técnico (será registrado na trilha de auditoria e informado ao cliente por e-mail):",
        "Diagnóstico e suporte técnico solicitado"
      );
      if (reason === null) return; // Cancelou o prompt

      const res = await fetch("/api/master-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "IMPERSONATE", tenantId, reason: reason.trim() || "Suporte técnico Master" }),
      });
      const json = await res.json();
      if (json.success && json.token && json.user) {
        // Salva a sessão e o token master para poder retornar
        const currentSaved = localStorage.getItem("torque_user");
        if (currentSaved) {
          localStorage.setItem("torque_master_backup", currentSaved);
        }

        // Tenta obter o token master atual dos cookies para backup
        const cookies = document.cookie.split(";").map((c) => c.trim());
        const masterCookie = cookies.find((c) => c.startsWith("torque_token="));
        if (masterCookie) {
          localStorage.setItem("torque_master_token_backup", masterCookie.split("=")[1]);
        }

        localStorage.setItem("torque_user", JSON.stringify(json.user));
        document.cookie = `torque_token=${json.token}; path=/; max-age=3600; SameSite=Lax;`;
        window.location.href = "/dashboard";
      } else {
        alert(json.error || "Erro ao gerar acesso de suporte");
      }
    } catch (err) {
      showToast("Erro ao entrar como a oficina.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  const handleRestoreMasterSession = async () => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/master-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "EXIT_IMPERSONATION" }),
      });
      const json = await res.json();
      if (json.success && json.user) {
        localStorage.setItem("torque_user", JSON.stringify(json.user));
        if (json.token) {
          document.cookie = `torque_token=${json.token}; path=/; max-age=31536000; SameSite=Lax;`;
        }
        localStorage.removeItem("torque_master_backup");
        localStorage.removeItem("torque_master_token_backup");
        window.dispatchEvent(new CustomEvent("torque:user-updated", { detail: json.user }));
        setIsMaster(true);
        fetchData();
      } else {
        alert(json.error || "Não foi possível restaurar a sessão Master.");
      }
    } catch (err: any) {
      alert(err.message || "Erro ao conectar com o servidor.");
    } finally {
      setActionLoading(false);
    }
  };

  // 🔒 BLOQUEIO: Se não for rafael.gielow@gmail.com, exibe tela de acesso restrito
  if (isMaster === false) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-5">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto border border-rose-200 shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-black text-slate-900">Acesso Restrito ao Super Admin</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Esta área é de uso exclusivo do desenvolvedor e administrador geral da plataforma (rafael.gielow@gmail.com).
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRestoreMasterSession}
            disabled={actionLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span>{actionLoading ? "Restaurando..." : "Restaurar Sessão Master (Rafael)"}</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const tenants = data?.tenants || [];
  const payments = data?.payments || [];
  const messages = data?.contactMessages || [];

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Toast Notification */}
      {actionMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-purple-500/40 flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold">{actionMsg}</span>
        </div>
      )}

      {/* Top Header Master Admin */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Super Admin Master Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            Painel Executivo da Plataforma Torque ERP
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Gerenciamento global de oficinas mecânicas, lava-jatos, receita recorrente (MRR/ARR) e controle multi-tenant.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 border border-purple-500/30 transition-all active:scale-95 shadow-md flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Atualizar Métricas</span>
        </button>
      </div>

      {/* Cards de Métricas SaaS (Estilo Salão) */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">MRR Mensal</span>
              <DollarSign className="w-5 h-5 text-emerald-600 bg-emerald-50 p-1 rounded-xl" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              R$ {(stats.mrr || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ARR: R$ {(stats.arr || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/ano</span>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Oficinas Ativas</span>
              <Building2 className="w-5 h-5 text-blue-600 bg-blue-50 p-1 rounded-xl" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.activeTenants} <span className="text-xs text-slate-400 font-normal">/ {stats.totalTenants} total</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {stats.pastDueTenants} oficinas inativas ou vencidas
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Usuários / Equipe</span>
              <Users className="w-5 h-5 text-purple-600 bg-purple-50 p-1 rounded-xl" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalEmployees || 0}
            </div>
            <div className="text-[11px] text-purple-600 font-semibold">
              Mecânicos, lavadores e gerentes
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Volume de OS / Pátio</span>
              <Wrench className="w-5 h-5 text-amber-500 bg-amber-50 p-1 rounded-xl" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalServiceOrders || 0}
            </div>
            <div className="text-[11px] text-amber-600 font-semibold">
              {stats.totalWashTickets || 0} lavagens de pátio
            </div>
          </div>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("tenants")}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            activeTab === "tenants"
              ? "bg-slate-950 text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Oficinas Cadastradas ({tenants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            activeTab === "payments"
              ? "bg-slate-950 text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Histórico de Transações ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("messages")}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            activeTab === "messages"
              ? "bg-slate-950 text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Fale Conosco ({messages.length})</span>
        </button>
      </div>

      {/* ABA 1: LISTAGEM DE OFICINAS / TENANTS */}
      {activeTab === "tenants" && (
        <div className="space-y-4">
          {/* Barra de Filtros e Busca */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome da oficina, e-mail do proprietário ou CPF/CNPJ..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl hover:bg-slate-800 transition-all"
              >
                Buscar
              </button>
            </form>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700"
              >
                <option value="ALL">Todos os Planos</option>
                <option value="STARTER">Starter (Grátis - R$ 0)</option>
                <option value="PRO">Torque Pro (R$ 69,90)</option>
                <option value="ELITE">Torque Elite (R$ 129,90)</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700"
              >
                <option value="ALL">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos / Bloqueados</option>
              </select>
            </div>
          </div>

          {/* Tabela de Tenants */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Oficina / Empresa</th>
                    <th className="p-4">Proprietário(a)</th>
                    <th className="p-4">Plano Atual</th>
                    <th className="p-4 text-center">Usuários</th>
                    <th className="p-4">Validade Assinatura</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map((t: any) => {
                    const isExempt = t.subscriptionStatus === "exempt";
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 text-sm">{t.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {t.document || "Sem documento"} • {t.city || "São Paulo"}/{t.state || "SP"}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{t.ownerName}</div>
                          <div className="text-[11px] text-slate-500">{t.ownerEmail}</div>
                          {t.ownerPhone && <div className="text-[10px] text-slate-400">{t.ownerPhone}</div>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                t.plan === "ELITE"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : t.plan === "PRO"
                                  ? "bg-blue-100 text-blue-900 border border-blue-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {t.plan || "STARTER"}
                            </span>
                            {isExempt && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black text-amber-900 bg-amber-100 border border-amber-300 flex items-center gap-0.5">
                                ⭐ Cortesia
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-slate-800">{t.currentUsers || 0}</span>
                          <span className="text-slate-400"> / {t.maxUsers || 1}</span>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-700 font-semibold">
                            {isExempt
                              ? "Vitalício (Isento)"
                              : t.subscriptionExpiresAt
                              ? new Date(t.subscriptionExpiresAt).toLocaleDateString("pt-BR")
                              : "Indeterminado"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {isExempt
                              ? "Isenção Master Ativa"
                              : t.subscriptionStatus === "active"
                              ? "Assinatura em dia"
                              : "Pendente de renovação"}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {t.active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Bloqueado
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleToggleExempt(t.id)}
                              className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 ${
                                isExempt
                                  ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                              }`}
                              title={isExempt ? "Remover isenção de pagamento" : "Isentar oficina de cobranças"}
                            >
                              <span>⭐ {isExempt ? "Isento" : "Isentar"}</span>
                            </button>

                            <button
                              onClick={() => {
                                setEditingTenant(t);
                                setEditPlan(t.plan || "STARTER");
                                setEditMaxUsers(t.maxUsers || (t.plan === "ELITE" ? 10 : t.plan === "PRO" ? 4 : 1));
                                setEditStatus(t.subscriptionStatus || "active");
                                setEditIsExempt(isExempt);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] transition-all border border-purple-200 flex items-center gap-1"
                              title="Alterar Plano e Limites"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Mudar Plano</span>
                            </button>

                            <button
                              onClick={() => handleToggleStatus(t.id)}
                              className={`p-1.5 rounded-xl text-[11px] font-bold transition-all ${
                                t.active
                                  ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                              title={t.active ? "Bloquear Oficina" : "Desbloquear Oficina"}
                            >
                              {t.active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleImpersonate(t.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 transition-all"
                              title="Entrar como a Oficina para Suporte"
                            >
                              <span>Acessar</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {tenants.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Nenhuma oficina encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: HISTÓRICO DE PAGAMENTOS MERCADO PAGO */}
      {activeTab === "payments" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Transações de Assinatura do SaaS</h3>
            <span className="text-xs text-slate-500 font-medium">Processadas nativamente via Mercado Pago</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Data / Hora</th>
                  <th className="p-4">Oficina / Assinante</th>
                  <th className="p-4">Plano</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Método</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">ID Transação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((pay: any) => (
                  <tr key={pay.id} className="hover:bg-slate-50/80">
                    <td className="p-4 text-slate-600">
                      {new Date(pay.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{pay.tenant?.name || "Oficina"}</div>
                      <div className="text-[11px] text-slate-500">{pay.tenant?.ownerEmail}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold uppercase text-slate-800">{pay.plan}</span>
                    </td>
                    <td className="p-4 font-black text-slate-900">
                      R$ {Number(pay.amount).toFixed(2)}
                    </td>
                    <td className="p-4 uppercase text-[11px] font-semibold text-slate-600">
                      {pay.method === "pix" ? "💠 PIX" : "💳 Cartão"}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          pay.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : pay.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {pay.status === "approved" ? "Aprovado" : pay.status === "pending" ? "Pendente" : pay.status}
                      </span>
                    </td>
                    <td className="p-4 text-[11px] text-slate-400 font-mono">
                      {pay.paymentId || pay.id}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Nenhuma transação registrada até o momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3: MENSAGENS FALE CONOSCO */}
      {activeTab === "messages" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900">Mensagens Recebidas pelo Site</h2>
          <div className="space-y-3">
            {messages.map((m: any) => (
              <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">
                    {m.name} ({m.email})
                  </span>
                  <span className="text-slate-400 font-mono">{new Date(m.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="text-xs font-semibold text-blue-600">{m.subject}</div>
                <p className="text-xs text-slate-600">{m.message}</p>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs font-medium">
                Nenhuma mensagem de contato recebida até o momento.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE PLANO & ASSINATURA (Idêntico ao Projeto Salão) */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 animate-scaleIn">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Troca de Plano & Gestão de Assinatura</h3>
                <p className="text-xs text-slate-500 font-medium">{editingTenant.name}</p>
              </div>
              <button
                onClick={() => setEditingTenant(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Seleção do Plano */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Plano da Oficina</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditPlan("STARTER");
                      setEditMaxUsers(1);
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      editPlan === "STARTER"
                        ? "border-purple-600 bg-purple-50 text-purple-900 font-black shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xs font-black">Starter</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Grátis (1 Usuário)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditPlan("PRO");
                      setEditMaxUsers(4);
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      editPlan === "PRO"
                        ? "border-blue-600 bg-blue-50 text-blue-900 font-black shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xs font-black">Oficina Pro</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">R$ 69,90 (4 Usuários)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditPlan("ELITE");
                      setEditMaxUsers(10);
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      editPlan === "ELITE"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-black shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xs font-black">Oficina Elite</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">R$ 129,90 (10 Usuários)</div>
                  </button>
                </div>
              </div>

              {/* Limite de Usuários */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Limite Máximo de Usuários/Colaboradores</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editMaxUsers}
                  onChange={(e) => setEditMaxUsers(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Status da Assinatura */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status da Assinatura</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="active">Ativa (Em dia)</option>
                  <option value="exempt">Isento de Pagamentos (Cortesia Master)</option>
                  <option value="past_due">Pendente / Vencida</option>
                  <option value="canceled">Cancelada</option>
                </select>
              </div>

              {/* Toggle Isenção Total de Cobrança */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                <div>
                  <label className="font-extrabold text-amber-950 block text-xs">⭐ Isenção Total de Cobrança</label>
                  <p className="text-[11px] text-amber-800">Cortesia VIP / Vitalícia (Oficina própria ou parceira)</p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsExempt}
                  onChange={(e) => {
                    setEditIsExempt(e.target.checked);
                    if (e.target.checked) setEditStatus("exempt");
                    else setEditStatus("active");
                  }}
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Bônus de Dias */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block font-bold text-slate-700">Estender Validade (Cortesia / Bônus)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExtendDays(editingTenant.id, 15)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs transition-all"
                  >
                    +15 Dias
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDays(editingTenant.id, 30)}
                    className="flex-1 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 font-black text-amber-900 text-xs transition-all border border-amber-300"
                  >
                    +30 Dias
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDays(editingTenant.id, 90)}
                    className="flex-1 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 font-black text-purple-900 text-xs transition-all border border-purple-300"
                  >
                    +90 Dias
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTenant(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpdatePlan}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs shadow-md"
              >
                {actionLoading ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
