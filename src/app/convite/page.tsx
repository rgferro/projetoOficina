"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Zap,
  Lock,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
  Sparkles,
} from "lucide-react";
import { validatePasswordStrength } from "@/lib/validation";

function ConviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loadingInfo, setLoadingInfo] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passStrength = validatePasswordStrength(password);

  useEffect(() => {
    if (!token) {
      setInfoError("Link de convite inválido ou sem token de acesso.");
      setLoadingInfo(false);
      return;
    }

    const loadInviteInfo = async () => {
      try {
        const res = await fetch(`/api/auth/invite-info?token=${token}`);
        const data = await res.json();
        if (data.success) {
          setInviteData(data);
        } else {
          setInfoError(data.error || "Convite inválido ou expirado.");
        }
      } catch (e: any) {
        setInfoError("Erro de conexão ao verificar convite.");
      } finally {
        setLoadingInfo(false);
      }
    };

    loadInviteInfo();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!passStrength.isValid) {
      setSubmitError(passStrength.message);
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("As senhas digitadas não coincidem. Digite novamente.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("torque_user", JSON.stringify(data.user));
        }
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setSubmitError(data.error || "Erro ao criar senha.");
      }
    } catch (e: any) {
      setSubmitError(e.message || "Erro ao processar ativação de senha.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600" />
        <p className="text-xs text-slate-500 font-medium">Validando seu convite de equipe...</p>
      </div>
    );
  }

  if (infoError) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-black text-slate-900">Convite Indisponível</h1>
        <p className="text-xs text-slate-600 leading-relaxed">{infoError}</p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
        >
          Ir para o Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
            <Zap className="w-5 h-5 fill-current" />
          </div>
        </Link>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Bem-vindo à Equipe <span className="text-blue-600">{inviteData?.workshop?.name}</span>
        </h1>
        <p className="text-xs text-slate-500">
          Você foi cadastrado como <strong>{inviteData?.employee?.role}</strong> por <strong>{inviteData?.workshop?.ownerName}</strong>
        </p>
      </div>

      {/* Card do Formulário */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xl space-y-5">
        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-[11px] text-blue-900 leading-snug space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>{inviteData?.employee?.name}</span>
          </div>
          <div className="text-slate-600 font-mono text-[10px]">{inviteData?.employee?.email}</div>
          <div className="text-blue-700 text-[10px] pt-1 border-t border-blue-100/80">
            Crie sua senha abaixo para acessar seu painel de trabalho no <strong>Torque ERP</strong>.
          </div>
        </div>

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-fadeIn">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-black text-emerald-900">Senha Criada com Sucesso!</h3>
            <p className="text-xs text-emerald-700">Entrando no sistema automaticamente...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Crie sua Senha Forte *</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 text-slate-900 focus:outline-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>

              {/* Checklist de Senha */}
              {password && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[10px] mt-1">
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Confirme sua Senha *</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha digitada acima"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 text-slate-900 focus:outline-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Criando Senha e Entrando..." : "Definir Senha e Acessar o Sistema"}
            </button>
          </form>
        )}
      </div>

      <div className="text-center text-xs text-slate-400">
        Torque ERP • Gestão Inteligente de Oficinas e Lava-Jatos
      </div>
    </div>
  );
}

export default function ConvitePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-400">Carregando convite...</div>}>
      <ConviteContent />
    </Suspense>
  );
}
