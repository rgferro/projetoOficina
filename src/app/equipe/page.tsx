"use client";

import { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  Phone,
  Percent,
  Wrench,
  Droplets,
  DollarSign,
  Edit2,
  X,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatPhone } from "@/lib/formatters";

export default function EquipePage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    role: "Mecânico",
    phone: "",
    commissionRate: "10",
  });

  const [saving, setSaving] = useState(false);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/equipe");
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleOpenNew = () => {
    setEditingEmployee(null);
    setFormData({
      name: "",
      role: "Mecânico",
      phone: "",
      commissionRate: "10",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: any) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      role: emp.role,
      phone: emp.phone || "",
      commissionRate: String(emp.commissionRate || 0),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = "/api/equipe";
      const method = editingEmployee ? "PUT" : "POST";
      const body = {
        id: editingEmployee?.id,
        ...formData,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsModalOpen(false);
        loadEmployees();
      } else {
        alert("Erro ao salvar funcionário");
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
            <UserCheck className="w-7 h-7 text-blue-600" />
            Equipe & Produtividade
          </h1>
          <p className="text-sm text-slate-500">
            Cadastre mecânicos e lavadores, acompanhe serviços executados e controle comissões.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo Colaborador
        </button>
      </div>

      {/* Grid de Funcionários */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Carregando equipe...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{emp.name}</h3>
                    <span className="inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                      {emp.role}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(emp)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  {emp.phone && (
                    <div className="flex items-center gap-2 font-medium">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{formatPhone(emp.phone)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 font-medium">
                    <Percent className="w-3.5 h-3.5 text-blue-600" />
                    <span>Comissão: <strong>{emp.commissionRate}%</strong></span>
                  </div>
                </div>

                {/* Quadro de Produtividade */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                    Histórico de Produtividade
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-cyan-600" /> Lavagens:
                      </span>
                      <strong className="text-slate-900 text-sm">{emp.stats?.totalWashes || 0}</strong>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-blue-600" /> OS Concluídas:
                      </span>
                      <strong className="text-slate-900 text-sm">{emp.stats?.totalOS || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comissão Estimada Acumulada */}
              <div className="mt-4 pt-3 border-t border-slate-100 bg-emerald-50/60 -mx-5 -mb-5 p-4 rounded-b-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                    Comissão Estimada
                  </span>
                  <span className="text-xs text-emerald-600">Baseado em serviços</span>
                </div>
                <div className="text-right font-black text-emerald-700 text-base">
                  {formatCurrency(emp.stats?.estimatedCommission)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastro/Edição de Funcionário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingEmployee ? "Editar Colaborador" : "Novo Colaborador"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cargo / Função *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="Mecânico Líder">Mecânico Líder</option>
                    <option value="Mecânico">Mecânico</option>
                    <option value="Lavador Especialista">Lavador Especialista</option>
                    <option value="Lavador">Lavador</option>
                    <option value="Atendente">Atendente</option>
                    <option value="Gerente">Gerente</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">% de Comissão</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="10"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">WhatsApp / Telefone</label>
                <input
                  type="text"
                  placeholder="11987654321"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
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
                  {saving ? "Salvando..." : "Salvar Colaborador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
