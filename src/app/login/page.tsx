"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Zap,
  Lock,
  Mail,
  User,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Send,
  Check,
  X,
  Phone,
  FileText,
} from "lucide-react";
import {
  maskDocument,
  maskPhone,
  maskCEP,
  validateCPF,
  validateCNPJ,
  validatePasswordStrength,
} from "@/lib/validation";

interface LoginPageProps {
  initialTab?: "LOGIN" | "REGISTER";
}

export default function LoginPage({ initialTab = "LOGIN" }: LoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");

  const [activeTab, setActiveTab] = useState<"LOGIN" | "REGISTER">(
    tabParam === "register" ? "REGISTER" : initialTab
  );

  useEffect(() => {
    if (tabParam === "register") {
      setActiveTab("REGISTER");
    } else if (tabParam === "login") {
      setActiveTab("LOGIN");
    }
  }, [tabParam]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Form de Login
  const [loginForm, setLoginForm] = useState({
    login: "",
    password: "",
  });

  // Form de Cadastro (Dono da Oficina)
  const [docType, setDocType] = useState<"CNPJ" | "CPF">("CNPJ");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const [registerForm, setRegisterForm] = useState({
    workshopName: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ownerPassword: "",
    document: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    verificationCode: "",
  });

  // Força de senha
  const passStrength = validatePasswordStrength(registerForm.ownerPassword);

  // Busca automática de endereço no ViaCEP
  const handleCepChange = async (val: string) => {
    const masked = maskCEP(val);
    setRegisterForm((prev) => ({ ...prev, cep: masked }));

    const clean = masked.replace(/\D/g, "");
    if (clean.length === 8) {
      try {
        setCepLoading(true);
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setRegisterForm((prev) => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
        }
      } catch (e) {
        console.error("Erro ao consultar ViaCEP:", e);
      } finally {
        setCepLoading(false);
      }
    }
  };

  // Enviar código de verificação por e-mail
  const handleSendCode = async () => {
    if (!registerForm.ownerEmail || !registerForm.ownerEmail.includes("@")) {
      setError("Digite um e-mail válido antes de solicitar o código de verificação.");
      return;
    }

    setSendingCode(true);
    setError(null);
    setInfoMsg(null);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerForm.ownerEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setCodeSent(true);
        setInfoMsg(data.message);
      } else {
        setError(data.error || "Erro ao enviar código.");
      }
    } catch (e: any) {
      setError(e.message || "Erro de conexão ao enviar código.");
    } finally {
      setSendingCode(false);
    }
  };

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

    // Validação de Senha Forte
    if (!passStrength.isValid) {
      setError(passStrength.message);
      setLoading(false);
      return;
    }

    // Validação do Documento (CPF / CNPJ)
    const cleanDoc = registerForm.document.replace(/\D/g, "");
    if (docType === "CPF" && cleanDoc && !validateCPF(cleanDoc)) {
      setError("O CPF informado é inválido. Por favor, confira os números digitados.");
      setLoading(false);
      return;
    }
    if (docType === "CNPJ" && cleanDoc && !validateCNPJ(cleanDoc)) {
      setError("O CNPJ informado é inválido. Por favor, confira os números digitados.");
      setLoading(false);
      return;
    }

    if (!registerForm.verificationCode) {
      setError("Por favor, digite o código de 6 dígitos enviado para seu e-mail.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...registerForm,
          documentType: docType,
        }),
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
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
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
              setInfoMsg(null);
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
              setInfoMsg(null);
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

        {infoMsg && (
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{infoMsg}</span>
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
                  placeholder="seuemail@exemplo.com ou usuario"
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
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-[11px] text-blue-800 leading-snug">
              🎁 <strong>Plano Starter Gratuito:</strong> Até 2 Usuários inclusos (Dono + 1 Operador), sem necessidade de cartão de crédito.
            </div>

            {/* Dados da Oficina */}
            <div className="space-y-3 pt-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                1. Dados da Oficina
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

              {/* Toggle CPF vs CNPJ */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Documento da Empresa</label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setDocType("CNPJ");
                        setRegisterForm((p) => ({ ...p, document: "" }));
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        docType === "CNPJ" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      CNPJ (Pessoa Jurídica)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDocType("CPF");
                        setRegisterForm((p) => ({ ...p, document: "" }));
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        docType === "CPF" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      CPF (Pessoa Física)
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={registerForm.document}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, document: maskDocument(e.target.value) })
                  }
                  placeholder={docType === "CNPJ" ? "00.000.000/0001-00" : "000.000.000-00"}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500 font-mono"
                />
              </div>

              {/* Endereço com Busca Automática de CEP */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>CEP</span>
                    {cepLoading && <span className="text-[9px] text-blue-600 animate-pulse">Buscando...</span>}
                  </label>
                  <input
                    type="text"
                    value={registerForm.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500 font-mono"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Rua / Logradouro</label>
                  <input
                    type="text"
                    value={registerForm.street}
                    onChange={(e) => setRegisterForm({ ...registerForm, street: e.target.value })}
                    placeholder="Av. Principal"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Número</label>
                  <input
                    type="text"
                    value={registerForm.number}
                    onChange={(e) => setRegisterForm({ ...registerForm, number: e.target.value })}
                    placeholder="123"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Bairro / Cidade - UF</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={registerForm.neighborhood}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, neighborhood: e.target.value })
                      }
                      placeholder="Bairro"
                      className="w-1/2 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500"
                    />
                    <input
                      type="text"
                      value={registerForm.city ? `${registerForm.city}/${registerForm.state}` : ""}
                      onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                      placeholder="Cidade/UF"
                      className="w-1/2 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dados do Dono & Verificação de E-mail */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                2. Responsável & E-mail de Acesso
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
                  <label className="text-xs font-bold text-slate-700">WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={registerForm.ownerPhone}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, ownerPhone: maskPhone(e.target.value) })
                    }
                    placeholder="(11) 98765-4321"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Campo E-mail com Botão de Enviar Código */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Seu E-mail de Acesso *</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={registerForm.ownerEmail}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, ownerEmail: e.target.value })
                    }
                    placeholder="dono@oficina.com.br"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode || !registerForm.ownerEmail}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingCode ? "Enviando..." : codeSent ? "Reenviar" : "Enviar Código"}
                  </button>
                </div>
              </div>

              {/* Campo de Digitar Código de 6 Dígitos */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Código de Confirmação do E-mail *</span>
                  {codeSent && <span className="text-[10px] text-emerald-600 font-bold">✓ Código Enviado</span>}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={registerForm.verificationCode}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      verificationCode: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="Digite os 6 dígitos recebidos no e-mail (ex: 123456)"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500 font-mono tracking-widest text-center"
                />
              </div>

              {/* Campo de Senha com Medidor de Segurança Forte */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Crie sua Senha Forte *</label>
                <input
                  type="password"
                  required
                  value={registerForm.ownerPassword}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, ownerPassword: e.target.value })
                  }
                  placeholder="Mínimo 8 caracteres (maiúscula, minúscula, número e símbolo)"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-blue-500"
                />

                {/* Checklist Visual de Segurança da Senha */}
                {registerForm.ownerPassword && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">Padrão de Segurança:</span>
                      <span
                        className={`font-bold ${
                          passStrength.score <= 2
                            ? "text-rose-600"
                            : passStrength.score <= 4
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {passStrength.score <= 2
                          ? "Fraca"
                          : passStrength.score <= 4
                          ? "Média"
                          : "Excelente (Segura)"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-slate-600">
                      <div className="flex items-center gap-1">
                        {passStrength.checks.length ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <X className="w-3 h-3 text-rose-500" />
                        )}
                        <span>8+ Caracteres</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {passStrength.checks.uppercase ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <X className="w-3 h-3 text-rose-500" />
                        )}
                        <span>Letra Maiúscula</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {passStrength.checks.lowercase ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <X className="w-3 h-3 text-rose-500" />
                        )}
                        <span>Letra Minúscula</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {passStrength.checks.number ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <X className="w-3 h-3 text-rose-500" />
                        )}
                        <span>Número (0-9)</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2">
                        {passStrength.checks.special ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <X className="w-3 h-3 text-rose-500" />
                        )}
                        <span>Símbolo Especial (@, #, !, $, %, *)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? "Criando Conta..." : "Criar Minha Conta Grátis (2 Usuários)"}
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
