"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wrench,
  ArrowLeft,
  Printer,
  Trash2,
  Save,
  Plus,
  Car,
  Users,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  QrCode,
  Banknote,
  CreditCard,
} from "lucide-react";
import {
  formatCurrency,
  formatPlate,
  formatPhone,
  formatDateTime,
  formatDateOnly,
} from "@/lib/formatters";

interface OSItem {
  id: string;
  type: "PECA" | "SERVICO";
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function DetalhesOrdemServicoPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [status, setStatus] = useState("");
  const [entryKm, setEntryKm] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [technicalReport, setTechnicalReport] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [discount, setDiscount] = useState("0");
  const [employeeId, setEmployeeId] = useState("");
  const [items, setItems] = useState<OSItem[]>([]);

  // Checkout / Baixa no Caixa
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PIX");

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [orderRes, empRes] = await Promise.all([
        fetch(`/api/oficina/${params.id}`),
        fetch("/api/equipe"),
      ]);

      const [orderData, empData] = await Promise.all([
        orderRes.json(),
        empRes.json(),
      ]);

      setOrder(orderData);
      setEmployees(empData.filter((e: any) => e.active));

      setStatus(orderData.status);
      setEntryKm(orderData.entryKm ? String(orderData.entryKm) : "");
      setProblemDescription(orderData.problemDescription || "");
      setTechnicalReport(orderData.technicalReport || "");
      setInternalNotes(orderData.internalNotes || "");
      setDiscount(String(orderData.discount || 0));
      setEmployeeId(orderData.employeeId || "");
      setItems(
        orderData.items.map((i: any) => ({
          id: i.id,
          type: i.type,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const handleAddItem = (type: "PECA" | "SERVICO") => {
    const newItem: OSItem = {
      id: Math.random().toString(),
      type,
      name: type === "PECA" ? "Nova Peça" : "Novo Serviço",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof OSItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.totalPrice = Number(updated.quantity) * Number(updated.unitPrice);
        }
        return updated;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      alert("A OS deve conter ao menos 1 item.");
      return;
    }
    setItems(items.filter((i) => i.id !== id));
  };

  const totalParts = items
    .filter((i) => i.type === "PECA")
    .reduce((sum, i) => sum + (i.totalPrice || 0), 0);

  const totalServices = items
    .filter((i) => i.type === "SERVICO")
    .reduce((sum, i) => sum + (i.totalPrice || 0), 0);

  const discountNum = Number(discount) || 0;
  const grandTotal = Math.max(0, totalParts + totalServices - discountNum);

  const handleSave = async (e?: React.FormEvent, extraFields: any = {}) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMessage("");

    try {
      const payload = {
        status,
        entryKm: entryKm ? Number(entryKm) : null,
        problemDescription,
        technicalReport,
        internalNotes,
        discount: discountNum,
        employeeId: employeeId || null,
        items: items.map((i) => ({
          type: i.type,
          name: i.name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
        ...extraFields,
      };

      const res = await fetch(`/api/oficina/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao salvar alterações");

      const updated = await res.json();
      setOrder(updated);
      setSuccessMessage("Ordem de Serviço salva com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (err: any) {
      alert(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckoutAndFinish = async () => {
    setSaving(true);
    try {
      await handleSave(undefined, {
        status: "CONCLUIDO",
        markAsPaid: true,
        paymentMethod,
      });
      setIsPaymentModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir a Ordem de Serviço #${order?.osNumber}?`)) {
      return;
    }
    try {
      await fetch(`/api/oficina/${params.id}`, { method: "DELETE" });
      router.push("/oficina");
    } catch (err) {
      alert("Erro ao excluir OS");
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-400">Carregando OS...</div>;
  }

  if (!order) {
    return <div className="text-center py-16 text-slate-500">Ordem de Serviço não encontrada.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/oficina"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">
                Ordem de Serviço #{order.osNumber}
              </h1>
              {order.paymentStatus === "PAGO" && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ✓ PAGO ({order.paymentMethod || "PIX"})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Criada em {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/oficina/${order.id}/imprimir`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir Comprovante
          </Link>

          {order.paymentStatus !== "PAGO" && (
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar & Receber
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Info Card: Cliente & Veículo */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Cliente
          </span>
          <p className="font-bold text-slate-900 text-sm">{order.customer.name}</p>
          <p className="text-slate-600">{formatPhone(order.customer.phone)}</p>
        </div>

        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Veículo
          </span>
          <p className="font-bold text-slate-900 text-sm">
            {order.vehicle.brand} {order.vehicle.model}
          </p>
          <p className="font-mono font-bold text-blue-600">{formatPlate(order.vehicle.plate)}</p>
        </div>

        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Status Atual
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg font-bold text-xs"
          >
            <option value="ORCAMENTO">Orçamento</option>
            <option value="APROVADO">Aprovado</option>
            <option value="EM_EXECUCAO">Em Execução</option>
            <option value="AGUARDANDO_PECA">Aguardando Peça</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Mecânico Responsável
          </span>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg text-xs"
          >
            <option value="">Selecione...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Diagnóstico */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Problema Relatado & Diagnóstico
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reclamação do Cliente
            </label>
            <textarea
              rows={3}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Diagnóstico do Mecânico
            </label>
            <textarea
              rows={3}
              value={technicalReport}
              onChange={(e) => setTechnicalReport(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs"
            />
          </div>
        </div>
      </div>

      {/* Itens: Peças e Serviços */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Peças e Serviços da OS
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddItem("SERVICO")}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs border border-blue-200"
            >
              + Serviço
            </button>
            <button
              type="button"
              onClick={() => handleAddItem("PECA")}
              className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-xs border border-amber-200"
            >
              + Peça
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-2 px-3 w-28">Tipo</th>
                <th className="py-2 px-3">Descrição</th>
                <th className="py-2 px-3 w-20 text-center">Qtd.</th>
                <th className="py-2 px-3 w-28 text-right">Valor Unit.</th>
                <th className="py-2 px-3 w-28 text-right">Total</th>
                <th className="py-2 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 px-3">
                    <select
                      value={item.type}
                      onChange={(e) =>
                        handleUpdateItem(item.id, "type", e.target.value as any)
                      }
                      className="w-full p-1 border border-slate-200 rounded text-xs font-bold"
                    >
                      <option value="SERVICO">Mão de Obra</option>
                      <option value="PECA">Peça</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded text-xs"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateItem(item.id, "quantity", Number(e.target.value))
                      }
                      className="w-full p-1.5 border border-slate-200 rounded text-xs text-center font-bold"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleUpdateItem(item.id, "unitPrice", Number(e.target.value))
                      }
                      className="w-full p-1.5 border border-slate-200 rounded text-xs text-right font-bold"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-extrabold text-slate-900">
                    {formatCurrency(item.totalPrice)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl">
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Peças:</span>
              <strong className="text-slate-800 text-sm">{formatCurrency(totalParts)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Serviços:</span>
              <strong className="text-slate-800 text-sm">{formatCurrency(totalServices)}</strong>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Desconto:</label>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 p-2 border border-slate-200 rounded-lg text-xs font-bold text-right bg-white"
              />
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Geral:</span>
              <span className="text-2xl font-black text-blue-600">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ações inferiores */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" /> Excluir OS
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>

      {/* Modal: Recebimento e Baixa */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-200 pb-3">
              Receber e Baixar OS #{order.osNumber}
            </h3>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
              <span className="text-xs text-emerald-800 font-semibold block">Total a Receber</span>
              <span className="text-3xl font-black text-emerald-700">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-xs text-slate-700 block">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "PIX", label: "PIX", icon: QrCode },
                  { id: "DINHEIRO", label: "Dinheiro", icon: Banknote },
                  { id: "CARTAO_CREDITO", label: "Cartão Crédito", icon: CreditCard },
                  { id: "CARTAO_DEBITO", label: "Cartão Débito", icon: CreditCard },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id)}
                      className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleCheckoutAndFinish}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                {saving ? "Registrando..." : "Confirmar Pagamento & Concluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
