"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Edit2,
  Trash2,
  X,
  Package,
} from "lucide-react";
import { formatPhone, formatDocument } from "@/lib/formatters";

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    document: "",
    contactName: "",
    phone: "",
    email: "",
    city: "",
    state: "SP",
    pixKey: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/fornecedores?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      loadSuppliers();
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);

  const handleOpenNew = () => {
    setEditingSupplier(null);
    setFormData({
      name: "",
      document: "",
      contactName: "",
      phone: "",
      email: "",
      city: "",
      state: "SP",
      pixKey: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      document: s.document || "",
      contactName: s.contactName || "",
      phone: s.phone || "",
      email: s.email || "",
      city: s.city || "",
      state: s.state || "SP",
      pixKey: s.pixKey || "",
      notes: s.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = "/api/fornecedores";
      const method = editingSupplier ? "PUT" : "POST";
      const body = {
        id: editingSupplier?.id,
        ...formData,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erro ao salvar fornecedor");

      setIsModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir o fornecedor "${name}"?`)) return;
    try {
      await fetch(`/api/fornecedores?id=${id}`, { method: "DELETE" });
      loadSuppliers();
    } catch (err) {
      alert("Erro ao excluir fornecedor");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-blue-600" />
            Gestão de Fornecedores & Distribuidores
          </h1>
          <p className="text-sm text-slate-500">
            Cadastre distribuidores de autopeças, lubrificantes e vincule com contas a pagar e produtos em estoque.
          </p>
        </div>

        <button
          id="fornecedores-new-btn"
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo Fornecedor
        </button>
      </div>

      {/* Barra de Busca */}
      <div id="fornecedores-search-bar" className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por razão social, nome fantasia, CNPJ ou vendedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
        />
      </div>

      {/* Grade de Fornecedores */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Carregando fornecedores...</div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">Nenhum fornecedor cadastrado</h3>
        </div>
      ) : (
        <div id="fornecedores-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-base text-slate-900">{s.name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {s.document && (
                    <div className="flex items-center gap-2 font-mono">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDocument(s.document)}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-2 font-medium">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{formatPhone(s.phone)} {s.contactName ? `(${s.contactName})` : ""}</span>
                    </div>
                  )}
                  {s.city && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{s.city} / {s.state || "SP"}</span>
                    </div>
                  )}
                  {s.pixKey && (
                    <div className="flex items-center gap-2 text-teal-700 bg-teal-50 p-1.5 rounded-md font-mono text-[11px]">
                      <span>PIX: {s.pixKey}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{s._count?.products || 0} produtos vinculados</span>
                <span>{s._count?.accountsPayable || 0} contas a pagar</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastro/Edição de Fornecedor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Razão Social / Nome Fantasia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Distribuidora de Peças Brasil Ltda"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CNPJ ou CPF</label>
                  <input
                    type="text"
                    placeholder="12.345.678/0001-90"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nome do Vendedor / Contato</label>
                  <input
                    type="text"
                    placeholder="Ex: Rodrigo"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    placeholder="11987654321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail para Pedidos</label>
                  <input
                    type="email"
                    placeholder="pedidos@fornecedor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Cidade</label>
                  <input
                    type="text"
                    placeholder="São Paulo"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="SP"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chave PIX para Pagamentos</label>
                <input
                  type="text"
                  placeholder="CNPJ, Celular, E-mail ou Chave Aleatória"
                  value={formData.pixKey}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl font-mono"
                />
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {saving ? "Salvando..." : "Salvar Fornecedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
