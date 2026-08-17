"use client";

import React, { useRef } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle, Lightbulb, Sparkles } from "lucide-react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { PAGE_TOURS } from "@/lib/pageTours";

interface PageTourButtonProps {
  customRoute?: string;
  variant?: "header" | "floating" | "compact";
  className?: string;
}

export default function PageTourButton({
  customRoute,
  variant = "header",
  className = "",
}: PageTourButtonProps) {
  const pathname = usePathname();
  const driverObjRef = useRef<any>(null);

  const routeKey = customRoute || pathname;
  const tourData = PAGE_TOURS[routeKey] || PAGE_TOURS["/dashboard"];

  const handleStartTour = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!tourData || !tourData.steps.length) return;

    // Filtra apenas passos cujos elementos existem na página atual (ou fallback global)
    const validSteps = tourData.steps.filter((step) => {
      if (typeof step.element === "string") {
        return !!document.querySelector(step.element);
      }
      return true;
    });

    const stepsToRun = validSteps.length > 0 ? validSteps : tourData.steps;

    const driverInstance = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: "rgba(15, 23, 42, 0.75)",
      stagePadding: 6,
      stageRadius: 14,
      popoverClass: "torque-driver-popover",
      nextBtnText: "Próximo →",
      prevBtnText: "← Anterior",
      doneBtnText: "✓ Entendido",
      steps: stepsToRun,
    });

    driverObjRef.current = driverInstance;
    driverInstance.drive();
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleStartTour}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-[11px] font-extrabold shadow-sm transition-all active:scale-95 ${className}`}
        title="Ver tutorial detalhado desta tela"
      >
        <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
        <span>Como Usar</span>
      </button>
    );
  }

  if (variant === "floating") {
    return (
      <button
        type="button"
        onClick={handleStartTour}
        className={`fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-2xl shadow-orange-500/30 flex items-center gap-2 transition-all active:scale-95 border-2 border-white/40 ${className}`}
        title="Clique para ver o tutorial detalhado desta tela"
      >
        <Lightbulb className="w-4 h-4 text-white animate-bounce" />
        <span className="hidden sm:inline">Como Funciona Esta Tela</span>
      </button>
    );
  }

  // Padrão: Header Button
  return (
    <button
      type="button"
      onClick={handleStartTour}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-black shadow-sm transition-all active:scale-95 group ${className}`}
      title="Clique para ver o passo a passo detalhado dos recursos desta tela"
    >
      <Lightbulb className="w-4 h-4 text-amber-600 group-hover:rotate-12 transition-transform" />
      <span>Como Usar Esta Tela</span>
    </button>
  );
}
