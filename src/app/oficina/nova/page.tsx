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
  Package,
  ListOrdered,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { formatCurrency, formatPlate } from "@/lib/formatters";

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

interface OSPhoto {
  imageUrl: string;
  type: string;
  caption: string;
}

export default function NovaOrdemServicoPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [standardServices, setStandardServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState("ORCAMENTO");
  const [entryKm, setEntryKm] = useState("");
  
  // Defeito Reclamado vs Defeito Constatado
  const [defectClaimed, setDefectClaimed] = useState("");
  const [defectFound, setDefectFound] = useState("");
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

  // Photos
  const [photos, setPhotos] = useState<OSPhoto[]>([]);
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoType, setPhotoType] = useState("AVARIA");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [custRes, empRes, prodRes, servRes] = await Promise.all([
          fetch("/api/clientes"),
          fetch("/api/equipe"),
          fetch("/api/produtos"),
          fetch("/api/servicos-padrao"),
        ]);
        const [custData, empData, prodData, servData] = await Promise.all([
          custRes.json(),
          empRes.json(),
          prodRes.json(),
          servRes.json(),
        ]);
        setCustomers(custData);
        setEmployees(empData.filter((e: any) => e.active));
        setProducts(prodData);
        setStandardServices(servData);
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

  // Adicionar linha manual
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

  // Adicionar produto direto do Estoque
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

  // Adicionar serviço da Tabela Padronizada
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

  // Upload de Foto local (convertida para Base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPhotos([
        ...photos,
        {
          imageUrl: base64,
          type: photoType,
          caption: photoCaption || `Foto do veículo (${photoType})`,
        },
      ]);
      setPhotoCaption("");
    };
    reader.readAsDataURL(file);
  };

  // Atualizar item
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
        defectClaimed,
        defectFound,
        problemDescription: defectClaimed,
        technicalReport: defectFound,
        internalNotes,
        discount: discountNum,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        items: items.map((i) => ({
          type: i.type,
          name: i.name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          productId: i.productId || null,
          employeeId: i.employeeId || null,
        })),
        photos,
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
              Nova Ordem de Serviço (OS 2.0)
            </h1>
            <p className="text-xs text-slate-500">
              Defeito reclamado x constatado, baixa de estoque automática, fotos do veículo e tabela de serviços.
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
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
              >
                <option value="">Selecione o cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

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
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Selecione o veículo...</option>
                {availableVehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {formatPlate(v.plate)} - {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                KM de Entrada
              </label>
              <input
                type="number"
                placeholder="Ex: 58000"
                value={entryKm}
                onChange={(e) => setEntryKm(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mecânico Líder Responsável
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
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

        {/* Card 2: Defeito Reclamado x Defeito Constatado */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            2. Defeito Reclamado (Cliente) x Defeito Constatado (Laudo Técnico)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-1">
              <label className="block text-xs font-bold text-blue-900 mb-1">
                ⚠️ Defeito Reclamado (Relato do Cliente)
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Barulho na suspensão ao frear, pedal de freio vibrando em alta velocidade..."
                value={defectClaimed}
                onChange={(e) => setDefectClaimed(e.target.value)}
                className="w-full p-2.5 border border-blue-200 rounded-xl text-xs sm:text-sm bg-white"
              />
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-1">
              <label className="block text-xs font-bold text-emerald-900 mb-1">
                🔍 Defeito Constatado (Diagnóstico & Laudo Técnico do Mecânico)
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Discos de freio dianteiros empenados e abaixo da espessura mínima de segurança. Pastilhas no limite."
                value={defectFound}
                onChange={(e) => setDefectFound(e.target.value)}
                className="w-full p-2.5 border border-emerald-200 rounded-xl text-xs sm:text-sm bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Observações Internas da Oficina (Apenas para equipe interna)
            </label>
            <input
              type="text"
              placeholder="Ex: Cliente tem pressa, carro para entregar até as 17h"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Card 3: Peças & Serviços com Atalhos de Estoque */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                3. Peças & Mão de Obra (Com Baixa Automática no Estoque)
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Puxar do Estoque */}
              <select
                onChange={handleAddProductFromCatalog}
                defaultValue=""
                className="p-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg font-bold"
              >
                <option value="" disabled>
                  📦 + Inserir Peça do Estoque...
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatCurrency(p.salePrice)} (Disp: {p.currentStock})
                  </option>
                ))}
              </select>

              {/* Puxar da Tabela de Serviços */}
              <select
                onChange={handleAddStandardService}
                defaultValue=""
                className="p-2 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg font-bold"
              >
                <option value="" disabled>
                  📋 + Inserir Serviço Padrão...
                </option>
                {standardServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {formatCurrency(s.defaultPrice)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleAddItem("SERVICO")}
                className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                + Linha Manual
              </button>
            </div>
          </div>

          {/* Tabela de Itens */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-28">Tipo</th>
                  <th className="py-2.5 px-3">Descrição do Item / Peça</th>
                  <th className="py-2.5 px-3 w-20 text-center">Qtd.</th>
                  <th className="py-2.5 px-3 w-28 text-right">Unit. (R$)</th>
                  <th className="py-2.5 px-3 w-28 text-right">Total (R$)</th>
                  <th className="py-2.5 px-3 w-36">Executor / Mecânico</th>
                  <th className="py-2.5 px-3 w-10"></th>
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
                        required
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </td>

                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "quantity", Number(e.target.value))
                        }
                        className="w-full p-1.5 border border-slate-200 rounded-lg text-xs text-center font-bold"
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
                        className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-bold text-right"
                      />
                    </td>

                    <td className="py-2 px-3 font-black text-slate-900 text-right">
                      {formatCurrency(item.totalPrice)}
                    </td>

                    <td className="py-2 px-3">
                      <select
                        value={item.employeeId || ""}
                        onChange={(e) => handleUpdateItem(item.id, "employeeId", e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded-lg text-[11px]"
                      >
                        <option value="">Mecânico Líder</option>
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

          {/* Totais */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl text-xs">
            <div className="flex gap-4">
              <div>
                <span className="text-slate-500 block">Subtotal Peças:</span>
                <strong className="text-slate-800 text-sm font-mono">{formatCurrency(totalParts)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Subtotal Serviços:</span>
                <strong className="text-slate-800 text-sm font-mono">{formatCurrency(totalServices)}</strong>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="font-bold text-slate-700">Desconto (R$):</label>
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
        </div>

        {/* Card 4: Fotos do Veículo (Antes / Depois / Avarias) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-4 h-4 text-purple-600" />
            4. Fotos do Veículo & Avarias (Antes / Depois)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo da Foto</label>
              <select
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="AVARIA">Avaria Prévia no Veículo</option>
                <option value="ANTES">Veículo Antes do Serviço</option>
                <option value="PECA_TROCADAS">Peças Velhas Removidas</option>
                <option value="DEPOIS">Veículo Pronto (Depois)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Legenda da Imagem</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Risco na porta direita, pastilha gasta"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs"
                />
                <label className="cursor-pointer px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Carregar Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Galeria de Fotos Anexadas */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {photos.map((p, idx) => (
                <div key={idx} className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 group">
                  <img src={p.imageUrl} alt={p.caption} className="w-full h-28 object-cover" />
                  <div className="p-2 text-[11px] bg-white">
                    <span className="font-bold text-purple-700 text-[10px] block">{p.type}</span>
                    <p className="text-slate-600 truncate">{p.caption}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-90 hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 5: Status e Previsão */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            5. Status & Previsão de Entrega
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
                <option value="EM_ANALISE">Em Análise / Desmontagem</option>
                <option value="APROVADO">Aprovado pelo Cliente</option>
                <option value="EM_EXECUCAO">Em Execução no Box</option>
                <option value="AGUARDANDO_PECA">Aguardando Peça Externa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Previsão de Conclusão
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
