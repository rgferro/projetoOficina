"use client";

import React from "react";
import Link from "next/link";
import { Zap, ArrowRight, User, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

export function PublicNavbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Início", href: "/" },
    { name: "Planos & Preços", href: "/#planos" },
    { name: "Sobre Nós", href: "/sobre" },
    { name: "Fale Conosco", href: "/contato" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 font-bold text-xl tracking-tight">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-slate-900 font-extrabold text-xl">Torque</span>
            <span className="text-amber-500 font-black ml-1 text-xl">ERP</span>
            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest -mt-1">
              Gestão Automotiva
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`hover:text-blue-600 transition-colors ${
                pathname === link.href ? "text-blue-600 font-bold" : ""
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Call to Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Acessar Sistema</span>
            <ArrowRight className="w-4 h-4 hidden sm:inline" />
          </Link>
        </div>
      </div>
    </header>
  );
}
