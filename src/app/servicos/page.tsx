"use client";

import { useState, useEffect, useMemo } from "react";
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
  Droplets,
  Zap,
  ShieldCheck,
  Disc,
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useAuth } from "@/lib/authContext";

type ServiceSegment =
  | "TODOS"
  | "MECANICA"
  | "GEOMETRIA_FREIOS"
  | "REVISAO"
  | "ELETRICA_INJECAO"
  | "LAVAJATO";

const SEGMENTS: {
  id: ServiceSegment;
  label: string;
  icon: any;
  badgeColor: string;
  categories: string[];
}[] = [
  {
    id: "TODOS",
    label: "Todos os Serviços",
    icon: ListOrdered,
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    categories: [],
  },
  {
    id: "MECANICA",
    label: "Mecânica Geral & Motor",
    icon: Wrench,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    categories: ["Mecânica Geral", "Motor & Câmbio", "Motor", "Câmbio & Transmissão"],
  },
  {
    id: "GEOMETRIA_FREIOS",
    label: "Geometria, Freios & Suspensão",
    icon: Disc,
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
    categories: [
      "Geometria & Suspensão",
      "Geometria",
      "Freios",
      "Freios & Suspensão",
      "Suspensão",
      "Alinhamento & Balanceamento",
    ],
  },
  {
    id: "REVISAO",
    label: "Revisão Preventiva & Óleo",
    icon: ShieldCheck,
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    categories: ["Revisão Preventiva", "Troca de Óleo", "Revisão Geral"],
  },
  {
    id: "ELETRICA_INJECAO",
    label: "Elétrica, Injeção & Clima",
    icon: Zap,
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    categories: [
      "Injeção & Diagnóstico",
      "Diagnóstico",
      "Elétrica & Baterias",
      "Elétrica",
      "Arrefecimento & Conforto",
      "Ar Condicionado",
    ],
  },
  {
    id: "LAVAJATO",
    label: "Estética & Lava-Jato",
    icon: Droplets,
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300",
    categories: [
      "Estética & Lava-Jato",
      "Lava-Jato",
      "Estética Automotiva",
      "Lavagem",
      "Polimento & Higienização",
      "Detalhamento",
    ],
  },
];

function getCategoryStyle(category: string) {
  const cat = category.toLowerCase();
  if (cat.includes("lava") || cat.includes("estética") || cat.includes("polimento") || cat.includes("higieniz")) {
    return {
      bg: "bg-cyan-50 text-cyan-800 border-cyan-200",
      icon: "🧼",
      segment: "LAVAJATO",
    };
  }
  if (cat.includes("elétr") || cat.includes("bateria") || cat.includes("injeção") || cat.includes("scanner") || cat.includes("arrefec")) {
    return {
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      icon: "⚡",
      segment: "ELETRICA_INJECAO",
    };
  }
  if (cat.includes("revis") || cat.includes("óleo") || cat.includes("preventiva")) {
    return {
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: "🛡️",
      segment: "REVISAO",
    };
  }
  if (cat.includes("freio") || cat.includes("geometr") || cat.includes("suspens") || cat.includes("alinhamento")) {
    return {
      bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
      icon: "🛞",
      segment: "GEOMETRIA_FREIOS",
    };
  }
  return {
    bg: "bg-blue-50 text-blue-800 border-blue-200",
    icon: "🔧",
    segment: "MECANICA",
  };
}

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
  const [selectedSegment, setSelectedSegment] = useState<ServiceSegment>("TODOS");
  const [isSeeding, setIsSeeding] = useState(false);
  const [successNotice, setSuccessNotice] = useState("");

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

  // Segmentação automática com base no perfil logado
  useEffect(() => {
    if (currentEmployee?.accessLevel) {
      if (currentEmployee.accessLevel === "MECANICO") {
        setSelectedSegment("MECANICA");
      } else if (currentEmployee.accessLevel === "LAVADOR") {
        setSelectedSegment("LAVAJATO");
      } else {
        setSelectedSegment("TODOS");
      }
    }
  }, [currentEmployee?.accessLevel]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/servicos-padrao?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setServices(data);
      }
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

  const handleSeedDefaults = async () => {
    try {
      setIsSeeding(true);
      const res = await fetch("/api/servicos-padrao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed-defaults" }),
      });
      if (res.ok) {
        setSuccessNotice("Catálogo de serviços padronizados de Mecânica e Lava-Jato restaurado com sucesso!");
        setTimeout(() => setSuccessNotice(""), 4000);
        await loadServices();
      }
    } catch (e) {
      alert("Erro ao popular catálogo padrão");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOpenNew = () => {
    let defaultCat = "Mecânica Geral";
    if (selectedSegment === "LAVAJATO" || currentEmployee?.accessLevel === "LAVADOR") {
      defaultCat = "Estética & Lava-Jato";
    } else if (selectedSegment === "GEOMETRIA_FREIOS") {
      defaultCat = "Geometria & Suspensão";
    } else if (selectedSegment === "ELETRICA_INJECAO") {
      defaultCat = "Injeção & Diagnóstico";
    } else if (selectedSegment === "REVISAO") {
      defaultCat = "Revisão Preventiva";
    }

    setEditingService(null);
    setFormData({
      name: "",
      category: defaultCat,
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

  // Filtragem segmentada
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (selectedSegment === "TODOS") return true;
      const targetSeg = SEGMENTS.find((seg) => seg.id === selectedSegment);
      if (!targetSeg) return true;

      const style = getCategoryStyle(s.category);
      if (style.segment === selectedSegment) return true;

      return targetSeg.categories.some(
        (cat) => cat.toLowerCase() === s.category.toLowerCase()
      );
    });
  }, [services, selectedSegment]);

  // Contagem por segmento para os badges
  const segmentCounts = useMemo(() => {
    const counts: Record<ServiceSegment, number> = {
      TODOS: services.length,
      MECANICA: 0,
      GEOMETRIA_FREIOS: 0,
      REVISAO: 0,
      ELETRICA_INJECAO: 0,
      LAVAJATO: 0,
    };

    services.forEach((s) => {
      const style = getCategoryStyle(s.category);
      if (counts[style.segment as ServiceSegment] !== undefined) {
        counts[style.segment as ServiceSegment]++;
      }
    });

    return counts;
  }, [services]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ListOrdered className="w-7 h-7 text-blue-600" />
            Tabela de Serviços Padronizados
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Cadastre os serviços e mão de obra com valores padrão e tempos médios para importar nas Ordens de Serviço.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canManage && (
            <button
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all"
              title="Gera o catálogo de serviços essenciais de mecânica e estética"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin text-blue-600" : "text-slate-500"}`} />
              <span>{isSeeding ? "Populando..." : "Restaurar Catálogo Padrão"}</span>
            </button>
          )}

          {canManage && (
            <button
              id="servicos-new-btn"
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Novo Serviço
            </button>
          )}
        </div>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Segmentador por Perfil / Categoria */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Segmentação por Área de Atuação:
          </span>
          {currentEmployee?.accessLevel && (
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <span>Seu Perfil:</span>
              <strong className="text-blue-600 underline">
                {currentEmployee.accessLevel === "MECANICO"
                  ? "Mecânico / Técnico"
                  : currentEmployee.accessLevel === "LAVADOR"
                  ? "Operador Lava-Jato"
                  : currentEmployee.role || "Administrador"}
              </strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {SEGMENTS.map((seg) => {
            const Icon = seg.icon;
            const isSelected = selectedSegment === seg.id;
            const count = segmentCounts[seg.id] ?? 0;

            return (
              <button
                key={seg.id}
                onClick={() => setSelectedSegment(seg.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-500"}`} />
                <span>{seg.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de Busca */}
      <div id="servicos-filters" className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar serviço por nome, palavra-chave ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-blue-500 shadow-sm"
        />
      </div>

      {/* Grade de Serviços Segmentada */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs font-medium">
          Carregando serviços padronizados...
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">
            Nenhum serviço encontrado neste segmento
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search
              ? "Tente buscar com outros termos ou alterne a aba do segmento acima."
              : "Clique no botão 'Restaurar Catálogo Padrão' ou crie um novo serviço para este segmento."}
          </p>
          {canManage && (
            <button
              onClick={handleSeedDefaults}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Restaurar Tabela de Mecânica & Estética
            </button>
          )}
        </div>
      ) : (
        <div id="servicos-table" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((s) => {
            const catStyle = getCategoryStyle(s.category);

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${catStyle.bg}`}
                    >
                      <span>{catStyle.icon}</span>
                      <span>{s.category}</span>
                    </span>

                    {canManage && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 mt-2.5 leading-snug">
                    {s.name}
                  </h3>

                  {s.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Tempo estimado: <strong>{s.estimatedMinutes} min</strong>
                  </span>
                  {canSeePrice ? (
                    <span className="font-black text-slate-900 text-base font-mono">
                      {formatCurrency(s.defaultPrice)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                      Mão de Obra
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-blue-600" />
                {editingService ? "Editar Serviço" : "Novo Serviço Padronizado"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nome do Serviço / Mão de Obra *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Troca de Pastilhas de Freio Dianteiro"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria / Segmento *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <optgroup label="🔧 Oficina Mecânica">
                      <option value="Mecânica Geral">Mecânica Geral</option>
                      <option value="Geometria & Suspensão">Geometria & Suspensão</option>
                      <option value="Freios">Freios</option>
                      <option value="Revisão Preventiva">Revisão Preventiva</option>
                    </optgroup>
                    <optgroup label="⚡ Elétrica & Clima">
                      <option value="Injeção & Diagnóstico">Injeção & Diagnóstico</option>
                      <option value="Elétrica & Baterias">Elétrica & Baterias</option>
                      <option value="Arrefecimento & Conforto">Arrefecimento & Conforto</option>
                    </optgroup>
                    <optgroup label="🧼 Estética & Lava-Jato">
                      <option value="Estética & Lava-Jato">Estética & Lava-Jato</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Preço Base Mão de Obra (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="120.00"
                    value={formData.defaultPrice}
                    onChange={(e) => setFormData({ ...formData, defaultPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tempo Estimado Médio (Minutos)</label>
                <input
                  type="number"
                  placeholder="45"
                  value={formData.estimatedMinutes}
                  onChange={(e) => setFormData({ ...formData, estimatedMinutes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição Detalhada do Procedimento</label>
                <textarea
                  rows={2}
                  placeholder="O que está incluso neste serviço (ex: limpeza de pinças, sangria, etc)..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : editingService ? "Salvar Alterações" : "Cadastrar Serviço"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
