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
} from "lucide-react";
import { SAAS_PLANS } from "@/lib/mercadopago";

export default function MasterAdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"TENANTS" | "PAYMENTS" | "MESSAGES" | "METRICS">("TENANTS");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/master-admin");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
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
            fetchData();
            return;
          }
        }
      } catch (e) {}
      setIsMaster(false);
      setLoading(false);
    }
  }, []);

  const handleAction = async (payload: any) => {
    try {
      const res = await fetch("/api/master-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg(json.message);
        setTimeout(() => setActionMsg(null), 4000);
        fetchData();
      } else {
        alert(json.error || "Erro na ação");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

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
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Painel da Minha Oficina
        </Link>
      </div>
    );
  }

  const stats = data?.stats;
  const tenants = data?.tenants || [];
  const payments = data?.payments || [];
  const messages = data?.contactMessages || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Master Admin */}
      <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden border border-purple-800/30">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Painel Geral do Dono do SaaS • Torque ERP
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Controle de Oficinas, Usuários & Faturamento
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Visão unificada de todos os clientes assinantes, pagamentos do Mercado Pago e volume de operações.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all flex-shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar Dados
        </button>
      </div>

      {/* Feedback de Ação */}
      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Oficinas (Tenants)</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats?.totalTenants || 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold">
            {stats?.activeTenants || 0} ativas no sistema
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total de Usuários</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats?.totalEmployees || 0}
          </div>
          <div className="text-[11px] text-slate-500">
            Mecânicos, lavadores e atendentes
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ordens de Serviço</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats?.totalServiceOrders || 0}
          </div>
          <div className="text-[11px] text-slate-500">
            {stats?.totalWashTickets || 0} lavagens de pátio
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Faturamento SaaS</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            R$ {(stats?.totalRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500">
            Mercado Pago PIX & Cartão
          </div>
        </div>
      </div>

      {/* Abas Alternáveis */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("TENANTS")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === "TENANTS"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Oficinas & Clientes ({tenants.length})
        </button>

        <button
          onClick={() => setActiveTab("PAYMENTS")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === "PAYMENTS"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Transações Mercado Pago ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab("MESSAGES")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === "MESSAGES"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Mail className="w-4 h-4" />
          Fale Conosco ({messages.length})
        </button>
      </div>

      {/* TAB 1: LISTA DE OFICINAS / TENANTS */}
      {activeTab === "TENANTS" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900">
            Oficinas Cadastradas e Assentos de Usuários
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Oficina / Razão Social</th>
                  <th className="py-3 px-4">Dono / Contato</th>
                  <th className="py-3 px-4">Plano & Assentos</th>
                  <th className="py-3 px-4">Status & Vencimento</th>
                  <th className="py-3 px-4 text-center">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{t.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.document || "Sem CNPJ"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-700">{t.ownerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.ownerEmail}</div>
                      <div className="text-[10px] text-slate-400">{t.ownerPhone || "Sem telefone"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        {t.plan} • Max {t.maxUsers} Usuários
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            t.subscriptionStatus === "active" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        <span className="capitalize font-bold text-slate-700">
                          {t.subscriptionStatus}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {t.subscriptionExpiresAt
                          ? new Date(t.subscriptionExpiresAt).toLocaleDateString("pt-BR")
                          : "Sem validade"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleAction({ action: "ADD_DAYS", tenantId: t.id, addDays: 30 })}
                          className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold"
                          title="Adicionar +30 dias de acesso"
                        >
                          +30 Dias
                        </button>
                        <button
                          onClick={() => {
                            const newPlan = prompt("Digite o novo plano (STARTER, PRO, ELITE):", t.plan);
                            if (newPlan) {
                              const maxUsers = newPlan === "ELITE" ? 8 : newPlan === "PRO" ? 4 : 2;
                              handleAction({ action: "UPDATE_PLAN", tenantId: t.id, newPlan, newMaxUsers: maxUsers });
                            }
                          }}
                          className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold"
                        >
                          Mudar Plano
                        </button>
                        <button
                          onClick={() => {
                            const newStatus = t.subscriptionStatus === "active" ? "suspended" : "active";
                            handleAction({ action: "SET_STATUS", tenantId: t.id, newStatus });
                          }}
                          className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-bold"
                        >
                          {t.subscriptionStatus === "active" ? "Suspender" : "Reativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAGAMENTOS MERCADO PAGO */}
      {activeTab === "PAYMENTS" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900">Histórico de Cobranças SaaS</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Oficina</th>
                  <th className="py-3 px-4">Plano</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.tenant?.name}</td>
                    <td className="py-3.5 px-4 font-semibold text-blue-600">{p.plan}</td>
                    <td className="py-3.5 px-4 uppercase text-slate-600">{p.paymentMethod}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      R$ {p.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MENSAGENS FALE CONOSCO */}
      {activeTab === "MESSAGES" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900">Mensagens Recebidas pelo Site</h2>
          <div className="space-y-3">
            {messages.map((m: any) => (
              <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{m.name} ({m.email})</span>
                  <span className="text-slate-400 font-mono">{new Date(m.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="text-xs font-semibold text-blue-600">{m.subject}</div>
                <p className="text-xs text-slate-600">{m.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
