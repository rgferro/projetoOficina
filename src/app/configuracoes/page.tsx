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
} from "lucide-react";

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
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Backup local status
  const [backupStatus, setBackupStatus] = useState("");
  const [localFolder, setLocalFolder] = useState("");

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/configuracoes");
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
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

  const handleTriggerLocalCopy = async () => {
    setBackupStatus("Gerando cópia de segurança...");
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetFolder: localFolder || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBackupStatus(`✓ Sucesso: Salvo em ${data.savedPath}`);
      } else {
        setBackupStatus(`Erro: ${data.error}`);
      }
    } catch (err: any) {
      setBackupStatus(`Erro ao gerar cópia: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-blue-600" />
          Configurações & Backup Local
        </h1>
        <p className="text-sm text-slate-500">
          Personalize os dados da sua oficina, mensagens de WhatsApp e faça backup com 1 clique do banco SQLite.
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Seção 1: Backup do Banco de Dados */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-850 to-blue-950 rounded-2xl p-6 text-white shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Central de Backup Local (SQLite)</h2>
              <p className="text-xs text-slate-400">
                Seus dados ficam armazenados localmente no arquivo <code className="text-blue-300">prisma/dev.db</code>.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Seguro & Portátil
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Opção 1: Download .db */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-200">1. Baixar Arquivo .db</h3>
              <p className="text-xs text-slate-400 mt-1">
                Download direto do arquivo de banco de dados SQLite para guardar no pendrive ou nuvem.
              </p>
            </div>
            <a
              href="/api/backup?format=db"
              download
              className="mt-4 w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              Baixar Banco (.db)
            </a>
          </div>

          {/* Opção 2: Exportar JSON */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-200">2. Exportar JSON Completo</h3>
              <p className="text-xs text-slate-400 mt-1">
                Dump estruturado de todas as tabelas (clientes, OSs, lavagens e financeiro).
              </p>
            </div>
            <a
              href="/api/backup?format=json"
              download
              className="mt-4 w-full py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              Exportar JSON
            </a>
          </div>

          {/* Opção 3: Sincronização em Pasta Local */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-200">3. Cópia p/ Pasta Local</h3>
              <p className="text-xs text-slate-400 mt-1">
                Gera uma cópia do banco na pasta <code className="text-blue-300">/backups</code> ou diretório do Google Drive.
              </p>
            </div>
            <button
              onClick={handleTriggerLocalCopy}
              className="mt-4 w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <HardDrive className="w-4 h-4" />
              Criar Cópia Agora
            </button>
          </div>
        </div>

        {backupStatus && (
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400">
            {backupStatus}
          </div>
        )}
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">WhatsApp / Telefone Principal</label>
                <input
                  type="text"
                  value={settings.phone || ""}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={settings.address || ""}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dias de Garantia Padrão</label>
                <input
                  type="number"
                  value={settings.warrantyDays}
                  onChange={(e) => setSettings({ ...settings, warrantyDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Modelos de Mensagem WhatsApp */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Modelos de Mensagem WhatsApp
            </h2>
            <p className="text-xs text-slate-500">
              Variáveis automáticas disponíveis: <code className="text-blue-600">{"{nome}"}</code>, <code className="text-blue-600">{"{veiculo}"}</code>, <code className="text-blue-600">{"{placa}"}</code>, <code className="text-blue-600">{"{valor}"}</code>, <code className="text-blue-600">{"{oficina}"}</code>, <code className="text-blue-600">{"{dias}"}</code>.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  1. Mensagem de Lava-Jato Pronto para Retirada
                </label>
                <textarea
                  rows={2}
                  value={settings.whatsappWashReadyTemplate}
                  onChange={(e) => setSettings({ ...settings, whatsappWashReadyTemplate: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  2. Lembrete de Revisão / Troca de Óleo (6 meses)
                </label>
                <textarea
                  rows={2}
                  value={settings.whatsappOilReminderTemplate}
                  onChange={(e) => setSettings({ ...settings, whatsappOilReminderTemplate: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  3. Lembrete de Retorno ao Lava-Jato (+15 dias)
                </label>
                <textarea
                  rows={2}
                  value={settings.whatsappWashReminderTemplate}
                  onChange={(e) => setSettings({ ...settings, whatsappWashReminderTemplate: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2"
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
