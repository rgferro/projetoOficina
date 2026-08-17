"use client";

import { useState, useEffect } from "react";
import {
  ListOrdered,
  Plus,
  Search,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  X,
  Wrench,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useAuth } from "@/lib/authContext";

export default function ServicosPage() {
  const { currentEmployee } = useAuth();
  const canManage =
    !currentEmployee ||
    currentEmployee.accessLevel === "ADMIN" ||
    currentEmployee.accessLevel === "GERENTE";

  const canSeePrice =
    !currentEmployee ||
    currentEmployee.accessLevel === "ADMIN" ||
    currentEmployee.accessLevel === "GERENTE" ||
    currentEmployee.accessLevel === "ATENDENTE";

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    category: "Mecânica Geral",
    defaultPrice: "",
    estimatedMinutes: "60",
    description: "",
  });

  const [saving, setSaving] = useState(false);

  const categories = [
    "Mecânica Geral",
    "Geometria & Suspensão",
    "Freios",
    "Revisão Preventiva",
    "Injeção & Diagnóstico",
    "Arrefecimento & Conforto",
    "Elétrica & Baterias",
    "Estética & Lava-Jato",
  ];

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/servicos-padrao?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      loadServices();
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);

  const handleOpenNew = () => {
    setEditingService(null);
    setFormData({
      name: "",
      category: "Mecânica Geral",
      defaultPrice: "",
      estimatedMinutes: "60",
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setEditingService(s);
    setFormData({
      name: s.name,
      category: s.category,
      defaultPrice: String(s.defaultPrice || 0),
      estimatedMinutes: String(s.estimatedMinutes || 60),
      description: s.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = "/api/servicos-padrao";
      const method = editingService ? "PUT" : "POST";
      const body = {
        id: editingService?.id,
        ...formData,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erro ao salvar serviço");

      setIsModalOpen(false);
      loadServices();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir o serviço "${name}" da tabela padronizada?`)) return;
    try {
      await fetch(`/api/servicos-padrao?id=${id}`, { method: "DELETE" });
      loadServices();
    } catch (err) {
      alert("Erro ao excluir");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ListOrdered className="w-7 h-7 text-blue-600" />
            Tabela de Serviços Padronizados
          </h1>
          <p className="text-sm text-slate-500">
            Cadastre os serviços e mão de obra com valores padrão e tempos médios para importar nas Ordens de Serviço.
          </p>
        </div>

        {canManage && (
          <button
            id="servicos-new-btn"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Serviço
          </button>
        )}
      </div>

      {/* Barra de Busca */}
      <div id="servicos-filters" className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nome do serviço ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
        />
      </div>

      {/* Grade de Serviços */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Carregando serviços...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">Nenhum serviço padronizado cadastrado</h3>
        </div>
      ) : (
        <div id="servicos-table" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                    {s.category}
                  </span>
                  {canManage && (
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
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-2">{s.name}</h3>
                {s.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Tempo estimado: {s.estimatedMinutes} min
                </span>
                {canSeePrice ? (
                  <span className="font-black text-slate-900 text-base font-mono">
                    {formatCurrency(s.defaultPrice)}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Mão de Obra
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingService ? "Editar Serviço" : "Novo Serviço Padronizado"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alinhamento 3D e Balanceamento"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Preço Base (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="120.00"
                    value={formData.defaultPrice}
                    onChange={(e) => setFormData({ ...formData, defaultPrice: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tempo Estimado (Minutos)</label>
                <input
                  type="number"
                  placeholder="45"
                  value={formData.estimatedMinutes}
                  onChange={(e) => setFormData({ ...formData, estimatedMinutes: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição Detalhada</label>
                <textarea
                  rows={2}
                  placeholder="O que está incluso neste serviço..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
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
                  {saving ? "Salvando..." : "Salvar Serviço"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
