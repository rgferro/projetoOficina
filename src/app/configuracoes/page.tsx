"use client";

import { useState, useEffect, useRef } from "react";
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
  ExternalLink,
  Trash2,
  Upload,
  Key,
  ChevronDown,
  ChevronUp,
  Sparkles,
  History,
  FileCheck,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { formatDateTime } from "@/lib/formatters";
import { useAuth } from "@/lib/authContext";

export default function ConfiguracoesPage() {
  const { currentEmployee } = useAuth();
  const isAdminUser =
    !currentEmployee ||
    currentEmployee.accessLevel === "ADMIN" ||
    currentEmployee.role === "Administrador" ||
    currentEmployee.role === "Proprietário";

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
  const [errorMessage, setErrorMessage] = useState("");

  // Google Drive & Backup states
  const [gdriveStatus, setGdriveStatus] = useState<any>(null);
  const [gdriveFiles, setGdriveFiles] = useState<any[]>([]);
  const [loadingDriveFiles, setLoadingDriveFiles] = useState(false);
  const [isGdriveModalOpen, setIsGdriveModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Backup & Restore processing states
  const [syncingGdrive, setSyncingGdrive] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [restorePassphrase, setRestorePassphrase] = useState("");
  const [selectedDriveFile, setSelectedDriveFile] = useState<any>(null);
  const [restoreSummary, setRestoreSummary] = useState<any>(null);
  const [localFileToRestore, setLocalFileToRestore] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulário de credenciais personalizadas do Google Drive
  const [gdriveCredentialsForm, setGdriveCredentialsForm] = useState({
    clientId: "",
    clientSecret: "",
  });
  const [savingCredentials, setSavingCredentials] = useState(false);

  // WhatsApp states
  const [waStatus, setWaStatus] = useState<any>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [manualPhone, setManualPhone] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [connectingWa, setConnectingWa] = useState(false);
  const [qrTimeLeft, setQrTimeLeft] = useState<number>(45);

  const loadDriveFiles = async () => {
    try {
      setLoadingDriveFiles(true);
      const res = await fetch("/api/backup/google/files");
      if (res.ok) {
        const data = await res.json();
        setGdriveFiles(data.files || []);
      }
    } catch (e) {
      console.error("Erro ao carregar arquivos do Drive:", e);
    } finally {
      setLoadingDriveFiles(false);
    }
  };

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
      setGdriveStatus(backupStatusData);
      setWaStatus(waData);

      if (backupStatusData?.connected) {
        loadDriveFiles();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Monitora retornos de OAuth do Google na URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get("gdrive_status");
      const err = urlParams.get("gdrive_error");
      const email = urlParams.get("email");

      if (status === "connected") {
        setSuccessMessage(`✓ Google Drive conectado com sucesso para ${email || "sua conta"}!`);
        setTimeout(() => setSuccessMessage(""), 5000);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (err) {
        setErrorMessage(`Falha na autorização do Google Drive: ${err}`);
        setTimeout(() => setErrorMessage(""), 6000);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    loadData();
  }, []);

  // Timer regressivo de 45 segundos para expiração do QR Code
  useEffect(() => {
    let timer: any;
    if (isQrModalOpen && waStatus?.status === "QR_READY") {
      setQrTimeLeft(45);
      timer = setInterval(() => {
        setQrTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setWaStatus((s: any) => ({ ...s, status: "QR_EXPIRED", qrCodeUrl: null }));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isQrModalOpen, waStatus?.qrCodeUrl]);

  // Polling automático para atualizar QR Code
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

  // Iniciar fluxo de conexão OAuth com Google Drive
  const handleConnectGoogleDrive = () => {
    window.location.href = "/api/backup/google/auth";
  };

  // Salvar credenciais OAuth personalizadas
  const handleSaveGoogleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCredentials(true);
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_credentials",
          clientId: gdriveCredentialsForm.clientId,
          clientSecret: gdriveCredentialsForm.clientSecret,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGdriveStatus(data.status);
        setSuccessMessage("✓ Credenciais do Google Drive salvas com sucesso!");
        setTimeout(() => setSuccessMessage(""), 4000);
        handleConnectGoogleDrive();
      } else {
        alert(data.error || "Erro ao salvar credenciais");
      }
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSavingCredentials(false);
    }
  };

  // Desconectar Google Drive
  const handleDisconnectGdrive = async () => {
    if (!confirm("Deseja desconectar sua conta do Google Drive deste sistema?")) return;
    try {
      const res = await fetch("/api/backup/google/disconnect", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setGdriveStatus(data.status);
        setGdriveFiles([]);
        setSuccessMessage("Google Drive desconectado com sucesso.");
        setTimeout(() => setSuccessMessage(""), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Realizar Backup Imediato para Google Drive (AES-256-GCM)
  const handleExecuteBackupNow = async () => {
    setSyncingGdrive(true);
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase: backupPassphrase }),
      });
      const data = await res.json();
      if (res.ok) {
        setGdriveStatus(data.status);
        setIsBackupModalOpen(false);
        setBackupPassphrase("");
        setSuccessMessage(`✓ Backup criptografado (${data.result?.recordsCount || 0} registros) enviado com sucesso para o seu Google Drive!`);
        setTimeout(() => setSuccessMessage(""), 5000);
        loadDriveFiles();
      } else {
        alert(data.error || "Erro ao realizar backup para o Google Drive");
      }
    } catch (err: any) {
      alert("Erro ao sincronizar: " + err.message);
    } finally {
      setSyncingGdrive(false);
    }
  };

  // Iniciar Restauração a partir de um Arquivo do Google Drive
  const handleStartDriveRestore = (file: any) => {
    setSelectedDriveFile(file);
    setLocalFileToRestore(null);
    setRestoreSummary(null);
    setRestorePassphrase("");
    setIsRestoreModalOpen(true);
  };

  // Iniciar Restauração a partir de Arquivo Local
  const handleLocalFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalFileToRestore(file);
      setSelectedDriveFile(null);
      setRestoreSummary(null);
      setRestorePassphrase("");
      setIsRestoreModalOpen(true);
    }
  };

  // Confirmar e Executar Restauração no Banco de Dados
  const handleConfirmRestore = async () => {
    if (!confirm("ATENÇÃO: A restauração atualizará os registros do banco de dados com os dados do backup. Deseja prosseguir?")) {
      return;
    }

    setRestoring(true);
    try {
      let res;
      if (localFileToRestore) {
        const formData = new FormData();
        formData.append("file", localFileToRestore);
        formData.append("passphrase", restorePassphrase);
        res = await fetch("/api/backup/restore", {
          method: "POST",
          body: formData,
        });
      } else if (selectedDriveFile) {
        res = await fetch("/api/backup/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "google_drive",
            fileId: selectedDriveFile.id,
            passphrase: restorePassphrase,
          }),
        });
      } else {
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setRestoreSummary(data.counts);
        setSuccessMessage("✓ Restauração de dados concluída com sucesso!");
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        alert(data.error || "Falha na restauração do backup. Verifique a senha informada.");
      }
    } catch (err: any) {
      alert("Erro durante a restauração: " + err.message);
    } finally {
      setRestoring(false);
    }
  };

  // Excluir Backup do Google Drive
  const handleDeleteDriveFile = async (fileId: string) => {
    if (!confirm("Deseja realmente remover esta cópia de backup do Google Drive?")) return;
    try {
      const res = await fetch("/api/backup/google/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", fileId }),
      });
      if (res.ok) {
        setSuccessMessage("Arquivo removido do Google Drive com sucesso.");
        setTimeout(() => setSuccessMessage(""), 3500);
        loadDriveFiles();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Conectar WhatsApp
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

  const isGdriveConnected = Boolean(gdriveStatus?.connected);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast de Sucesso */}
      {successMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300 font-bold text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Toast de Erro */}
      {errorMessage && (
        <div className="fixed top-5 right-5 z-50 bg-rose-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-200" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-8 h-8 text-blue-600" />
            Configurações & Backup em Nuvem
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerenciamento do sistema, integração com Google Drive, backups criptografados e WhatsApp.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO PRINCIPAL: CENTRAL DE BACKUP E GOOGLE DRIVE                          */}
      {/* ========================================================================= */}
      <div id="config-backup-card" className="bg-gradient-to-tr from-slate-900 via-slate-850 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-8 border border-slate-800">
        {/* Cabeçalho do Card */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-inner">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black text-white">Central de Backup & Restauração</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  AES-256-GCM
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google Drive OAuth 2.0
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Guarde cópias dos seus clientes, veículos, finanças e ordens de serviço no seu próprio Google Drive ou no computador.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>{showInstructions ? "Ocultar Guia Rápido" : "Como Funciona (Guia)"}</span>
              {showInstructions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GUIA PASSO A PASSO EM LINGUAGEM SIMPLES (UX PARA LEIGOS)                   */}
        {/* ========================================================================= */}
        {showInstructions && (
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-blue-300 font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Guia Passo a Passo Simplificado (Para qualquer pessoa usar)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Passo 1 */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px] font-black border border-emerald-500/40">
                    1
                  </span>
                  <span>Conectar ao Google Drive</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Clique no botão <strong>Conectar Google Drive</strong>. Você autoriza pelo Google com <strong>Privacidade Total</strong>: o sistema acessa apenas seus próprios arquivos de backup e não lê nada pessoal.
                </p>
              </div>

              {/* Passo 2 */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[11px] font-black border border-blue-500/40">
                    2
                  </span>
                  <span>Criar Cópia de Segurança</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Basta clicar em <strong>Fazer Backup Agora</strong>. O sistema empacota todos os clientes, veículos, serviços e caixa, criptografa e envia direto para sua nuvem.
                </p>
              </div>

              {/* Passo 3 */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[11px] font-black border border-purple-500/40">
                    3
                  </span>
                  <span>Restaurar ou Baixar</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Se formatar o computador ou trocar de máquina, clique em <strong>Restaurar</strong> ao lado da cópia desejada. Você também pode clicar em <strong>Baixar</strong> para salvar no seu PC ou pen-drive.
                </p>
              </div>
            </div>

            {/* Dica de Segurança */}
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-slate-300 text-[11px] leading-relaxed">
                <strong className="text-emerald-300 font-bold">Dica de Segurança Blindada:</strong> Todos os seus dados são criptografados com o algoritmo militar <strong>AES-256-GCM</strong> localmente antes de serem enviados. Mesmo que alguém invada sua conta do Google Drive, encontrará apenas um arquivo ilegível.
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BLOCO 1: STATUS DO GOOGLE DRIVE E AÇÕES RÁPIDAS                           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Status do Drive */}
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Cloud className="w-5 h-5 text-blue-400" />
                  <span>Google Drive Pessoal</span>
                </div>
                {isGdriveConnected ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20">
                    <Check className="w-3 h-3 stroke-[3]" />
                    CONECTADO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-700 text-slate-300">
                    DESCONECTADO
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                {isGdriveConnected ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Conta:</span>
                      <strong className="text-blue-300 truncate max-w-[200px]">{gdriveStatus?.email || "Google Drive Ativo"}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Último Backup:</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {gdriveStatus?.lastBackupDate ? formatDateTime(gdriveStatus.lastBackupDate) : "Nunca enviado"}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="leading-relaxed">
                    Conecte seu Google Drive para sincronizar suas cópias de segurança automaticamente na nuvem de forma protegida.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 space-y-2">
              {isGdriveConnected ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBackupModalOpen(true)}
                    disabled={syncingGdrive}
                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncingGdrive ? "animate-spin" : ""}`} />
                    <span>{syncingGdrive ? "Fazendo Backup..." : "Fazer Backup Agora"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnectGdrive}
                    className="px-3 py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/30 transition-colors flex items-center justify-center gap-1.5"
                    title="Desconectar Conta"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Desconectar</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (gdriveStatus?.hasCustomCredentials) {
                        handleConnectGoogleDrive();
                      } else {
                        setIsGdriveModalOpen(true);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Conectar Conta Google Drive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGdriveModalOpen(true)}
                    className="w-full text-center text-[11px] text-blue-400 hover:underline py-1"
                  >
                    Configurar Credenciais OAuth Customizadas
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card Downloads Manuais no PC */}
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <span>Download Direto no Computador</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Baixe o arquivo de segurança para guardar localmente no seu computador ou enviar por e-mail/pen-drive.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href="/api/backup?format=enc"
                download
                className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Lock className="w-4 h-4 text-emerald-200" />
                <span>Baixar Backup Criptografado (.enc)</span>
              </a>

              <div className="flex gap-2">
                <a
                  href="/api/backup?format=json"
                  download
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-650 text-slate-200 text-[11px] font-bold border border-slate-600 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>JSON Completo</span>
                </a>
                <a
                  href="/api/backup?format=db"
                  download
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-650 text-slate-200 text-[11px] font-bold border border-slate-600 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>Banco .db SQLite</span>
                </a>
              </div>
            </div>
          </div>

          {/* Card Restaurar Arquivo do Computador */}
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Upload className="w-5 h-5 text-purple-400" />
                <span>Restaurar de Arquivo Local</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Envie um arquivo <strong>.enc</strong> ou <strong>.json</strong> salvo no seu computador para restaurar os dados no sistema.
              </p>
            </div>

            <div className="pt-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".enc,.json"
                onChange={handleLocalFileSelected}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Selecionar Arquivo do Computador</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOCO 2: TABELA DE BACKUPS DISPONÍVEIS NO GOOGLE DRIVE                     */}
        {/* ========================================================================= */}
        {isGdriveConnected && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Cópias de Segurança Salvas no seu Google Drive ({gdriveFiles.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={loadDriveFiles}
                disabled={loadingDriveFiles}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDriveFiles ? "animate-spin" : ""}`} />
                <span>Atualizar Lista</span>
              </button>
            </div>

            {loadingDriveFiles ? (
              <div className="p-8 text-center bg-slate-850/60 rounded-2xl border border-slate-800 space-y-2">
                <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Buscando backups no seu Google Drive...</p>
              </div>
            ) : gdriveFiles.length === 0 ? (
              <div className="p-8 text-center bg-slate-850/60 rounded-2xl border border-slate-800 space-y-2">
                <Cloud className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">Nenhum backup encontrado no seu Google Drive ainda.</p>
                <p className="text-[11px] text-slate-500">
                  Clique no botão <strong>Fazer Backup Agora</strong> acima para criar sua primeira cópia de segurança na nuvem.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700/80">
                    <tr>
                      <th className="py-3 px-4">Nome do Arquivo</th>
                      <th className="py-3 px-4">Data e Hora</th>
                      <th className="py-3 px-4">Tamanho</th>
                      <th className="py-3 px-4">Segurança</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {gdriveFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-white flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-xs">{file.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {formatDateTime(file.createdTime)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "N/D"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Lock className="w-2.5 h-2.5" />
                            AES-256-GCM
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartDriveRestore(file)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Restaurar</span>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch("/api/backup/google/files", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ action: "download_raw", fileId: file.id }),
                                  });
                                  if (res.ok) {
                                    const blob = await res.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = file.name;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                  }
                                } catch (e) {
                                  alert("Erro ao baixar arquivo: " + e);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-650 text-slate-200 text-[11px] font-bold border border-slate-600 transition-colors"
                              title="Baixar para este computador"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDriveFile(file.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                              title="Excluir do Google Drive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CRIAR BACKUP COM SENHA (OPCIONAL)                                   */}
      {/* ========================================================================= */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Fazer Backup Agora</h3>
                  <p className="text-xs text-slate-500">Criptografia Militar AES-256-GCM</p>
                </div>
              </div>
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Proteção Automática Ativa:
                </p>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  Seus dados serão empacotados e protegidos com criptografia. Você pode definir uma senha pessoal ou deixar em branco para usar a chave segura automática da sua oficina.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Senha / Frase Secreta de Criptografia (Opcional)
                </label>
                <input
                  type="password"
                  placeholder="Deixe em branco para usar a chave padrão"
                  value={backupPassphrase}
                  onChange={(e) => setBackupPassphrase(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Se você definir uma senha, precisará digitá-la para restaurar esta cópia no futuro.
                </span>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={syncingGdrive}
                onClick={handleExecuteBackupNow}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncingGdrive ? "animate-spin" : ""}`} />
                <span>{syncingGdrive ? "Criptografando & Enviando..." : "Confirmar e Enviar"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESTAURAÇÃO DE BACKUP COM SENHA E CONFIRMAÇÃO                       */}
      {/* ========================================================================= */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Restaurar Cópia de Segurança</h3>
                  <p className="text-xs text-slate-500">
                    {selectedDriveFile ? `Arquivo: ${selectedDriveFile.name}` : `Arquivo Local: ${localFileToRestore?.name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRestoreModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {restoreSummary ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-black text-sm">Dados Restaurados com Sucesso!</h4>
                  <p className="text-xs text-emerald-800">
                    O banco de dados foi atualizado com as informações da cópia de segurança.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500">Clientes:</span> <strong className="text-slate-800">{restoreSummary.customers || 0}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500">Veículos:</span> <strong className="text-slate-800">{restoreSummary.vehicles || 0}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500">Ordens de Serviço:</span> <strong className="text-slate-800">{restoreSummary.serviceOrders || 0}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500">Vendas:</span> <strong className="text-slate-800">{restoreSummary.sales || 0}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500">Produtos:</span> <strong className="text-slate-800">{restoreSummary.products || 0}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500">Transações Caixa:</span> <strong className="text-slate-800">{restoreSummary.transactions || 0}</strong>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRestoreModalOpen(false);
                      window.location.reload();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                  >
                    Fechar e Recarregar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Aviso de Restauração:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Ao restaurar, os dados contidos nesta cópia serão importados de volta para o sistema de forma atômica e segura.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Senha de Descriptografia (Se você definiu uma ao criar o backup)
                  </label>
                  <input
                    type="password"
                    placeholder="Deixe em branco se usou a chave automática"
                    value={restorePassphrase}
                    onChange={(e) => setRestorePassphrase(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRestoreModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={restoring}
                    onClick={handleConfirmRestore}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${restoring ? "animate-spin" : ""}`} />
                    <span>{restoring ? "Descriptografando & Restaurando..." : "Restaurar Agora"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREDENCIAIS OAUTH DO GOOGLE DRIVE                                   */}
      {/* ========================================================================= */}
      {isGdriveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Conectar Google Drive (OAuth 2.0)</h3>
                  <p className="text-xs text-slate-500">Princípio do Menor Privilégio & Escopo Restrito</p>
                </div>
              </div>
              <button
                onClick={() => setIsGdriveModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Como o sistema protege sua conta:
                </p>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  O sistema usa a autorização oficial OAuth 2.0 com escopo restrito <code>drive.file</code> e <code>drive.appdata</code>. O ERP <strong>nunca</strong> terá permissão para ler seus e-mails, fotos, documentos ou qualquer outra pasta do seu Drive.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={handleConnectGoogleDrive}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all"
                >
                  <Cloud className="w-5 h-5" />
                  <span>Autorizar com Conta Google</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="font-bold text-slate-700">Configuração Avançada (Para instâncias com credenciais próprias do Google Cloud Console):</p>
                <form onSubmit={handleSaveGoogleCredentials} className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Google Client ID</label>
                    <input
                      type="text"
                      placeholder="Ex: 123456789-abc.apps.googleusercontent.com"
                      value={gdriveCredentialsForm.clientId}
                      onChange={(e) => setGdriveCredentialsForm({ ...gdriveCredentialsForm, clientId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Google Client Secret</label>
                    <input
                      type="password"
                      placeholder="GOCSPX-..."
                      value={gdriveCredentialsForm.clientSecret}
                      onChange={(e) => setGdriveCredentialsForm({ ...gdriveCredentialsForm, clientSecret: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsGdriveModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                    >
                      Fechar
                    </button>
                    <button
                      type="submit"
                      disabled={savingCredentials}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-sm disabled:opacity-50"
                    >
                      {savingCredentials ? "Salvando..." : "Salvar & Conectar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 2: DADOS DA OFICINA & EMPRESA                                        */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Carregando configurações...</div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div id="config-company-card" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              Dados da Empresa (Aparecem nas Ordens de Serviço & Comprovantes)
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
                <label className="font-bold text-slate-700 block mb-1">CNPJ / CPF</label>
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

          {/* ========================================================================= */}
          {/* SEÇÃO 3: MODELOS DE MENSAGENS DO WHATSAPP                                  */}
          {/* ========================================================================= */}
          <div id="config-templates-card" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Modelos de Mensagem do WhatsApp (Variáveis: &#123;nome&#125;, &#123;veiculo&#125;, &#123;placa&#125;, &#123;oficina&#125;, &#123;valor&#125;)
            </h2>

            <div className="space-y-4 text-xs">
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
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
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
