"use client";

import { useState, useEffect } from "react";
import {
  CircleDollarSign,
  Plus,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  QrCode,
  Banknote,
  CreditCard,
  X,
  FileText,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export default function FinanceiroPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Modal de Novo Lançamento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    type: "DESPESA",
    category: "COMPRA_PECA",
    amount: "",
    paymentMethod: "PIX",
  });
  const [saving, setSaving] = useState(false);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/financeiro?date=${selectedDate}`);
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          date: new Date(selectedDate),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          description: "",
          type: "DESPESA",
          category: "COMPRA_PECA",
          amount: "",
          paymentMethod: "PIX",
        });
        loadFinancialData();
      } else {
        alert("Erro ao lançar transação");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <CircleDollarSign className="w-7 h-7 text-emerald-600" />
            Caixa Diário & Financeiro
          </h1>
          <p className="text-sm text-slate-500">
            Controle de fluxo de caixa diário, conferência por forma de pagamento (PIX, Dinheiro, Cartão) e despesas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de Data */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Carregando dados do caixa...</div>
      ) : (
        <>
          {/* Cards do Fechamento do Dia */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Total de Entradas (Receitas)
                </span>
                <span className="text-2xl font-black text-emerald-600">
                  {formatCurrency(data?.summary?.totalIncome)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Total de Saídas (Despesas)
                </span>
                <span className="text-2xl font-black text-red-600">
                  {formatCurrency(data?.summary?.totalExpense)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Saldo Líquido do Dia
                </span>
                <span
                  className={`text-2xl font-black ${
                    (data?.summary?.netBalance || 0) >= 0 ? "text-slate-900" : "text-red-600"
                  }`}
                >
                  {formatCurrency(data?.summary?.netBalance)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Breakdown por Forma de Pagamento */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Conferência por Forma de Recebimento
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-teal-100 text-teal-700">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">PIX</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {formatCurrency(data?.summary?.byMethod?.PIX || 0)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">Dinheiro em Espécie</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {formatCurrency(data?.summary?.byMethod?.DINHEIRO || 0)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">Cartão de Crédito</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {formatCurrency(data?.summary?.byMethod?.CARTAO_CREDITO || 0)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">Cartão de Débito</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {formatCurrency(data?.summary?.byMethod?.CARTAO_DEBITO || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Extrato Detalhado do Dia */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Extrato de Movimentações ({data?.transactions?.length || 0})
            </h2>

            {data?.transactions?.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">
                Nenhum lançamento registrado nesta data.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Hora</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Forma Pagto</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.transactions?.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {formatDateTime(tx.date).split(" ")[1]}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{tx.description}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">{tx.paymentMethod}</td>
                        <td
                          className={`py-3 px-4 text-right font-black text-sm ${
                            tx.type === "RECEITA" ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {tx.type === "RECEITA" ? "+ " : "- "}
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Novo Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">Novo Lançamento Financeiro</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tipo de Movimentação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "RECEITA" })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      formData.type === "RECEITA"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    + Entrada (Receita)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "DESPESA" })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      formData.type === "DESPESA"
                        ? "bg-red-50 border-red-500 text-red-900"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    - Saída (Despesa)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de Shampoo Automotivo, Pagamento de Peça"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="150.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Forma de Pagamento</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="PIX">PIX</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CARTAO_CREDITO">Cartão Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão Débito</option>
                    <option value="BOLETO">Boleto</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {saving ? "Salvando..." : "Salvar Lançamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
