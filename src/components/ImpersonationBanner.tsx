"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, Clock, ArrowLeft } from "lucide-react";

export function ImpersonationBanner() {
  const [impersonationData, setImpersonationData] = useState<{
    isImpersonating: boolean;
    impersonatedBy?: string;
    targetName?: string;
    workshopName?: string;
    expiresAt?: string;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const checkImpersonation = () => {
      try {
        const savedUser = localStorage.getItem("torque_user");
        if (savedUser) {
          const u = JSON.parse(savedUser);
          if (u.isImpersonating || u.is_impersonating) {
            setImpersonationData({
              isImpersonating: true,
              impersonatedBy: u.impersonatedBy || u.impersonated_by || "rafael.gielow@gmail.com",
              targetName: u.name,
              workshopName: u.workshopName,
              expiresAt: u.impersonationExpiresAt || u.impersonation_expires_at,
            });
            return;
          }
        }
        setImpersonationData(null);
      } catch (e) {
        setImpersonationData(null);
      }
    };

    checkImpersonation();
    window.addEventListener("torque:user-updated", checkImpersonation);
    return () => {
      window.removeEventListener("torque:user-updated", checkImpersonation);
    };
  }, []);

  useEffect(() => {
    if (!impersonationData?.expiresAt) return;

    const updateTimer = () => {
      const remainingMs = new Date(impersonationData.expiresAt!).getTime() - Date.now();
      if (remainingMs <= 0) {
        setTimeLeft("00:00 (Expirado)");
        return;
      }

      const totalSeconds = Math.floor(remainingMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setTimeLeft(
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [impersonationData?.expiresAt]);

  const [isExiting, setIsExiting] = useState(false);

  const handleExitImpersonation = async () => {
    try {
      setIsExiting(true);
      // 1. Chama endpoint server-side para gerar token master fresco e atualizar cookie
      const res = await fetch("/api/master-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "EXIT_IMPERSONATION" }),
      });
      const json = await res.json();

      if (json.success && json.user) {
        localStorage.setItem("torque_user", JSON.stringify(json.user));
        if (json.token) {
          document.cookie = `torque_token=${json.token}; path=/; max-age=31536000; SameSite=Lax;`;
        }
        localStorage.removeItem("torque_master_backup");
        localStorage.removeItem("torque_master_token_backup");
        window.dispatchEvent(new CustomEvent("torque:user-updated", { detail: json.user }));
        window.location.href = "/master-admin";
        return;
      }

      // Fallback: Backup do localStorage
      const masterBackup = localStorage.getItem("torque_master_backup");
      const masterTokenBackup = localStorage.getItem("torque_master_token_backup");

      if (masterBackup) {
        localStorage.setItem("torque_user", masterBackup);
        localStorage.removeItem("torque_master_backup");
      }

      if (masterTokenBackup) {
        document.cookie = `torque_token=${masterTokenBackup}; path=/; max-age=31536000; SameSite=Lax;`;
        localStorage.removeItem("torque_master_token_backup");
      }

      window.location.href = "/master-admin";
    } catch (e) {
      window.location.href = "/master-admin";
    } finally {
      setIsExiting(false);
    }
  };

  if (!impersonationData?.isImpersonating) {
    return null;
  }

  return (
    <aside
      aria-label="Aviso de Sessão de Suporte Ativa"
      className="sticky top-0 z-[60] bg-amber-500 text-slate-950 px-4 py-2 shadow-lg border-b border-amber-600 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
        
        {/* Identificação */}
        <div className="flex items-center gap-2 font-medium">
          <span className="p-1 bg-amber-600/60 rounded text-amber-950 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </span>
          <div>
            <span className="font-extrabold uppercase tracking-wide bg-amber-600/40 px-1.5 py-0.5 rounded text-[11px] mr-1.5">
              Modo de Suporte Ativo
            </span>
            <span>
              Oficina: <strong>{impersonationData.workshopName || impersonationData.targetName}</strong>
            </span>
            <span className="hidden lg:inline text-amber-950 text-xs ml-2 opacity-90">
              (Operador: {impersonationData.impersonatedBy} • Ações auditadas)
            </span>
          </div>
        </div>

        {/* Temporizador e Botão de Saída */}
        <div className="flex items-center gap-2 sm:gap-3">
          {timeLeft && (
            <div className="flex items-center gap-1 bg-amber-600/30 px-2.5 py-1 rounded font-mono text-xs font-bold text-amber-950 border border-amber-600/30">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}</span>
            </div>
          )}

          <button
            onClick={handleExitImpersonation}
            disabled={isExiting}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-amber-400 px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            title="Encerrar personificação e voltar ao Painel Master"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${isExiting ? "animate-spin" : ""}`} />
            <span>{isExiting ? "Restaurando Master..." : "Voltar ao Painel Master"}</span>
          </button>
        </div>

      </div>
    </aside>
  );
}
