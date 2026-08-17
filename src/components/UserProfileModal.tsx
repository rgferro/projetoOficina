"use client";

import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  Shield,
  X,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import { ROLE_CONFIG } from "@/lib/permissions";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUserUpdated?: (updatedUser: any) => void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}: UserProfileModalProps) {
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const accessLevel = user?.accessLevel || "MECANICO";
  const roleInfo = (ROLE_CONFIG as any)[accessLevel] || {
    label: user?.role || "Colaborador",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    icon: "👤",
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword && newPassword.length < 6) {
      setErrorMsg("A nova senha deve ter no mínimo 6 dígitos.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg("A confirmação da nova senha não confere.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          name,
          phone,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao salvar alterações.");
      }

      setSuccessMsg("Dados e senha atualizados com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (onUserUpdated && data.user) {
        onUserUpdated(data.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de conexão ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                Meus Dados & Perfil
              </h3>
              <p className="text-xs text-slate-400">Informações da sua conta de acesso</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badge do Cargo & Empresa */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
              Empresa / Oficina
            </span>
            <span className="text-xs font-black text-slate-800 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              {user?.workshopName || "Torque ERP"}
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-xl border ${roleInfo.badgeColor}`}
          >
            <span>{roleInfo.icon}</span>
            <span>{roleInfo.label}</span>
          </span>
        </div>

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Nome Completo</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-blue-500 font-semibold"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">E-mail de Login</label>
            <div className="relative">
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3 py-2 pl-9 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              O e-mail de acesso é gerenciado pelo Administrador.
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Telefone / WhatsApp</label>
            <div className="relative">
              <input
                type="text"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-blue-500 font-mono"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              Alterar Senha de Acesso
            </span>

            <div>
              <label className="font-bold text-slate-600 block mb-1 text-[11px]">
                Senha Atual
              </label>
              <input
                type="password"
                placeholder="Digite sua senha atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-600 block mb-1 text-[11px]">
                  Nova Senha
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 dígitos"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1 text-[11px]">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
