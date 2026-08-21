"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AuthProvider } from "@/lib/authContext";
import { AccessGuard } from "@/components/AccessGuard";
import { ActivationGate } from "@/components/ActivationGate";
import { PublicNavbar } from "@/components/PublicNavbar";
import OnboardingTour from "@/components/OnboardingTour";
import { CookieConsent } from "@/components/CookieConsent";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleOpenSidebar = () => {
      setSidebarOpen(true);
    };
    window.addEventListener("torque:open-mobile-sidebar", handleOpenSidebar);
    return () => {
      window.removeEventListener("torque:open-mobile-sidebar", handleOpenSidebar);
    };
  }, []);

  // Rotas públicas institucionais (Site de apresentação, SEO e AdSense)
  const publicRoutes = [
    "/",
    "/sistema-para-oficina-mecanica",
    "/sistema-para-lava-jato",
    "/sobre",
    "/contato",
    "/termos",
    "/privacidade",
    "/login",
    "/cadastro",
  ];
  const isPublicPage = publicRoutes.includes(pathname);

  // Se for página pública do site, renderiza layout limpo sem barra lateral ou menus internos
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <PublicNavbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <CookieConsent />
      </div>
    );
  }

  // Layout Interno do Sistema Operacional (Painel, Oficina, Lava-Jato, Caixa, etc.)
  return (
    <ActivationGate>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 flex font-sans">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
            <Header onOpenSidebar={() => setSidebarOpen(true)} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
              <AccessGuard>{children}</AccessGuard>
            </main>
          </div>

          {/* Barra de atalhos rápidos fixada no rodapé no modo mobile */}
          <MobileBottomNav onOpenSidebar={() => setSidebarOpen(true)} />
        </div>
        <OnboardingTour />
      </AuthProvider>
    </ActivationGate>
  );
}

