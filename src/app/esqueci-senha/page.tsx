import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Recuperar Senha | Torque ERP",
  description: "Redefina sua senha de acesso ao sistema Torque ERP de forma rápida e segura.",
};

export default function EsqueciSenhaPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-400">Carregando...</div>}>
      <AuthForm initialTab="FORGOT" />
    </Suspense>
  );
}
