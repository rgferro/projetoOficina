"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wrench,
  ArrowLeft,
  Plus,
  Trash2,
  Car,
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  Save,
} from "lucide-react";
import { formatCurrency, formatPlate } from "@/lib/formatters";

interface OSItem {
  id: string;
  type: "PECA" | "SERVICO";
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function NovaOrdemServicoPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState("ORCAMENTO");
  const [entryKm, setEntryKm] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [technicalReport, setTechnicalReport] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [discount, setDiscount] = useState("0");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");

  // Items table
  const [items, setItems] = useState<OSItem[]>([
    {
      id: "1",
      type: "SERVICO",
      name: "Mão de obra de diagnóstico / revisão geral",
      quantity: 1,
      unitPrice: 100,
      totalPrice: 100,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [custRes, empRes] = await Promise.all([
          fetch("/api/clientes"),
          fetch("/api/equipe"),
        ]);
        const [custData, empData] = await Promise.all([
          custRes.json(),
          empRes.json(),
        ]);
        setCustomers(custData);
        setEmployees(empData.filter((e: any) => e.active));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const availableVehicles = selectedCustomer?.vehicles || [];

  // Adicionar linha de item
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

  // Atualizar item
  const handleUpdateItem = (
    id: string,
    field: keyof OSItem,
    value: any
  ) => {
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

  // Remover item
  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      alert("A Ordem de Serviço deve conter pelo menos 1 item.");
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  // Cálculos de totais
  const totalParts = items
    .filter((i) => i.type === "PECA")
    .reduce((sum, i) => sum + (i.totalPrice || 0), 0);

  const totalServices = items
    .filter((i) => i.type === "SERVICO")
    .reduce((sum, i) => sum + (i.totalPrice || 0), 0);

  const discountNum = Number(discount) || 0;
  const grandTotal = Math.max(0, totalParts + totalServices - discountNum);

  // Submeter
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedVehicleId) {
      setErrorMessage("Selecione o Cliente e o Veículo");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId,
        employeeId: employeeId || null,
        status,
        entryKm: entryKm ? Number(entryKm) : null,
        problemDescription,
        technicalReport,
        internalNotes,
        discount: discountNum,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        items: items.map((i) => ({
          type: i.type,
          name: i.name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      };

      const res = await fetch("/api/oficina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Erro ao criar Ordem de Serviço");
      }

      router.push(`/oficina/${resData.id}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/oficina"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-6 h-6 text-blue-600" />
              Nova Ordem de Serviço (OS)
            </h1>
            <p className="text-xs text-slate-500">
              Preencha os dados do cliente, veículo, orçamento de peças e serviços.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Cliente & Veículo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            1. Dados do Cliente e Veículo
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Selecionar Cliente */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cliente *
              </label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setSelectedVehicleId("");
                }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm"
              >
                <option value="">Selecione o cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Selecionar Veículo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Veículo do Cliente *
              </label>
              <select
                required
                disabled={!selectedCustomerId}
                value={selectedVehicleId}
                onChange={(e) => {
                  setSelectedVehicleId(e.target.value);
                  const v = availableVehicles.find((veh: any) => veh.id === e.target.value);
                  if (v?.currentKm) setEntryKm(String(v.currentKm));
                }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Selecione o veículo...</option>
                {availableVehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {formatPlate(v.plate)} - {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>

            {/* KM de Entrada */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quilometragem (KM) Entrada
              </label>
              <input
                type="number"
                placeholder="Ex: 58000"
                value={entryKm}
                onChange={(e) => setEntryKm(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono"
              />
            </div>

            {/* Mecânico Responsável */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mecânico Responsável
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm"
              >
                <option value="">Selecionar mecânico...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Diagnóstico & Relato */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            2. Descrição do Problema & Diagnóstico
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reclamação do Cliente / Problema Relatado
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Barulho na suspensão dianteira ao passar por buracos, luz da injeção acesa..."
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diagnóstico Técnico / Parecer do Mecânico
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Bieletas e buchas da barra estabilizadora com folga acentuada. Necessário substituição..."
                value={technicalReport}
                onChange={(e) => setTechnicalReport(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Itens da OS (Peças & Serviços) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              3. Itens, Peças e Mão de Obra
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddItem("SERVICO")}
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 border border-blue-200"
              >
                <Plus className="w-3.5 h-3.5" /> + Adicionar Serviço
              </button>
              <button
                type="button"
                onClick={() => handleAddItem("PECA")}
                className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-xs flex items-center gap-1 border border-amber-200"
              >
                <Plus className="w-3.5 h-3.5" /> + Adicionar Peça
              </button>
            </div>
          </div>

          {/* Tabela de Itens */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-28">Tipo</th>
                  <th className="py-2.5 px-3">Descrição do Item</th>
                  <th className="py-2.5 px-3 w-24">Qtd.</th>
                  <th className="py-2.5 px-3 w-32">Valor Unit. (R$)</th>
                  <th className="py-2.5 px-3 w-32">Total (R$)</th>
                  <th className="py-2.5 px-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-3">
                      <select
                        value={item.type}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "type", e.target.value as any)
                        }
                        className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                      >
                        <option value="SERVICO">Mão de Obra</option>
                        <option value="PECA">Peça / Produto</option>
                      </select>
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        required
                        placeholder="Ex: Jogo de Pastilhas dianteiras"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "quantity", Number(e.target.value))
                        }
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs text-center font-bold"
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "unitPrice", Number(e.target.value))
                        }
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-right"
                      />
                    </td>

                    <td className="py-2.5 px-3 font-extrabold text-slate-900 text-right">
                      {formatCurrency(item.totalPrice)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumo Financeiro da OS */}
          <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl">
            <div className="flex flex-wrap gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Subtotal Peças:</span>
                <strong className="text-slate-800 text-sm">{formatCurrency(totalParts)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Subtotal Serviços:</span>
                <strong className="text-slate-800 text-sm">{formatCurrency(totalServices)}</strong>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">Desconto (R$):</label>
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

        {/* Card 4: Status e Previsão */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            4. Status Inicial & Previsão de Entrega
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Inicial da OS
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold"
              >
                <option value="ORCAMENTO">Orçamento (Aguardando Aprovação)</option>
                <option value="APROVADO">Aprovado pelo Cliente</option>
                <option value="EM_EXECUCAO">Em Execução no Box</option>
                <option value="AGUARDANDO_PECA">Aguardando Peça Externa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Previsão de Conclusão / Entrega
              </label>
              <input
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/oficina"
            className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-sm"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar Ordem de Serviço"}
          </button>
        </div>
      </form>
    </div>
  );
}
