"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function Footer() {
  const [showCpf, setShowCpf] = useState(false);

  // Ofuscação para dificultar scraping automatizado
  const getUnmaskedCpf = () => {
    const p1 = "116";
    const p2 = "658";
    const p3 = "727";
    const p4 = "48";
    return `${p1}.${p2}.${p3}-${p4}`;
  };

  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8 px-4 sm:px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Identificação Legal / CDC / Pessoa Física */}
        <div className="text-center md:text-left space-y-1">
          <p className="font-medium text-slate-300">
            Torque ERP © 2026 • Operado por Rafael Gielow — CPF:{" "}
            <button
              type="button"
              onClick={() => setShowCpf(!showCpf)}
              title="Clique para exibir/ocultar CPF do responsável"
              className="inline-flex items-center gap-1 font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white px-2 py-0.5 rounded transition-colors text-xs cursor-pointer select-none"
            >
              <span>{showCpf ? getUnmaskedCpf() : "XXX.XXX.XXX-XX"}</span>
              <span className="text-[10px] text-slate-400">({showCpf ? "ocultar" : "ver"})</span>
            </button>
            {" "}• Juiz de Fora - MG
          </p>
          <p className="text-[11px] text-slate-500">
            Plataforma digital para gestão de oficinas automotivas em conformidade com a LGPD e CDC.
          </p>
        </div>

        {/* Links Institucionais & Jurídicos */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
          <Link href="/termos" className="hover:text-white transition-colors">
            Termos de Uso
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/privacidade" className="hover:text-white transition-colors">
            Privacidade & LGPD
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/contato" className="text-amber-400 hover:text-amber-300 transition-colors font-semibold">
            Fale Conosco
          </Link>
        </div>

      </div>
    </footer>
  );
}
