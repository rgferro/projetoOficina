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
    whatsappBirthdayTemplate: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Backup states
  const [backupStatus, setBackupStatus] = useState("");
  const [cloudFolder, setCloudFolder] = useState("");
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/configuracoes");
      const data = await res.json();
      setSettings(data);

      // Carrega caminho salvo do localStorage se existir
      const savedFolder = localStorage.getItem("autogestao_cloud_backup_folder");
      if (savedFolder) setCloudFolder(savedFolder);
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
        if (cloudFolder) {
          localStorage.setItem("autogestao_cloud_backup_folder", cloudFolder);
        }
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

  const handleTriggerBackup = async (folder?: string) => {
    setBackupStatus("Gerando cópia de segurança...");
    try {
      const target = folder || cloudFolder || undefined;
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetFolder: target,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBackupStatus(`✓ Sucesso: Arquivo salvo em "${data.savedPath}"`);
        if (target) localStorage.setItem("autogestao_cloud_backup_folder", target);
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
          Configurações & Backup (Manual e Automático)
        </h1>
        <p className="text-sm text-slate-500">
          Gerencie o backup automático na nuvem (Google Drive / OneDrive), download manual do SQLite e dados da oficina.
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Seção 1: Central de Backup (Nuvem / Google Drive / Local) */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-850 to-blue-950 rounded-2xl p-6 text-white shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/20">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Backup na Nuvem & Google Drive
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Manual & Automático
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Seus dados ficam protegidos no arquivo único <code className="text-blue-300">prisma/dev.db</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Como funciona o Automático vs Manual */}
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <FolderSync className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-300">
              <strong className="text-white">Sincronização Automática em Tempo Real:</strong> Se a pasta do sistema estiver dentro do <strong>Google Drive para Computador</strong>, <strong>OneDrive</strong> ou <strong>Dropbox</strong>, todo novo cliente, venda ou OS salva no sistema é sincronizada na nuvem <strong>instantaneamente em tempo real</strong> pelo aplicativo de nuvem do seu Windows!
            </p>
          </div>
        </div>

        {/* 3 Opções de Backup */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Opção 1: Download .db */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-200">1. Download Manual (.db)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Baixe o arquivo bruto do banco SQLite agora para salvar em pendrive ou anexar por e-mail.
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
                Dump estruturado de todas as tabelas (clientes, estoque, OSs, vendas e financeiro).
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

          {/* Opção 3: Cópia Direta para Pasta do Google Drive */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-200">3. Copiar p/ Pasta do Google Drive</h3>
              <p className="text-xs text-slate-400 mt-1">
                Gera um snapshot com data e hora na pasta do Google Drive ou pasta de backups.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTriggerBackup()}
              className="mt-4 w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <HardDrive className="w-4 h-4" />
              Executar Cópia Agora
            </button>
          </div>
        </div>

        {/* Configuração de Pasta de Destino */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs">
          <label className="font-bold text-slate-300 whitespace-nowrap">
            Pasta Personalizada (Google Drive / Pendrive):
          </label>
          <input
            type="text"
            placeholder="Ex: G:\Meu Drive\Backups_Oficina ou C:\Users\SeuNome\Google Drive\Backups"
            value={cloudFolder}
            onChange={(e) => setCloudFolder(e.target.value)}
            className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
          />
          <button
            type="button"
            onClick={() => handleTriggerBackup(cloudFolder)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold whitespace-nowrap"
          >
            Salvar e Fazer Cópia
          </button>
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
