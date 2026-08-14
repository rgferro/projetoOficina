"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Download,
  Database,
  Save,
  CheckCircle2,
  HardDrive,
  MessageSquare,
  ShieldCheck,
  Building,
  Cloud,
  FolderSync,
  RefreshCw,
  Lock,
} from "lucide-react";
import { formatDateTime } from "@/lib/formatters";

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState({
    workshopName: "",
    cnpj: "",
    phone: "",
    address: "",
    email: "",
    warrantyDays: 90,
    whatsappWashReadyTemplate: "",
    whatsappOilReminderTemplate: "",
    whatsappWashReminderTemplate: "",
    whatsappBirthdayTemplate: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Cloud Backup states
  const [cloudStatus, setCloudStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, backupStatusRes] = await Promise.all([
        fetch("/api/configuracoes"),
        fetch("/api/backup?format=status"),
      ]);

      const [settingsData, backupStatusData] = await Promise.all([
        settingsRes.json(),
        backupStatusRes.json(),
      ]);

      setSettings(settingsData);
      setCloudStatus(backupStatusData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");

    try {
      const res = await fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSuccessMessage("Configurações salvas com sucesso!");
        setTimeout(() => setSuccessMessage(""), 3500);
      } else {
        alert("Erro ao salvar configurações");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerCloudBackup = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setCloudStatus(data.status);
        setSuccessMessage("Backup na nuvem sincronizado com sucesso!");
        setTimeout(() => setSuccessMessage(""), 3500);
      } else {
        alert(data.error || "Erro ao sincronizar");
      }
    } catch (err: any) {
      alert("Erro ao sincronizar: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-blue-600" />
          Configurações & Backup em Nuvem Automático
        </h1>
        <p className="text-sm text-slate-500">
          Seus dados são salvos e sincronizados automaticamente na nuvem (Google Drive / OneDrive) sem nenhuma complicação.
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Seção 1: Backup em Nuvem 100% Automático (Zero-Intervenção) */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-850 to-blue-950 rounded-2xl p-6 text-white shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Cloud className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  Backup em Nuvem: 100% Automático
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>
                  ATIVO
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Nuvem Detectada: <strong className="text-emerald-300">{cloudStatus?.provider || "Google Drive / Nuvem"}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={syncing}
            onClick={handleTriggerCloudBackup}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar Agora"}
          </button>
        </div>

        {/* Informações Simples para o Usuário Leigo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">
              Como funciona para você?
            </span>
            <p className="text-slate-200 leading-relaxed">
              ✨ <strong>Você não precisa configurar nada!</strong> Toda vez que uma Ordem de Serviço, venda no PDV ou cliente é salvo, o sistema grava automaticamente uma cópia protegida na sua pasta de nuvem sincronizada.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">
              Status da Proteção de Dados
            </span>
            <p className="text-slate-200">
              📂 <strong>Pasta na Nuvem:</strong> <span className="font-mono text-[11px] text-blue-300 block truncate">{cloudStatus?.folderPath || "Detectando..."}</span>
            </p>
            <p className="text-[11px] text-slate-400 pt-1">
              Último backup: <strong className="text-emerald-400">{cloudStatus?.lastBackupDate ? formatDateTime(cloudStatus.lastBackupDate) : "Hoje (Automático)"}</strong> • {cloudStatus?.totalBackups || 1} cópia(s) guardada(s).
            </p>
          </div>
        </div>

        {/* Opções Manuais Extras (Se o cliente quiser baixar um arquivo) */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">
            Deseja baixar uma cópia manual para guardar em pendrive?
          </span>
          <div className="flex gap-2">
            <a
              href="/api/backup?format=db"
              download
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Baixar Banco (.db)
            </a>
            <a
              href="/api/backup?format=json"
              download
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              Exportar JSON
            </a>
          </div>
        </div>
      </div>

      {/* Seção 2: Dados da Oficina */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Carregando configurações...</div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              Dados da Empresa (Aparecem nas OSs impressas)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome da Oficina / Lava-Jato *</label>
                <input
                  type="text"
                  required
                  value={settings.workshopName}
                  onChange={(e) => setSettings({ ...settings, workshopName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">CNPJ</label>
                <input
                  type="text"
                  value={settings.cnpj || ""}
                  onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">WhatsApp / Telefone de Contato</label>
                <input
                  type="text"
                  value={settings.phone || ""}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={settings.address || ""}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Garantia Padrão dos Serviços (Dias)</label>
                <input
                  type="number"
                  value={settings.warrantyDays}
                  onChange={(e) => setSettings({ ...settings, warrantyDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Modelos de Mensagens do WhatsApp */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Modelos de Mensagem do WhatsApp (Variáveis: &#123;nome&#125;, &#123;veiculo&#125;, &#123;placa&#125;, &#123;oficina&#125;, &#123;valor&#125;)
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  1. Lava-Jato: Aviso de Carro Limpo e Pronto para Retirada
                </label>
                <textarea
                  rows={2}
                  value={settings.whatsappWashReadyTemplate}
                  onChange={(e) => setSettings({ ...settings, whatsappWashReadyTemplate: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-sans"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  2. Oficina: Lembrete de Revisão Preventiva e Troca de Óleo (6 meses)
                </label>
                <textarea
                  rows={2}
                  value={settings.whatsappOilReminderTemplate}
                  onChange={(e) => setSettings({ ...settings, whatsappOilReminderTemplate: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-sans"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  3. Lava-Jato: Lembrete de Retorno / Fidelização (&gt;15 dias)
                </label>
                <textarea
                  rows={2}
                  value={settings.whatsappWashReminderTemplate}
                  onChange={(e) => setSettings({ ...settings, whatsappWashReminderTemplate: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-sans"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  4. CRM: Mensagem de Aniversário do Cliente (Com Cupom de Desconto)
                </label>
                <textarea
                  rows={2}
                  value={settings.whatsappBirthdayTemplate || ""}
                  onChange={(e) => setSettings({ ...settings, whatsappBirthdayTemplate: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-sans"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Salvando..." : "Salvar Todas as Configurações"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
