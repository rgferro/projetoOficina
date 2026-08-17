"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Lock, Mail, User, Building2, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form de Login
  const [loginForm, setLoginForm] = useState({
    login: "",
    password: "",
  });

  // Form de Cadastro (Dono da Oficina)
  const [registerForm, setRegisterForm] = useState({
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    ownerPhone: "",
    workshopName: "",
    document: "",
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("torque_user", JSON.stringify(data.user));
        }
        if (data.user?.isMaster) {
          router.push("/master-admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(data.error || "Erro ao realizar login.");
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("torque_user", JSON.stringify(data.user));
        }
        router.push("/dashboard");
      } else {
        setError(data.error || "Erro ao cadastrar oficina.");
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
            <Zap className="w-6 h-6 fill-current" />
          </div>
        </Link>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Acesso ao <span className="text-blue-600">Torque ERP</span>
        </h1>
        <p className="text-xs text-slate-500">
          Gestão inteligente para sua oficina mecânica e lava-jato
        </p>
      </div>

      {/* Caixa do Card de Autenticação */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
        {/* Abas Alternáveis: Entrar vs Criar Conta */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab("LOGIN");
              setError(null);
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === "LOGIN"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Entrar no Sistema
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("REGISTER");
              setError(null);
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === "REGISTER"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Criar Conta Grátis
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário: ENTRAR */}
        {activeTab === "LOGIN" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">E-mail ou Usuário</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginForm.login}
                  onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })}
                  placeholder="seuemail@exemplo.com ou rafael.gielow@gmail.com"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 text-slate-900 focus:outline-blue-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Senha ou PIN</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Sua senha de acesso ou PIN de 4 dígitos"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 text-slate-900 focus:outline-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ArrowRight className="w-4 h-4" />
              {loading ? "Entrando..." : "Entrar no Painel"}
            </button>
          </form>
        )}

        {/* Formulário: CRIAR CONTA (DONO DA OFICINA) */}
        {activeTab === "REGISTER" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-[11px] text-blue-800 leading-snug">
              🎁 <strong>Plano Starter Gratuito:</strong> Até 2 Usuários inclusos (Dono + 1 Operador), sem necessidade de cartão de crédito.
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nome da Oficina / Lava-Jato *</label>
              <input
                type="text"
                required
                value={registerForm.workshopName}
                onChange={(e) => setRegisterForm({ ...registerForm, workshopName: e.target.value })}
                placeholder="Ex: Centro Automotivo Silva"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Seu Nome *</label>
                <input
                  type="text"
                  required
                  value={registerForm.ownerName}
                  onChange={(e) => setRegisterForm({ ...registerForm, ownerName: e.target.value })}
                  placeholder="Nome do Dono"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">WhatsApp / Celular</label>
                <input
                  type="tel"
                  value={registerForm.ownerPhone}
                  onChange={(e) => setRegisterForm({ ...registerForm, ownerPhone: e.target.value })}
                  placeholder="(11) 98765-4321"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Seu E-mail de Acesso *</label>
              <input
                type="email"
                required
                value={registerForm.ownerEmail}
                onChange={(e) => setRegisterForm({ ...registerForm, ownerEmail: e.target.value })}
                placeholder="dono@oficina.com.br"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Crie sua Senha *</label>
              <input
                type="password"
                required
                value={registerForm.ownerPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, ownerPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? "Cadastrando..." : "Criar Minha Conta Grátis"}
            </button>
          </form>
        )}
      </div>

      <div className="text-center text-xs text-slate-400">
        Ao continuar, você concorda com nossos{" "}
        <Link href="/termos" className="text-slate-600 font-bold hover:underline">
          Termos de Uso
        </Link>{" "}
        e{" "}
        <Link href="/privacidade" className="text-slate-600 font-bold hover:underline">
          Privacidade
        </Link>
        .
      </div>
    </div>
  );
}
