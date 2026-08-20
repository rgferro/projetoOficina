"use client";

import React from "react";

export function ActivationGate({ children }: { children: React.ReactNode }) {
  // 100% SaaS Web na Nuvem: bypass total sem travas de hardware local
  return <>{children}</>;
}
