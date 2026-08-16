"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { SAAS_PLANS } from "@/lib/mercadopago";

export default function MasterAdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
    fetchData();
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
          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/30 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar Dados
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {actionMsg}
        </div>
      )}

      {/* Cards de Métricas Globais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Oficinas (Tenants)</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats?.totalTenants || 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold">
            {stats?.activeTenants || 0} ativas no sistema
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Total de Usuários</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats?.totalEmployees || 0}
          </div>
          <div className="text-[11px] text-slate-500">
            Mecânicos, lavadores e atendentes
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Ordens de Serviço</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats?.totalServiceOrders || 0}
          </div>
          <div className="text-[11px] text-slate-500">
            {stats?.totalWashTickets || 0} lavagens de pátio
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Faturamento SaaS</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            R$ {Number(stats?.totalRevenue || 0).toFixed(2).replace(".", ",")}
          </div>
          <div className="text-[11px] text-slate-500">
            Mercado Pago PIX & Cartão
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("TENANTS")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "TENANTS"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Oficinas & Clientes ({tenants.length})
        </button>

        <button
          onClick={() => setActiveTab("PAYMENTS")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "PAYMENTS"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Transações Mercado Pago ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab("MESSAGES")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "MESSAGES"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Mail className="w-4 h-4" />
          Fale Conosco ({messages.length})
        </button>
      </div>

      {/* Conteúdo: Oficinas (Tenants) */}
      {activeTab === "TENANTS" && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Oficinas Cadastradas e Assentos de Usuários
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Oficina / Razão Social</th>
                  <th className="p-4">Dono / Contato</th>
                  <th className="p-4">Plano & Assentos</th>
                  <th className="p-4">Status & Vencimento</th>
                  <th className="p-4 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-[11px] text-slate-400">{t.document || "Sem CNPJ"}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{t.ownerName}</div>
                      <div className="text-[11px] text-slate-500">{t.ownerEmail}</div>
                      <div className="text-[11px] text-slate-400">{t.ownerPhone}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                        {t.plan} • Max: {t.maxUsers} Usuários
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            t.subscriptionStatus === "active" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        <span className="font-bold text-slate-800 capitalize">
                          {t.subscriptionStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {t.subscriptionExpiresAt
                          ? `Até ${new Date(t.subscriptionExpiresAt).toLocaleDateString("pt-BR")}`
                          : "Sem validade"}
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() =>
                          handleAction({
                            action: "EXTEND_DAYS",
                            tenantId: t.id,
                            addDays: 30,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] border border-emerald-200 transition-colors"
                      >
                        +30 Dias
                      </button>

                      <button
                        onClick={() =>
                          handleAction({
                            action: "UPDATE_PLAN",
                            tenantId: t.id,
                            newPlan: t.plan === "PRO" ? "ELITE" : "PRO",
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] border border-blue-200 transition-colors"
                      >
                        Mudar Plano
                      </button>

                      <button
                        onClick={() =>
                          handleAction({
                            action: "TOGGLE_STATUS",
                            tenantId: t.id,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[11px] transition-colors"
                      >
                        {t.subscriptionStatus === "active" ? "Suspender" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo: Pagamentos Mercado Pago */}
      {activeTab === "PAYMENTS" && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">
              Histórico de Cobranças e PIX Mercado Pago
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Data</th>
                  <th className="p-4">Oficina</th>
                  <th className="p-4">Plano</th>
                  <th className="p-4">Método</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-slate-500">
                      {new Date(p.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {p.tenant?.name || "Oficina"}
                    </td>
                    <td className="p-4 text-slate-700">{p.plan}</td>
                    <td className="p-4 uppercase font-bold text-slate-600">{p.method}</td>
                    <td className="p-4 font-black text-slate-900">
                      R$ {Number(p.amount).toFixed(2).replace(".", ",")}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
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

      {/* Conteúdo: Mensagens Fale Conosco */}
      {activeTab === "MESSAGES" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900">
            Mensagens Recebidas pelo Fale Conosco do Site
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {messages.map((m: any) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900">{m.name}</div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(m.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="text-xs text-blue-600 font-medium">
                  {m.email} • {m.phone || "Sem telefone"}
                </div>
                <div className="text-xs font-bold text-slate-800">{m.subject}</div>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                  {m.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
