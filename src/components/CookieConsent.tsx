"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const accepted = localStorage.getItem("torque_cookies_accepted");
      if (!accepted) {
        // Exibe após 1.5s
        const timer = setTimeout(() => setShow(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("torque_cookies_accepted", "true");
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 text-white p-5 rounded-3xl border border-slate-700/80 shadow-2xl backdrop-blur-md flex flex-col gap-3.5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
              Privacidade & Cookies (LGPD)
            </h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Utilizamos cookies essenciais para manter sua sessão segura e aprimorar sua experiência. Seus dados estão 100% protegidos em conformidade com a LGPD.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800 text-xs">
          <Link
            href="/privacidade"
            className="text-slate-400 hover:text-white text-[11px] underline underline-offset-2"
          >
            Política de Privacidade
          </Link>
          <button
            onClick={handleAccept}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95"
          >
            Entendi e Concordo
          </button>
        </div>
      </div>
    </div>
  );
}
