"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wrench,
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  formatCurrency,
  formatPlate,
  formatPhone,
  formatDateTime,
} from "@/lib/formatters";

export default function OficinaPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [search, setSearch] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const url = `/api/oficina?status=${statusFilter}&q=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      loadOrders();
    }, 300);
    return () => clearTimeout(delay);
  }, [statusFilter, search]);

  const statusBadges: Record<string, { label: string; cls: string }> = {
    ORCAMENTO: { label: "Orçamento", cls: "bg-purple-100 text-purple-800 border-purple-200" },
    APROVADO: { label: "Aprovado", cls: "bg-blue-100 text-blue-800 border-blue-200" },
    EM_EXECUCAO: { label: "Em Execução", cls: "bg-amber-100 text-amber-800 border-amber-200" },
    AGUARDANDO_PECA: { label: "Aguardando Peça", cls: "bg-red-100 text-red-800 border-red-200" },
    CONCLUIDO: { label: "Concluído", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    CANCELADO: { label: "Cancelado", cls: "bg-slate-100 text-slate-800 border-slate-200" },
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Wrench className="w-7 h-7 text-blue-600" />
            Módulo Oficina Mecânica (Ordens de Serviço)
          </h1>
          <p className="text-sm text-slate-500">
            Gerencie orçamentos, aprovações, peças, mão de obra e impressão de comprovantes para o cliente.
          </p>
        </div>

        <Link
          href="/oficina/nova"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Ordem de Serviço
        </Link>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por placa, modelo do veículo ou nome do cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "TODOS", label: "Todas" },
            { id: "ORCAMENTO", label: "Orçamento" },
            { id: "EM_EXECUCAO", label: "Em Execução" },
            { id: "AGUARDANDO_PECA", label: "Aguardando Peça" },
            { id: "CONCLUIDO", label: "Concluídas" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Ordens de Serviço */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Carregando ordens de serviço...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhuma Ordem de Serviço encontrada</h3>
          <p className="text-xs text-slate-500 mt-1">
            {search ? "Tente buscar com outro filtro." : "Clique em 'Nova Ordem de Serviço' para abrir uma OS."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">OS #</th>
                  <th className="py-3.5 px-4">Veículo</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Mecânico</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((os) => {
                  const badge = statusBadges[os.status] || {
                    label: os.status,
                    cls: "bg-slate-100 text-slate-700",
                  };

                  return (
                    <tr key={os.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-black text-blue-600 text-sm">
                        #{os.osNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{os.vehicle.model}</div>
                        <div className="font-mono text-[11px] font-extrabold text-slate-500">
                          {formatPlate(os.vehicle.plate)}
                          {os.entryKm ? ` • ${os.entryKm.toLocaleString()} KM` : ""}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{os.customer.name}</div>
                        <div className="text-[11px] text-slate-500">{formatPhone(os.customer.phone)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {os.employee?.name || "Não atribuído"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 text-sm">
                          {formatCurrency(os.grandTotal)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Peças: {formatCurrency(os.totalParts)} | Mão de obra: {formatCurrency(os.totalServices)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/oficina/${os.id}/imprimir`}
                            target="_blank"
                            title="Imprimir OS / Cupom"
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </Link>

                          <Link
                            href={`/oficina/${os.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition-colors"
                          >
                            <span>Editar</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
