import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Torque ERP • Sistema de Gestão para Oficinas Mecânicas & Lava-Jato",
  description:
    "Torque ERP (torquerp.com.br) é o sistema SaaS completo para gestão de oficinas mecânicas, autocenters e lava-jatos. Controle de ordens de serviço, pátio kanban, PDV de peças, CRM WhatsApp e livro caixa.",
  keywords: [
    "sistema para oficina mecanica",
    "software lava jato",
    "gestao automotiva",
    "ordem de servico online",
    "pdv autopeças",
    "crm whatsapp oficina",
    "torquerp",
  ],
  authors: [{ name: "Torque ERP Team", url: "https://torquerp.com.br" }],
  openGraph: {
    title: "Torque ERP • O Sistema que Acelera sua Oficina",
    description:
      "Controle de pátio, ordens de serviço, financeiro e CRM WhatsApp em uma plataforma 100% web.",
    url: "https://torquerp.com.br",
    siteName: "Torque ERP",
    locale: "pt_BR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Google AdSense Meta Verification Placeholder */}
        <meta name="google-adsense-account" content="ca-pub-0000000000000000" />
      </head>
      <body className="antialiased font-sans bg-slate-100 text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
