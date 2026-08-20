import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Sistema de Gestão para Oficina Mecânica e Lava-Jato | Torque ERP",
  description:
    "Sistema completo para gestão de oficinas mecânicas e lava-jatos. Ordens de serviço, controle de pátio, PDV, integração WhatsApp e financeiro 100% na nuvem.",
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
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Torque ERP",
    operatingSystem: "Web, Android, iOS, Windows, macOS, Linux",
    applicationCategory: "BusinessApplication",
    featureList: [
      "Ordens de Serviço Digitais",
      "Controle de Pátio e Kanban para Lava-Jato",
      "WhatsApp Integration",
      "PDV Balcão de Peças",
      "Controle de Caixa e Financeiro",
      "Gestão de Equipe e Comissões",
      "Importação de NF-e XML",
      "Relatórios e BI Avançado"
    ],
    description:
      "Sistema de Gestão Completo para Oficinas Mecânicas, Centros Automotivos e Lava-Jatos com Ordens de Serviço, Kanban de Pátio, PDV Balcão e CRM WhatsApp.",
    url: "https://torquerp.com.br",
    offers: [
      {
        "@type": "Offer",
        name: "Plano Starter (Gratuito)",
        price: "0.00",
        priceCurrency: "BRL",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Plano Torque Oficina Pro",
        price: "69.90",
        priceCurrency: "BRL",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Plano Torque Oficina Elite",
        price: "129.90",
        priceCurrency: "BRL",
        availability: "https://schema.org/InStock",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "142",
      bestRating: "5",
      worstRating: "1",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "O Torque ERP realmente tem versão gratuita?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sim! O plano Starter é 100% gratuito para sempre, inclui 1 usuário e até 30 ordens de serviço por mês com os módulos essenciais da oficina.",
        },
      },
      {
        "@type": "Question",
        name: "Funciona direto no celular dos mecânicos e lavadores?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sim! O Torque ERP é 100% responsivo para smartphone, permitindo tirar fotos de avarias no checklist e atualizar o status do veículo em tempo real.",
        },
      },
      {
        "@type": "Question",
        name: "Como funciona a integração com WhatsApp?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Você conecta seu WhatsApp via QR Code em 30 segundos. O sistema dispara avisos automáticos de orçamento aprovado, serviço concluído e lembretes de revisão de óleo.",
        },
      },
    ],
  };

  return (
    <html lang="pt-BR">
      <head>
        {/* Google AdSense Meta Verification */}
        <meta name="google-adsense-account" content="ca-pub-0000000000000000" />
        {/* Schema Markup JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        {/* Auto-recuperação transparente de versões antigas de scripts pós-deploy (ChunkLoadError) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e && (e.message?.includes('ChunkLoadError') || e.message?.includes('Loading chunk') || e.target?.tagName === 'SCRIPT')) {
                  var lastReload = sessionStorage.getItem('last_chunk_reload');
                  var now = Date.now();
                  if (!lastReload || now - parseInt(lastReload) > 10000) {
                    sessionStorage.setItem('last_chunk_reload', now);
                    window.location.reload();
                  }
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans bg-slate-100 text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
