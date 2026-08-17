"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  KeyRound,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Car,
  Lock,
  HelpCircle,
  RefreshCw,
} from "lucide-react";

interface LicenseStatusData {
  isLicensed: boolean;
  hardwareId: string;
  projectId: string;
  licenseType?: string;
  issuedTo?: string;
  activatedAt?: string;
  reason?: string;
}

export function ActivationGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<LicenseStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [licenseKey, setLicenseKey] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const checkStatus = async () => {
    // Se estiver em modo SaaS Web (Padrão Online), libera o acesso direto sem travar no HWID
    if (process.env.NEXT_PUBLIC_APP_MODE !== "offline") {
      setStatus({ isLicensed: true, hardwareId: "ONLINE-SAAS", projectId: "TORQUE_ERP" });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/license/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Erro ao verificar licença:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleCopyHwid = () => {
    if (!status?.hardwareId) return;
    navigator.clipboard.writeText(status.hardwareId);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseKey: licenseKey.trim().toUpperCase(),
          companyName: companyName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage("✓ Sistema ativado com sucesso! Carregando...");
        setStatus(data.status);
        setTimeout(() => {
          checkStatus();
        }, 1500);
      } else {
        setErrorMessage(data.error || "Chave de licença inválida para esta máquina.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao conectar com o serviço de ativação.");
    } finally {
      setActivating(false);
    }
  };

  // Se estiver carregando verificação inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center animate-pulse">
          <Car className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Verificando integridade da licença local...</span>
        </div>
      </div>
    );
  }

  // Se o sistema estiver licenciado, exibe a aplicação normalmente!
  if (status?.isLicensed) {
    return <>{children}</>;
  }

  // Tela de Ativação / Bloqueio Inicial
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="bg-slate-900 p-6 text-white text-center space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
          
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 mb-1">
            <Car className="w-7 h-7" />
          </div>

          <h1 className="text-xl font-extrabold tracking-tight">
            AutoGestão ERP Automotivo Pro
          </h1>
          <p className="text-xs text-slate-400">
            Sistema Comercial, PDV Balcão, Lava-Jato, Oficina & CRM
          </p>

          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black uppercase tracking-wider">
              <Lock className="w-3 h-3" />
              Ativação de Licença Obrigatória
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Passo 1: Hardware ID */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                Identificador Único desta Máquina (Hardware ID):
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-black text-slate-900 tracking-wider shadow-inner text-center">
                {status?.hardwareId || "Carregando..."}
              </div>

              <button
                type="button"
                onClick={handleCopyHwid}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-tight pt-1">
              Copie o código acima e envie para o suporte/vendedor para gerar sua Chave de Ativação vitalícia.
            </p>
          </div>

          {/* Passo 2: Formulário de Ativação */}
          <form onSubmit={handleActivate} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                Nome da Oficina / Razão Social:
              </label>
              <input
                type="text"
                placeholder="Ex: Centro Automotivo Silva / Lava-Jato Express"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  3
                </span>
                Chave de Licença Fornecida (LIC-OFC-...): *
              </label>
              <input
                type="text"
                required
                placeholder="LIC-OFC-XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-3 border-2 border-slate-300 rounded-xl text-sm font-mono font-bold uppercase tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-center"
              />
            </div>

            <button
              type="submit"
              disabled={activating || !licenseKey.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {activating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validando Chave...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Ativar Licença do Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Informativo */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Operação 100% Offline & Local
            </span>
            <span>Versão Comercial Pro</span>
          </div>
        </div>
      </div>
    </div>
  );
}
