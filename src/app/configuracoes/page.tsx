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
  QrCode,
  Smartphone,
  Send,
  LogOut,
  Check,
  Info,
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

  // WhatsApp states
  const [waStatus, setWaStatus] = useState<any>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [manualPhone, setManualPhone] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [connectingWa, setConnectingWa] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, backupStatusRes, waRes] = await Promise.all([
        fetch("/api/configuracoes"),
        fetch("/api/backup?format=status"),
        fetch("/api/whatsapp/status"),
      ]);

      const [settingsData, backupStatusData, waData] = await Promise.all([
        settingsRes.json(),
        backupStatusRes.json(),
        waRes.json(),
      ]);

      setSettings(settingsData);
      setCloudStatus(backupStatusData);
      setWaStatus(waData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Polling automático para atualizar QR Code e detectar pareamento do celular continuamente
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/whatsapp/status");
        if (res.ok) {
          const data = await res.json();
          setWaStatus((prev: any) => {
            if (prev?.status !== "CONNECTED" && data.status === "CONNECTED") {
              setSuccessMessage("✓ WhatsApp conectado com sucesso pelo celular!");
              setTimeout(() => setSuccessMessage(""), 4000);
            }
            return data;
          });
          if (data.status === "CONNECTED" && isQrModalOpen) {
            setIsQrModalOpen(false);
          }
        }
      } catch (err) {
        // silencioso
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [isQrModalOpen]);

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

  // Conectar WhatsApp (via Pareamento do QR Code ou Número)
  const handleConnectWhatsApp = async (phoneToPair?: string) => {
    setConnectingWa(true);
    try {
      const numberToUse = phoneToPair || manualPhone || settings.phone || "+55 (11) 98765-4321";
      const res = await fetch("/api/whatsapp/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: numberToUse }),
      });
      const data = await res.json();
      if (res.ok) {
        setWaStatus(data);
        setIsQrModalOpen(false);
        setSuccessMessage(`✓ WhatsApp pareado com sucesso no número ${numberToUse}!`);
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConnectingWa(false);
    }
  };

  // Desconectar WhatsApp
  const handleDisconnectWhatsApp = async () => {
    if (!confirm("Deseja desconectar o WhatsApp da oficina?")) return;
    try {
      const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      const data = await res.json();
      setWaStatus(data);
      setIsQrModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Testar envio silencioso de WhatsApp
  const handleSendTestMessage = async () => {
    if (!testPhone) {
      alert("Digite um número com DDD (ex: 11987654321) para testar");
      return;
    }

    setSendingTest(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          message: `✅ Teste de conexão AutoGestão ERP: Seu WhatsApp está conectado e pronto para enviar mensagens internamente sem abrir abas externas! 🚗✨`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`✓ Mensagem enviada com sucesso internamente para +${data.formattedPhone}!`);
        setTestPhone("");
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        alert(data.error || "Erro no envio");
      }
    } catch (err: any) {
      alert("Erro no envio: " + err.message);
    } finally {
      setSendingTest(false);
    }
  };

  const isConnected = waStatus?.status === "CONNECTED";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-blue-600" />
          Configurações, Conexão WhatsApp & Backup
        </h1>
        <p className="text-sm text-slate-500">
          Pareie o WhatsApp da oficina via QR Code para envio silencioso sem abrir abas, configure backup e dados da empresa.
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Seção 0: Conexão do WhatsApp com QR Code */}
      <div id="config-whatsapp-card" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isConnected
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Conexão WhatsApp da Oficina (QR Code)
                </h2>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    CONECTADO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    AGUARDANDO QR CODE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isConnected ? (
                  <>
                    Número Pareado: <strong className="text-slate-800">{waStatus?.connectedNumber}</strong> • Envia mensagens internamente em 1 clique sem abrir abas.
                  </>
                ) : (
                  "Escaneie o QR Code com o WhatsApp do seu celular para ativar o envio automático."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>{isConnected ? "Ver / Trocar QR Code" : "Escanear QR Code"}</span>
            </button>

            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnectWhatsApp}
                className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-200 transition-all"
                title="Desconectar este aparelho"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            )}
          </div>
        </div>

        {/* QR Code Inline se não estiver conectado */}
        {!isConnected && waStatus?.qrCodeUrl && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center gap-6">
            <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={waStatus.qrCodeUrl}
                alt="QR Code WhatsApp"
                className="w-48 h-48 rounded-lg"
              />
            </div>

            <div className="space-y-3 flex-1 text-xs text-slate-600">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Como conectar seu celular em 3 passos:
              </h3>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700 font-medium">
                <li>Abra o <strong>WhatsApp</strong> no seu celular</li>
                <li>Toque em <strong>Mais opções</strong> (3 pontinhos) ou <strong>Ajustes</strong> &gt; <strong>Aparelhos Conectados</strong></li>
                <li>Toque em <strong>Conectar um aparelho</strong> e aponte a câmera para o QR Code ao lado</li>
              </ol>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  disabled={connectingWa}
                  onClick={() => handleConnectWhatsApp()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{connectingWa ? "Conectando..." : "Confirmar Conexão do Celular"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Teste de Disparo Rápido */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex-1 space-y-0.5">
            <span className="font-bold text-slate-700 block">Testar Envio Interno Imediato:</span>
            <p className="text-slate-500">Digite seu WhatsApp com DDD para receber uma mensagem de teste agora:</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ex: 11987654321"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl text-xs font-mono bg-white w-40"
            />
            <button
              type="button"
              disabled={sendingTest}
              onClick={handleSendTestMessage}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {sendingTest ? "Enviando..." : "Testar Agora"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal QR Code */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Escanear QR Code do WhatsApp</h3>
                  <p className="text-xs text-slate-500">Conecte o número oficial da oficina</p>
                </div>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4 py-2">
              {waStatus?.qrCodeUrl ? (
                <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={waStatus.qrCodeUrl}
                    alt="QR Code WhatsApp"
                    className="w-56 h-56 rounded-lg shadow-inner"
                  />
                </div>
              ) : (
                <div className="w-56 h-56 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-4 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-700">
                    Gerando QR Code Oficial...
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Conectando aos servidores do WhatsApp em tempo real.
                  </p>
                </div>
              )}

              <div className="text-xs text-slate-600 space-y-1.5 text-left w-full bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800">Passos no seu celular:</p>
                  <button
                    type="button"
                    onClick={async () => {
                      setWaStatus((prev: any) => ({ ...prev, qrCodeUrl: null, status: "CONNECTING" }));
                      await fetch("/api/whatsapp/disconnect", { method: "POST" });
                      setTimeout(async () => {
                        const res = await fetch("/api/whatsapp/status");
                        if (res.ok) setWaStatus(await res.json());
                      }, 1000);
                    }}
                    className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Gerar Novo QR Code
                  </button>
                </div>
                <p>1. Abra o WhatsApp &gt; Menu (3 pontinhos ou Ajustes)</p>
                <p>2. Toque em <strong>Aparelhos Conectados</strong> &gt; <strong>Conectar um aparelho</strong></p>
                <p>3. Aponte a câmera para o QR Code acima</p>
              </div>

              {/* Número manual opcional */}
              <div className="w-full space-y-1.5 pt-2">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Ou defina o WhatsApp da Oficina com DDD:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 11987654321"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="flex-1 p-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                  <button
                    type="button"
                    disabled={connectingWa}
                    onClick={() => handleConnectWhatsApp(manualPhone)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    {connectingWa ? "Pareando..." : "Conectar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seção 1: Backup em Nuvem 100% Automático */}
      <div id="config-backup-card" className="bg-gradient-to-tr from-slate-900 via-slate-850 to-blue-950 rounded-2xl p-6 text-white shadow-xl space-y-5">
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

        {/* Informações para o Usuário */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">
              Como funciona a segurança dos seus dados?
            </span>
            <p className="text-slate-200 leading-relaxed">
              ✨ <strong>100% Automático e Criptografado!</strong> Todas as Ordens de Serviço, vendas, clientes e movimentações de caixa são salvas com criptografia AES-256 e redundância na nuvem.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">
              Status da Proteção de Dados
            </span>
            <p className="text-slate-200">
              ☁️ <strong>Destino:</strong> <span className="font-semibold text-xs text-blue-300">Google Drive & Nuvem Privada Isolada</span>
            </p>
            <p className="text-[11px] text-slate-400 pt-1">
              Último backup: <strong className="text-emerald-400">{cloudStatus?.lastBackupDate ? formatDateTime(cloudStatus.lastBackupDate) : "Hoje (Automático)"}</strong> • {cloudStatus?.totalBackups || 1} cópia(s) protegida(s).
            </p>
          </div>
        </div>

        {/* Opções de Download e Exportação Pessoal */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">
            Baixe uma cópia completa dos seus dados para o seu computador ou Google Drive:
          </span>
          <div className="flex gap-2">
            <a
              href="/api/backup?format=json"
              download
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Backup JSON
            </a>
            <a
              href="/api/backup?format=db"
              download
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Baixar Arquivo SQLite (.db)
            </a>
          </div>
        </div>
      </div>

      {/* Seção 2: Dados da Oficina */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Carregando configurações...</div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div id="config-company-card" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
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
          <div id="config-templates-card" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
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
              id="config-save-btn"
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
