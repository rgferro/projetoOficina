import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-400">Carregando...</div>}>
      <AuthForm initialTab="REGISTER" />
    </Suspense>
  );
}
