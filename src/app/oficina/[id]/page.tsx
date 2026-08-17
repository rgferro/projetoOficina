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
  Camera,
  Image as ImageIcon,
  Clock,
} from "lucide-react";
import {
  formatCurrency,
  formatPlate,
  formatPhone,
  formatDateTime,
} from "@/lib/formatters";
import { useAuth } from "@/lib/authContext";

interface OSItem {
  id: string;
  type: "PECA" | "SERVICO";
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productId?: string;
  employeeId?: string;
  commissionRate?: number;
}

export default function DetalhesOrdemServicoPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { currentEmployee } = useAuth();
  const canSeeFinancials =
    !currentEmployee ||
    currentEmployee.accessLevel === "ADMIN" ||
    currentEmployee.accessLevel === "GERENTE" ||
    currentEmployee.accessLevel === "ATENDENTE";

  const [order, setOrder] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [standardServices, setStandardServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [status, setStatus] = useState("");
  const [entryKm, setEntryKm] = useState("");
  const [defectClaimed, setDefectClaimed] = useState("");
  const [defectFound, setDefectFound] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [discount, setDiscount] = useState("0");
  const [employeeId, setEmployeeId] = useState("");
  const [items, setItems] = useState<OSItem[]>([]);

  // Modais de Pagamento
  const [isFullPaymentModalOpen, setIsFullPaymentModalOpen] = useState(false);
  const [isPartialPaymentModalOpen, setIsPartialPaymentModalOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [partialMethod, setPartialMethod] = useState("PIX");
  const [partialNotes, setPartialNotes] = useState("");

  // Foto states
  const [photoType, setPhotoType] = useState("AVARIA");
  const [photoCaption, setPhotoCaption] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [orderRes, empRes, prodRes, servRes] = await Promise.all([
        fetch(`/api/oficina/${params.id}`),
        fetch("/api/equipe"),
        fetch("/api/produtos"),
        fetch("/api/servicos-padrao"),
      ]);

      const [orderData, empData, prodData, servData] = await Promise.all([
        orderRes.json(),
        empRes.json(),
        prodRes.json(),
        servRes.json(),
      ]);

      setOrder(orderData);
      setEmployees(empData.filter((e: any) => e.active));
      setProducts(prodData);
      setStandardServices(servData);

      setStatus(orderData.status);
      setEntryKm(orderData.entryKm ? String(orderData.entryKm) : "");
      setDefectClaimed(orderData.defectClaimed || orderData.problemDescription || "");
      setDefectFound(orderData.defectFound || orderData.technicalReport || "");
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
          productId: i.productId || undefined,
          employeeId: i.employeeId || undefined,
          commissionRate: i.commissionRate || 0,
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
      employeeId: employeeId || undefined,
    };
    setItems([...items, newItem]);
  };

  const handleAddProductFromCatalog = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = e.target.value;
    if (!prodId) return;

    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const newItem: OSItem = {
      id: Math.random().toString(),
      type: "PECA",
      name: `${prod.name} (${prod.brand || "Geral"})`,
      quantity: 1,
      unitPrice: prod.salePrice,
      totalPrice: prod.salePrice,
      productId: prod.id,
      employeeId: employeeId || undefined,
    };

    setItems([...items, newItem]);
    e.target.value = "";
  };

  const handleAddStandardService = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const servId = e.target.value;
    if (!servId) return;

    const serv = standardServices.find((s) => s.id === servId);
    if (!serv) return;

    const newItem: OSItem = {
      id: Math.random().toString(),
      type: "SERVICO",
      name: serv.name,
      quantity: 1,
      unitPrice: serv.defaultPrice,
      totalPrice: serv.defaultPrice,
      employeeId: employeeId || undefined,
    };

    setItems([...items, newItem]);
    e.target.value = "";
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

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Salvar Alterações
  const handleSave = async (e?: React.FormEvent, extraFields: any = {}) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setIsSavedRecently(false);

    try {
      const payload = {
        status,
        entryKm: entryKm ? Number(entryKm) : null,
        defectClaimed,
        defectFound,
        problemDescription: defectClaimed,
        technicalReport: defectFound,
        internalNotes,
        discount: discountNum,
        employeeId: employeeId || null,
        items: items.map((i) => ({
          type: i.type,
          name: i.name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          productId: i.productId || null,
          employeeId: i.employeeId || null,
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
      setSuccessMessage("✓ Ordem de Serviço salva com sucesso!");
      setIsSavedRecently(true);
      setTimeout(() => {
        setSuccessMessage("");
        setIsSavedRecently(false);
      }, 4000);
    } catch (err: any) {
      alert(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  // Upload de Foto
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const res = await fetch(`/api/oficina/${params.id}/fotos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: base64,
            type: photoType,
            caption: photoCaption || `Foto (${photoType})`,
          }),
        });
        if (res.ok) {
          setPhotoCaption("");
          loadData();
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await fetch(`/api/oficina/${params.id}/fotos?photoId=${photoId}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Registrar Pagamento Parcial
  const handleAddPartialPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/oficina/${params.id}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: partialAmount,
          paymentMethod: partialMethod,
          notes: partialNotes,
        }),
      });

      if (!res.ok) throw new Error("Erro ao registrar pagamento parcial");

      setIsPartialPaymentModalOpen(false);
      setPartialAmount("");
      setPartialNotes("");
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Quitação total
  const handleFullCheckout = async () => {
    setSaving(true);
    try {
      await handleSave(undefined, {
        status: "CONCLUIDO",
        markAsPaid: true,
        paymentMethod: partialMethod,
      });
      setIsFullPaymentModalOpen(false);
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

  const remainingBalance = Math.max(0, order.grandTotal - (order.paidAmount || 0));

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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900">
                Ordem de Serviço #{order.osNumber}
              </h1>
              {canSeeFinancials && (
                <>
                  {order.paymentStatus === "PAGO" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ TOTALMENTE PAGO
                    </span>
                  ) : order.paidAmount > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
                      PAGO PARCIAL ({formatCurrency(order.paidAmount)} / Resta {formatCurrency(remainingBalance)})
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      PAGAMENTO PENDENTE
                    </span>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Aberta em {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/oficina/${order.id}/imprimir`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir Comprovante
          </Link>

          {canSeeFinancials && remainingBalance > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIsPartialPaymentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-xs transition-all"
              >
                <DollarSign className="w-4 h-4" />
                + Pagto Parcial / Sinal
              </button>

              <button
                type="button"
                onClick={() => setIsFullPaymentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Quitar Total
              </button>
            </>
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
            Status da OS
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg font-bold text-xs"
          >
            <option value="ORCAMENTO">Orçamento</option>
            <option value="EM_ANALISE">Em Análise</option>
            <option value="APROVADO">Aprovado</option>
            <option value="EM_EXECUCAO">Em Execução</option>
            <option value="AGUARDANDO_PECA">Aguardando Peça</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Mecânico Líder
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

      {/* Defeito Reclamado vs Defeito Constatado */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Defeito Reclamado (Cliente) x Defeito Constatado (Laudo Técnico)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
            <label className="block font-bold text-blue-900 mb-1">
              ⚠️ Defeito Reclamado pelo Cliente
            </label>
            <textarea
              rows={3}
              value={defectClaimed}
              onChange={(e) => setDefectClaimed(e.target.value)}
              className="w-full p-2.5 border border-blue-200 rounded-xl bg-white text-xs"
            />
          </div>
          <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
            <label className="block font-bold text-emerald-900 mb-1">
              🔍 Defeito Constatado (Laudo Técnico do Mecânico)
            </label>
            <textarea
              rows={3}
              value={defectFound}
              onChange={(e) => setDefectFound(e.target.value)}
              className="w-full p-2.5 border border-emerald-200 rounded-xl bg-white text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Observações Internas (Não saem na impressão do cliente)
          </label>
          <input
            type="text"
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Itens: Peças e Serviços */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Peças e Mão de Obra
          </h2>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              onChange={handleAddProductFromCatalog}
              defaultValue=""
              className="p-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg font-bold"
            >
              <option value="" disabled>
                📦 + Peça do Estoque...
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {canSeeFinancials ? `- ${formatCurrency(p.salePrice)}` : ""}
                </option>
              ))}
            </select>

            <select
              onChange={handleAddStandardService}
              defaultValue=""
              className="p-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg font-bold"
            >
              <option value="" disabled>
                📋 + Serviço Padrão...
              </option>
              {standardServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {canSeeFinancials ? `- ${formatCurrency(s.defaultPrice)}` : ""}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleAddItem("SERVICO")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              + Manual
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
                {canSeeFinancials && <th className="py-2 px-3 w-28 text-right">Valor Unit.</th>}
                {canSeeFinancials && <th className="py-2 px-3 w-28 text-right">Total</th>}
                <th className="py-2 px-3 w-36">Mecânico</th>
                <th className="py-2 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.type === "PECA"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {item.type === "PECA" ? "Peça" : "Serviço"}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded text-xs font-semibold"
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
                  {canSeeFinancials && (
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
                  )}
                  {canSeeFinancials && (
                    <td className="py-2 px-3 text-right font-black text-slate-900">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  )}
                  <td className="py-2 px-3">
                    <select
                      value={item.employeeId || ""}
                      onChange={(e) => handleUpdateItem(item.id, "employeeId", e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded text-[11px]"
                    >
                      <option value="">Líder</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
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

        {/* Totais e Saldos (Apenas para Administrador / Gerente / Atendente) */}
        {canSeeFinancials && (
          <div className="pt-4 border-t border-slate-200 bg-slate-50 p-4 rounded-xl text-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex gap-4">
                <div>
                  <span className="text-slate-500 block">Peças:</span>
                  <strong className="text-slate-800 text-sm font-mono">{formatCurrency(totalParts)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Serviços:</span>
                  <strong className="text-slate-800 text-sm font-mono">{formatCurrency(totalServices)}</strong>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="font-bold text-slate-700">Desconto:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-24 p-1.5 border border-slate-200 rounded-lg text-xs font-bold text-right bg-white"
                  />
                </div>

                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Total da OS:</span>
                  <span className="text-2xl font-black text-blue-600 font-mono">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Histórico de Pagamentos Parciais */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-500 text-[11px]">Total Pago:</span>
                  <span className="font-black text-emerald-600 text-sm ml-1">
                    {formatCurrency(order.paidAmount || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Saldo Devedor:</span>
                  <span className="font-black text-red-600 text-sm ml-1">
                    {formatCurrency(remainingBalance)}
                  </span>
                </div>
              </div>

              {order.payments?.length > 0 && (
                <div className="text-[11px] text-slate-500">
                  {order.payments.length} pagamento(s) registrado(s)
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Galeria de Fotos Anexadas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-4 h-4 text-purple-600" />
            Fotos do Veículo ({order.photos?.length || 0})
          </h2>

          <div className="flex items-center gap-2">
            <select
              value={photoType}
              onChange={(e) => setPhotoType(e.target.value)}
              className="p-1.5 border border-slate-200 rounded-lg text-xs font-bold"
            >
              <option value="AVARIA">Avaria</option>
              <option value="ANTES">Antes</option>
              <option value="PECA_TROCADAS">Peça Trocada</option>
              <option value="DEPOIS">Depois</option>
            </select>

            <label className="cursor-pointer px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              <span>+ Anexar Foto</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {order.photos?.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">Nenhuma foto anexada a esta OS.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {order.photos.map((p: any) => (
              <div key={p.id} className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                <img src={p.imageUrl} alt={p.caption || "Foto"} className="w-full h-28 object-cover" />
                <div className="p-2 text-[11px] bg-white flex items-center justify-between">
                  <div>
                    <span className="font-bold text-purple-700 text-[10px] block">{p.type}</span>
                    <p className="text-slate-600 truncate max-w-[120px]">{p.caption}</p>
                  </div>
                  <button
                    onClick={() => handleDeletePhoto(p.id)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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

        <div className="flex items-center gap-3">
          {successMessage && (
            <span className="text-xs font-bold text-emerald-600 hidden sm:inline-flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {successMessage}
            </span>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className={`px-6 py-3 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
              isSavedRecently
                ? "bg-emerald-600 text-white shadow-emerald-500/25"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
            }`}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                <span>Salvando...</span>
              </>
            ) : isSavedRecently ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ Alterações Salvas!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Flutuante de Notificação */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-2xl shadow-emerald-600/40 flex items-center gap-3 border border-emerald-400/30 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Modal: Pagamento Parcial / Sinal */}
      {isPartialPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-200 pb-3">
              Registrar Pagamento Parcial / Sinal (OS #{order.osNumber})
            </h3>

            <div className="bg-blue-50 p-3 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span>Total da OS:</span>
                <strong>{formatCurrency(order.grandTotal)}</strong>
              </div>
              <div className="flex justify-between text-red-700 font-bold">
                <span>Saldo Restante a Pagar:</span>
                <span>{formatCurrency(remainingBalance)}</span>
              </div>
            </div>

            <form onSubmit={handleAddPartialPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Valor do Pagamento (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 200.00"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Forma de Pagamento</label>
                <select
                  value={partialMethod}
                  onChange={(e) => setPartialMethod(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="PIX">PIX</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAO_CREDITO">Cartão Crédito</option>
                  <option value="CARTAO_DEBITO">Cartão Débito</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observação / Recibo</label>
                <input
                  type="text"
                  placeholder="Ex: Sinal de 50% pago na aprovação"
                  value={partialNotes}
                  onChange={(e) => setPartialNotes(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPartialPaymentModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {saving ? "Salvando..." : "Confirmar Pagamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quitação Total */}
      {isFullPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-200 pb-3">
              Quitar Saldo e Concluir OS #{order.osNumber}
            </h3>

            <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-200">
              <span className="text-xs text-emerald-800 font-semibold block">Valor a Quitar</span>
              <span className="text-3xl font-black text-emerald-700">
                {formatCurrency(remainingBalance)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Forma de Pagamento</label>
              <select
                value={partialMethod}
                onChange={(e) => setPartialMethod(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
              >
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO_CREDITO">Cartão Crédito</option>
                <option value="CARTAO_DEBITO">Cartão Débito</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsFullPaymentModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleFullCheckout}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
              >
                {saving ? "Registrando..." : "Quitar Saldo & Concluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
