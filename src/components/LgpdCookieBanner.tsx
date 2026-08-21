"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";

export default function LgpdCookieBanner() {
  const [accepted, setAccepted] = useState<boolean>(true);

  useEffect(() => {
    const isConsentGiven = localStorage.getItem("torque_lgpd_consent");
    if (!isConsentGiven) {
      setAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("torque_lgpd_consent", "true");
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <aside
      role="region"
      aria-label="Aviso de Privacidade e Cookies"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-slate-200 p-4 rounded-xl shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs leading-relaxed space-y-2">
          <p>
            Utilizamos cookies essenciais e tratamos dados para autenticação e operação segura do sistema, conforme a <strong>LGPD</strong>.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleAccept}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            >
              Concordar e Continuar
            </button>
            <Link
              href="/contato"
              className="text-slate-400 hover:text-slate-200 underline text-xs transition-colors"
            >
              Fale Conosco
            </Link>
          </div>
        </div>
        <button
          onClick={handleAccept}
          className="text-slate-400 hover:text-slate-200 p-1 -mr-1 -mt-1 rounded-md"
          title="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
