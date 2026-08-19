"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";
import {
  Droplets,
  Wrench,
  CircleDollarSign,
  Users,
  Zap,
  RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<{
    workshopName: string;
    activeWashTicketsCount: number;
    waitingCount: number;
    inProgressCount: number;
    readyCount: number;
    activeServiceOrdersCount: number;
    todayIncome: number;
    todayExpense: number;
    totalCustomers: number;
    totalVehicles: number;
  }>({
    workshopName: "Oficina & Lava-Jato",
    activeWashTicketsCount: 0,
    waitingCount: 0,
    inProgressCount: 0,
    readyCount: 0,
    activeServiceOrdersCount: 0,
    todayIncome: 0,
    todayExpense: 0,
    totalCustomers: 0,
    totalVehicles: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch("/api/dashboard?t=" + Date.now(), {
        cache: "no-store",
        headers: {
          "Pragma": "no-cache",
          "Cache-Control": "no-cache",
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar Dashboard:", err);
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  // 1. Carrega imediatamente na montagem / navegação
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 2. Atualização periódica automática a cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-800/30">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold backdrop-blur-sm border border-blue-400/30">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
              Torque ERP • Painel Operacional Ativo
            </span>
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700 transition-all cursor-pointer"
              title="Atualizar dados agora"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
              <span>{isRefreshing ? "Atualizando..." : "Tempo Real"}</span>
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {data.workshopName || "Oficina & Lava-Jato"}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Acompanhamento em tempo real do pátio de lavagem, ordens de serviço e caixa do dia.
          </p>
        </div>

        <div id="dash-quick-actions" className="flex flex-wrap gap-2.5">
          <Link
            href="/lavajato"
            className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
          >
            <Droplets className="w-4 h-4 text-cyan-600" />
            Quadro Lava-Jato
          </Link>
          <Link
            href="/oficina/nova"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            Criar Nova OS
          </Link>
        </div>
      </div>

      {/* Grid de Indicadores em Tempo Real */}
      <div id="dash-metrics-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Lava-Jato no Pátio</span>
            <Droplets className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {loading ? "..." : data.activeWashTicketsCount}
          </div>
          <div className="text-[11px] text-slate-500">
            {data.waitingCount} na fila • {data.inProgressCount} lavando • {data.readyCount} prontos
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Ordens de Serviço</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {loading ? "..." : data.activeServiceOrdersCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Em manutenção / orçamento
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Receita Hoje</span>
            <CircleDollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
            {loading ? "..." : formatCurrency(data.todayIncome)}
          </div>
          <div className="text-[11px] text-slate-500">
            Despesas do dia: {formatCurrency(data.todayExpense)}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Base de Clientes</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {loading ? "..." : data.totalCustomers}
          </div>
          <div className="text-[11px] text-slate-500">
            {data.totalVehicles} veículos cadastrados
          </div>
        </div>
      </div>
    </div>
  );
}

