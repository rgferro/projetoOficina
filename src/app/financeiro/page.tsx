"use client";

import { useState, useEffect } from "react";
import {
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Calendar,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  QrCode,
  Banknote,
  CreditCard,
  Building,
  Users,
  X,
  FileText,
} from "lucide-react";
import {
  formatCurrency,
  formatDateTime,
  formatDate,
} from "@/lib/formatters";

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<"caixa" | "pagar" | "receber">("caixa");

  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [accountsPayable, setAccountsPayable] = useState<any[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais de Caixa
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftAction, setShiftAction] = useState<"ABRIR" | "SANGRIA" | "SUPRIMENTO" | "FECHAR">("ABRIR");
  const [shiftAmount, setShiftAmount] = useState("");
  const [shiftReason, setShiftReason] = useState("");
  const [shiftEmployeeId, setShiftEmployeeId] = useState("");
  const [shiftNotes, setShiftNotes] = useState("");

  // Modal Conta a Pagar / Receber
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billType, setBillType] = useState<"PAGAR" | "RECEBER">("PAGAR");
  const [billDescription, setBillDescription] = useState("");
  const [billCategory, setBillCategory] = useState("PEÇAS");
  const [billAmount, setBillAmount] = useState("");
  const [billDueDate, setBillDueDate] = useState("");
  const [billSupplierId, setBillSupplierId] = useState("");

  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [transRes, shiftRes, payRes, recRes, supRes, empRes] = await Promise.all([
        fetch("/api/financeiro"),
        fetch("/api/financeiro/caixa-turno"),
        fetch("/api/financeiro/contas-pagar"),
        fetch("/api/financeiro/contas-receber"),
        fetch("/api/fornecedores"),
        fetch("/api/equipe"),
      ]);

      const [transData, shiftData, payData, recData, supData, empData] = await Promise.all([
        transRes.json(),
        shiftRes.json(),
        payRes.json(),
        recRes.json(),
        supRes.json(),
        empRes.json(),
      ]);

      setTransactions(
        Array.isArray(transData)
          ? transData
          : Array.isArray(transData?.transactions)
          ? transData.transactions
          : []
      );
      setActiveShift(shiftData?.status === "ABERTO" ? shiftData : null);
      setAccountsPayable(Array.isArray(payData) ? payData : []);
      setAccountsReceivable(Array.isArray(recData) ? recData : []);
      setSuppliers(Array.isArray(supData) ? supData : []);
      setEmployees(Array.isArray(empData) ? empData.filter((e: any) => e.active) : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Manipular Turno de Caixa (Abrir, Sangria, Suprimento, Fechar)
  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        action: shiftAction,
        notes: shiftNotes,
        employeeId: shiftEmployeeId || undefined,
      };

      if (shiftAction === "ABRIR") {
        payload.initialBalance = Number(shiftAmount) || 0;
      } else if (shiftAction === "SANGRIA" || shiftAction === "SUPRIMENTO") {
        payload.amount = Number(shiftAmount) || 0;
        payload.reason = shiftReason;
      } else if (shiftAction === "FECHAR") {
        payload.finalBalance = Number(shiftAmount) || 0;
      }

      const res = await fetch("/api/financeiro/caixa-turno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Erro na operação de caixa");

      setIsShiftModalOpen(false);
      setShiftAmount("");
      setShiftReason("");
      loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Quitar Conta a Pagar
  const handlePayBill = async (id: string) => {
    const method = prompt("Forma de pagamento (PIX, DINHEIRO, CARTAO):", "PIX");
    if (!method) return;

    try {
      const res = await fetch("/api/financeiro/contas-pagar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "PAGO", paymentMethod: method }),
      });
      if (res.ok) loadAll();
    } catch (err) {
      alert("Erro ao quitar conta");
    }
  };

  // Receber Conta
  const handleReceiveBill = async (id: string) => {
    const method = prompt("Forma de recebimento (PIX, DINHEIRO, CARTAO):", "PIX");
    if (!method) return;

    try {
      const res = await fetch("/api/financeiro/contas-receber", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "PAGO", paymentMethod: method }),
      });
      if (res.ok) loadAll();
    } catch (err) {
      alert("Erro ao receber");
    }
  };

  // Cadastrar nova Conta
  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const endpoint = billType === "PAGAR" ? "/api/financeiro/contas-pagar" : "/api/financeiro/contas-receber";
      const payload: any = {
        description: billDescription,
        amount: Number(billAmount),
        dueDate: billDueDate,
      };

      if (billType === "PAGAR") {
        payload.category = billCategory;
        payload.supplierId = billSupplierId || undefined;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao cadastrar");

      setIsBillModalOpen(false);
      setBillDescription("");
      setBillAmount("");
      setBillDueDate("");
      loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Cálculos Gerais do Caixa
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeAccountsPayable = Array.isArray(accountsPayable) ? accountsPayable : [];
  const safeAccountsReceivable = Array.isArray(accountsReceivable) ? accountsReceivable : [];

  const totalReceitas = safeTransactions
    .filter((t) => t.type === "RECEITA")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDespesas = safeTransactions
    .filter((t) => t.type === "DESPESA")
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoLiquido = totalReceitas - totalDespesas;

  // Cálculos de Contas
  const totalContasPagarPendentes = safeAccountsPayable
    .filter((b) => b.status === "PENDENTE")
    .reduce((sum, b) => sum + b.amount, 0);

  const totalContasReceberPendentes = safeAccountsReceivable
    .filter((b) => b.status === "PENDENTE")
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <CircleDollarSign className="w-7 h-7 text-blue-600" />
            Caixa & Gestão Financeira Completa
          </h1>
          <p className="text-sm text-slate-500">
            Abertura e fechamento de caixa, sangrias, contas a pagar, contas a receber e fluxo consolidado.
          </p>
        </div>

        {/* Status do Turno de Caixa e Botões */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeShift ? (
            <>
              <button
                onClick={() => {
                  setShiftAction("SANGRIA");
                  setShiftAmount("");
                  setIsShiftModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold text-xs border border-amber-200"
              >
                <Minus className="w-3.5 h-3.5 text-amber-700" />
                Sangria (Retirada)
              </button>

              <button
                onClick={() => {
                  setShiftAction("SUPRIMENTO");
                  setShiftAmount("");
                  setIsShiftModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-900 hover:bg-blue-100 font-bold text-xs border border-blue-200"
              >
                <Plus className="w-3.5 h-3.5 text-blue-700" />
                Suprimento (Entrada)
              </button>

              <button
                onClick={() => {
                  setShiftAction("FECHAR");
                  setShiftAmount("");
                  setIsShiftModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm shadow-red-600/20"
              >
                <Lock className="w-3.5 h-3.5" />
                Fechar Caixa do Dia
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setShiftAction("ABRIR");
                setShiftAmount("150");
                setIsShiftModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
            >
              <Unlock className="w-3.5 h-3.5" />
              Abrir Turno de Caixa
            </button>
          )}

          <button
            onClick={() => {
              setBillType("PAGAR");
              setIsBillModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Conta</span>
          </button>
        </div>
      </div>

      {/* Alerta de Caixa Aberto */}
      {activeShift && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
            <div>
              <span className="font-bold text-emerald-950 text-sm block">
                Caixa Aberto por {activeShift.employee?.name || "Operador"}
              </span>
              <p className="text-emerald-800">
                Aberto em {formatDateTime(activeShift.openedAt)} • Fundo inicial de troco:{" "}
                <strong>{formatCurrency(activeShift.initialBalance)}</strong>
              </p>
            </div>
          </div>
          <div className="flex gap-4 font-bold text-emerald-900">
            <span>Sangrias: {formatCurrency(activeShift.totalSangrias)}</span>
            <span>Suprimentos: {formatCurrency(activeShift.totalSuprimentos)}</span>
          </div>
        </div>
      )}

      {/* Cards de Métricas Financeiras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Entradas / Receitas
            </span>
            <span className="text-2xl font-black text-emerald-600">
              {formatCurrency(totalReceitas)}
            </span>
            <p className="text-xs text-slate-500 mt-1">OS, Lava-Jato e Balcão</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Saídas / Despesas
            </span>
            <span className="text-2xl font-black text-red-600">
              {formatCurrency(totalDespesas)}
            </span>
            <p className="text-xs text-slate-500 mt-1">Peças, compras e sangrias</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Saldo Líquido
            </span>
            <span
              className={`text-2xl font-black ${
                saldoLiquido >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {formatCurrency(saldoLiquido)}
            </span>
            <p className="text-xs text-slate-500 mt-1">Receitas - Despesas</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CircleDollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block mb-1">
              Contas a Pagar Pendentes
            </span>
            <span className="text-2xl font-black text-amber-700">
              {formatCurrency(totalContasPagarPendentes)}
            </span>
            <p className="text-xs text-emerald-700 font-semibold mt-1">
              A Receber: {formatCurrency(totalContasReceberPendentes)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab("caixa")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "caixa"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Banknote className="w-4 h-4" />
          Livro Caixa & Movimentações ({safeTransactions.length})
        </button>

        <button
          onClick={() => setActiveTab("pagar")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "pagar"
              ? "border-red-600 text-red-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          Contas a Pagar ({safeAccountsPayable.length})
        </button>

        <button
          onClick={() => setActiveTab("receber")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "receber"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Contas a Receber ({safeAccountsReceivable.length})
        </button>
      </div>

      {/* Conteúdo Aba 1: Livro Caixa */}
      {activeTab === "caixa" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Histórico de Transações de Caixa</h3>
            <span className="text-xs text-slate-500">Últimas 50 movimentações</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4">Descrição da Movimentação</th>
                  <th className="py-3 px-4">Origem / Categoria</th>
                  <th className="py-3 px-4">Forma Pagto</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-slate-500">{formatDateTime(t.date)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{t.description}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{t.paymentMethod}</td>
                    <td
                      className={`py-3 px-4 text-right font-black font-mono text-sm ${
                        t.type === "RECEITA" ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {t.type === "RECEITA" ? "+" : "-"} {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo Aba 2: Contas a Pagar */}
      {activeTab === "pagar" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Controle de Contas a Pagar</h3>
            <span className="text-xs text-amber-700 font-bold">
              Total Pendente: {formatCurrency(totalContasPagarPendentes)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Descrição da Conta / Boleto</th>
                  <th className="py-3 px-4">Fornecedor</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accountsPayable.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{formatDate(b.dueDate)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{b.description}</td>
                    <td className="py-3 px-4 text-slate-600">{b.supplier?.name || "-"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {b.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-sm text-red-600">
                      {formatCurrency(b.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === "PAGO"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {b.status === "PENDENTE" && (
                        <button
                          onClick={() => handlePayBill(b.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          Quitar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo Aba 3: Contas a Receber */}
      {activeTab === "receber" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Controle de Contas a Receber / Faturamento</h3>
            <span className="text-xs text-emerald-700 font-bold">
              Total a Receber: {formatCurrency(totalContasReceberPendentes)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accountsReceivable.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{formatDate(b.dueDate)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{b.description}</td>
                    <td className="py-3 px-4 text-slate-600">{b.customer?.name || "-"}</td>
                    <td className="py-3 px-4 text-right font-black font-mono text-sm text-emerald-600">
                      {formatCurrency(b.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === "PAGO"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {b.status === "PENDENTE" && (
                        <button
                          onClick={() => handleReceiveBill(b.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          Receber
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Turno de Caixa (Abertura, Sangria, Suprimento, Fechamento) */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {shiftAction === "ABRIR" && "Abertura de Turno de Caixa"}
                {shiftAction === "SANGRIA" && "Sangria de Caixa (Retirada de Dinheiro)"}
                {shiftAction === "SUPRIMENTO" && "Suprimento de Caixa (Aporte de Troco)"}
                {shiftAction === "FECHAR" && "Fechamento de Caixa do Dia"}
              </h3>
              <button onClick={() => setIsShiftModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleShiftSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {shiftAction === "ABRIR" && "Fundo Inicial de Troco (R$)"}
                  {shiftAction === "SANGRIA" && "Valor a Retirar (R$)"}
                  {shiftAction === "SUPRIMENTO" && "Valor a Inserir (R$)"}
                  {shiftAction === "FECHAR" && "Saldo Final em Dinheiro na Gaveta (R$)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={shiftAmount}
                  onChange={(e) => setShiftAmount(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-base font-black"
                />
              </div>

              {(shiftAction === "SANGRIA" || shiftAction === "SUPRIMENTO") && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Motivo / Justificativa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pagamento de marmita, depósito bancário..."
                    value={shiftReason}
                    onChange={(e) => setShiftReason(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              )}

              {shiftAction === "ABRIR" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operador Responsável</label>
                  <select
                    value={shiftEmployeeId}
                    onChange={(e) => setShiftEmployeeId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    <option value="">Operador Geral</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observações Opcionais</label>
                <input
                  type="text"
                  placeholder="Notas adicionais..."
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  {saving ? "Salvando..." : "Confirmar Operação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nova Conta a Pagar / Receber */}
      {isBillModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Cadastrar Nova Conta
              </h3>
              <button onClick={() => setIsBillModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBillType("PAGAR")}
                  className={`p-2.5 rounded-xl border font-bold text-center ${
                    billType === "PAGAR"
                      ? "border-red-600 bg-red-50 text-red-900"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  Conta a Pagar (Despesa)
                </button>
                <button
                  type="button"
                  onClick={() => setBillType("RECEBER")}
                  className={`p-2.5 rounded-xl border font-bold text-center ${
                    billType === "RECEBER"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  Conta a Receber (Receita)
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição / Referência *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Boleto Distribuidora Peças, Aluguel do Box"
                  value={billDescription}
                  onChange={(e) => setBillDescription(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-black text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {billType === "PAGAR" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Categoria</label>
                      <select
                        value={billCategory}
                        onChange={(e) => setBillCategory(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl"
                      >
                        <option value="PEÇAS">Peças & Insumos</option>
                        <option value="ALUGUEL">Aluguel do Imóvel</option>
                        <option value="ENERGIA">Energia / Luz</option>
                        <option value="AGUA">Água / Saneamento</option>
                        <option value="SALARIOS">Salários / Comissões</option>
                        <option value="FERRAMENTAS">Ferramentas & Equipamentos</option>
                        <option value="IMPOSTOS">Impostos & Taxas</option>
                        <option value="OUTROS">Outros</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Fornecedor</label>
                      <select
                        value={billSupplierId}
                        onChange={(e) => setBillSupplierId(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl"
                      >
                        <option value="">Nenhum / Avulso</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBillModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold"
                >
                  {saving ? "Salvando..." : "Salvar Conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
