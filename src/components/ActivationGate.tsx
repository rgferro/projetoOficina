"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  KeyRound,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Car,
  Lock,
  HelpCircle,
  RefreshCw,
} from "lucide-react";

interface LicenseStatusData {
  isLicensed: boolean;
  hardwareId: string;
  projectId: string;
  licenseType?: string;
  issuedTo?: string;
  activatedAt?: string;
  reason?: string;
}

export function ActivationGate({ children }: { children: React.ReactNode }) {
  // 100% SaaS Web na Nuvem: bypass total sem travas de hardware local
  return <>{children}</>;
}
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Ativar Licença do Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Informativo */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Operação 100% Offline & Local
            </span>
            <span>Versão Comercial Pro</span>
          </div>
        </div>
      </div>
    </div>
  );
}
