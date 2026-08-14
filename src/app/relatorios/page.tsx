"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Gift,
  Package,
  UserCheck,
  Calendar,
  MessageSquare,
  DollarSign,
  Award,
  ArrowUpRight,
  Send,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatPhone } from "@/lib/formatters";

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState<"abc" | "aniversariantes" | "produtividade" | "estoque">("abc");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [toastMsg, setToastMsg] = useState("");
  const [sendingPhone, setSendingPhone] = useState<string | null>(null);

  const handleSendSilentGreeting = async (customer: any) => {
    setSendingPhone(customer.phone);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: customer.phone,
          message: customer.messagePreview,
          customerName: customer.name,
          referenceType: "ANIVERSARIO",
        }),
      });

      if (res.ok) {
        setToastMsg(`✓ Parabéns enviado com sucesso para ${customer.name} via WhatsApp!`);
        setTimeout(() => setToastMsg(""), 3500);
      } else {
        window.open(customer.whatsappLink, "_blank");
      }
    } catch (err) {
      window.open(customer.whatsappLink, "_blank");
    } finally {
      setSendingPhone(null);
    }
  };
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/relatorios?month=${selectedMonth}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedMonth]);

  if (loading || !reportData) {
    return <div className="text-center py-16 text-slate-400">Gerando relatórios e indicadores estratégicos...</div>;
  }

  const { abcCurve, birthdays, productivity, stock } = reportData;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Relatórios Estratégicos & Business Intelligence
          </h1>
          <p className="text-sm text-slate-500">
            Curva ABC de vendas, ranking de produtividade de mecânicos e CRM de aniversariantes via WhatsApp.
          </p>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-500/20 animate-bounce">
          <div className="flex items-center gap-2">
            <span>🎉 {toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg("")} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold flex-wrap">
        <button
          onClick={() => setActiveTab("abc")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "abc"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Curva ABC de Produtos ({abcCurve.products?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("aniversariantes")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "aniversariantes"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Gift className="w-4 h-4" />
          Aniversariantes do Mês ({birthdays.total})
        </button>

        <button
          onClick={() => setActiveTab("produtividade")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "produtividade"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Produtividade & Comissões ({productivity.length})
        </button>

        <button
          onClick={() => setActiveTab("estoque")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "estoque"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Package className="w-4 h-4" />
          Posição de Estoque & Ponto Crítico ({stock.lowStockCount})
        </button>
      </div>

      {/* ABA 1: CURVA ABC */}
      {activeTab === "abc" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <span className="text-xs font-bold text-emerald-900 uppercase">Classe A (Alta Rentabilidade)</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">70% da Receita</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">Itens mais importantes da sua oficina e autopeças.</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <span className="text-xs font-bold text-blue-900 uppercase">Classe B (Intermediários)</span>
              <p className="text-2xl font-black text-blue-700 mt-1">20% da Receita</p>
              <p className="text-[11px] text-blue-800 mt-0.5">Volume médio de giro e vendas.</p>
            </div>
            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs font-bold text-slate-800 uppercase">Classe C (Baixo Impacto)</span>
              <p className="text-2xl font-black text-slate-700 mt-1">10% da Receita</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Giro esporádico ou sob encomenda.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Classificação</th>
                    <th className="py-3 px-4">Produto / Peça</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-center">Qtd. Vendida</th>
                    <th className="py-3 px-4 text-right">Faturamento Total</th>
                    <th className="py-3 px-4 text-right">% Acumulada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {abcCurve.products?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-black text-xs ${
                            p.classification === "A"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : p.classification === "B"
                              ? "bg-blue-100 text-blue-800 border border-blue-300"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          Classe {p.classification}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.category}</td>
                      <td className="py-3 px-4 text-center font-bold font-mono">{p.totalUnitsSold} un.</td>
                      <td className="py-3 px-4 text-right font-black font-mono text-sm text-slate-900">
                        {formatCurrency(p.totalRevenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 font-bold">
                        {p.accumulatedPercentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: ANIVERSARIANTES DO MÊS */}
      {activeTab === "aniversariantes" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-slate-800 text-sm">Selecione o Mês:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="p-2 border border-slate-200 rounded-xl font-bold bg-purple-50 text-purple-900"
              >
                {months.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-slate-500">
              Dispare mensagens personalizadas de felicitações com 1 clique no WhatsApp com desconto especial.
            </p>
          </div>

          {birthdays.customers?.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
              <Gift className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-700">Nenhum aniversariante encontrado em {months[selectedMonth]}</h3>
              <p className="text-xs text-slate-500 mt-1">Preencha a data de nascimento no cadastro de clientes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {birthdays.customers.map((c: any) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-black text-xs">
                        Dia {c.day} de {months[selectedMonth]} 🎂
                      </span>
                      <span className="text-[11px] text-slate-500">{formatPhone(c.phone)}</span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900">{c.name}</h3>
                    {c.vehicles && (
                      <p className="text-xs text-slate-600 mt-1">🚗 {c.vehicles}</p>
                    )}

                    <div className="mt-3 p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-[11px] text-purple-950 italic">
                      "{c.messagePreview}"
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      disabled={sendingPhone === c.phone}
                      onClick={() => handleSendSilentGreeting(c)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {sendingPhone === c.phone ? "Enviando..." : "Parabenizar no WhatsApp"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: PRODUTIVIDADE & COMISSÕES */}
      {activeTab === "produtividade" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Profissional</th>
                  <th className="py-3 px-4">Função</th>
                  <th className="py-3 px-4 text-center">Serviços / OS</th>
                  <th className="py-3 px-4 text-center">Lavagens</th>
                  <th className="py-3 px-4 text-center">Vendas PDV</th>
                  <th className="py-3 px-4 text-right">Taxa Comissão</th>
                  <th className="py-3 px-4 text-right">Total Comissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productivity.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">{emp.name}</td>
                    <td className="py-3 px-4 text-slate-600">{emp.role}</td>
                    <td className="py-3 px-4 text-center font-bold font-mono">
                      {emp.totalServicesCount} ({formatCurrency(emp.servicesRevenue)})
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono">
                      {emp.totalWashesCount} ({formatCurrency(emp.washesRevenue)})
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono">
                      {emp.totalSalesCount} ({formatCurrency(emp.salesRevenue)})
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-blue-600">
                      {emp.commissionRate}%
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-sm text-emerald-600">
                      {formatCurrency(emp.commissionTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 4: POSIÇÃO DE ESTOQUE */}
      {activeTab === "estoque" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Capital Imobilizado em Peças</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(stock.totalCostValue)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stock.totalUnitsInStock} unidades no estoque</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Faturamento Projetado</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(stock.totalSaleValue)}</p>
              <p className="text-xs text-emerald-700 font-bold mt-0.5">Lucro projetado: {formatCurrency(stock.potentialProfit)}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-amber-800 uppercase">Itens em Alerta de Compra</span>
              <p className="text-2xl font-black text-amber-700 mt-1">{stock.lowStockCount} peças</p>
              <p className="text-xs text-amber-900 mt-0.5">Abaixo ou igual ao estoque mínimo</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Itens em Ponto de Pedido (Estoque Crítico)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Peça</th>
                    <th className="py-3 px-4">SKU / Marca</th>
                    <th className="py-3 px-4">Localização</th>
                    <th className="py-3 px-4 text-center">Estoque Atual</th>
                    <th className="py-3 px-4 text-center">Estoque Mínimo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stock.lowStockAlerts?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 text-slate-600">{item.sku} ({item.brand})</td>
                      <td className="py-3 px-4 text-slate-500">{item.shelfLocation || "Não especificado"}</td>
                      <td className="py-3 px-4 text-center font-black text-red-600">{item.currentStock}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{item.minStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
