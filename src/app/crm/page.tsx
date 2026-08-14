"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Droplets,
  Wrench,
  Sparkles,
} from "lucide-react";
import { formatPlate, formatPhone, formatDateOnly } from "@/lib/formatters";

function CRMContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "oficina" ? "oficina" : "lavajato";

  const [activeTab, setActiveTab] = useState<"lavajato" | "oficina">(initialTab);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadCRMData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/crm");
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCRMData();
  }, []);

  const washAlerts = data?.washRetentionAlerts || [];
  const oilAlerts = data?.oilServiceAlerts || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-emerald-600" />
            CRM & Reengajamento (WhatsApp Marketing Preditivo)
          </h1>
          <p className="text-sm text-slate-500">
            Identifique clientes ausentes e dispare mensagens automáticas no WhatsApp com 1 clique.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
            {data?.summary?.totalAlerts || 0} Oportunidades Hoje
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("lavajato")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "lavajato"
              ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>Retorno de Lava-Jato (+15 dias)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === "lavajato" ? "bg-white text-cyan-800" : "bg-slate-100 text-slate-700"
            }`}
          >
            {washAlerts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("oficina")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "oficina"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Troca de Óleo / Revisão 6 Meses</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === "oficina" ? "bg-white text-blue-800" : "bg-slate-100 text-slate-700"
            }`}
          >
            {oilAlerts.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Analisando histórico de clientes...</div>
      ) : activeTab === "lavajato" ? (
        <div className="space-y-4">
          <div className="bg-cyan-50/60 border border-cyan-200 rounded-2xl p-4 text-xs text-cyan-900 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Clientes com mais de 15 dias sem lavar o carro</p>
              <p className="text-cyan-700 mt-0.5">
                Estimule o retorno convidando para uma lavagem completa com mensagem personalizada.
              </p>
            </div>
          </div>

          {washAlerts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
              <Droplets className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700">Todos os clientes estão com lavagem recente!</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {washAlerts.map((alert: any) => (
                <div
                  key={alert.vehicleId}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                        {formatPlate(alert.plate)}
                      </span>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        ⏳ {alert.daysSinceLastWash} dias sem lavar
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{alert.vehicleModel}</h3>
                    <p className="text-xs text-slate-600 font-medium">
                      👤 {alert.customerName} ({formatPhone(alert.customerPhone)})
                    </p>

                    <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 italic">
                      &quot;{alert.messagePreview}&quot;
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Última: {formatDateOnly(alert.lastWashDate)}
                    </span>

                    <a
                      href={alert.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Enviar WhatsApp (1 Clique)</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Clientes com revisão ou troca de óleo há mais de 6 meses</p>
              <p className="text-blue-700 mt-0.5">
                Ofereça uma checagem preventiva gratuita para garantir a fidelização e segurança do veículo.
              </p>
            </div>
          </div>

          {oilAlerts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700">Nenhum veículo com revisão pendente no momento.</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {oilAlerts.map((alert: any) => (
                <div
                  key={alert.vehicleId}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                        {formatPlate(alert.plate)}
                      </span>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        🛠️ ~{alert.monthsSince} meses da última OS #{alert.lastOsNumber}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{alert.vehicleModel}</h3>
                    <p className="text-xs text-slate-600 font-medium">
                      👤 {alert.customerName} ({formatPhone(alert.customerPhone)})
                    </p>

                    <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 italic">
                      &quot;{alert.messagePreview}&quot;
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Última OS: {formatDateOnly(alert.lastOSDate)}
                    </span>

                    <a
                      href={alert.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Enviar WhatsApp (1 Clique)</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CRMPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-slate-400">Carregando CRM...</div>}>
      <CRMContent />
    </Suspense>
  );
}
