"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/lib/authContext";
import { AccessGuard } from "@/components/AccessGuard";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
          <Header onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <AccessGuard>{children}</AccessGuard>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
