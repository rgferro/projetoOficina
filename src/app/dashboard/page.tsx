import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatPlate, formatPhone, formatDateTime } from "@/lib/formatters";
import {
  Droplets,
  Wrench,
  CircleDollarSign,
  Users,
  MessageSquare,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { generateWhatsappLink, buildWashReadyMessage } from "@/lib/whatsapp";

// Força renderização dinâmica para dados sempre frescos
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let activeWashTickets: any[] = [];
  let activeServiceOrders: any[] = [];
  let todayTransactions: any[] = [];
  let settings: any = null;
  let totalCustomers = 0;
  let totalVehicles = 0;

  try {
    // 1. Dados do Lava-Jato hoje
    activeWashTickets = await prisma.washTicket.findMany({
      where: {
        status: { in: ["AGUARDANDO", "EM_LAVAGEM", "FINALIZADO"] },
      },
      include: {
        vehicle: { include: { customer: true } },
        employee: true,
      },
      orderBy: { enteredAt: "asc" },
    });

    // 2. Dados das Ordens de Serviço ativas
    activeServiceOrders = await prisma.serviceOrder.findMany({
      where: {
        status: { in: ["ORCAMENTO", "APROVADO", "EM_EXECUCAO", "AGUARDANDO_PECA"] },
      },
      include: {
        customer: true,
        vehicle: true,
        employee: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    // 3. Faturamento de Hoje
    todayTransactions = await prisma.financialTransaction.findMany({
      where: {
        date: { gte: todayStart },
      },
    });

    // 4. Configurações da oficina
    settings = await prisma.workshopSetting.findUnique({
      where: { id: "default" },
    });

    // 5. Totalizadores gerais
    totalCustomers = await prisma.customer.count();
    totalVehicles = await prisma.vehicle.count();
  } catch (err) {
    console.error("Aviso ao carregar dados do Dashboard:", err);
  }

  const waitingCount = activeWashTickets.filter((t) => t.status === "AGUARDANDO").length;
  const inProgressCount = activeWashTickets.filter((t) => t.status === "EM_LAVAGEM").length;
  const readyCount = activeWashTickets.filter((t) => t.status === "FINALIZADO").length;

  const todayIncome = todayTransactions
    .filter((t) => t.type === "RECEITA")
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpense = todayTransactions
    .filter((t) => t.type === "DESPESA")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-800/30">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold backdrop-blur-sm mb-2 border border-blue-400/30">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
            Torque ERP • Painel Operacional Ativo
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {settings?.workshopName || "Oficina & Lava-Jato"}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Acompanhamento em tempo real do pátio de lavagem, ordens de serviço e caixa do dia.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/lavajato"
            className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
          >
            <Droplets className="w-4 h-4 text-cyan-600" />
            Quadro Lava-Jato
          </Link>
          <Link
            href="/oficina/nova"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            Criar Nova OS
          </Link>
        </div>
      </div>

      {/* Grid de Indicadores em Tempo Real */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Lava-Jato no Pátio</span>
            <Droplets className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {activeWashTickets.length}
          </div>
          <div className="text-[11px] text-slate-500">
            {waitingCount} na fila • {inProgressCount} lavando • {readyCount} prontos
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Ordens de Serviço</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {activeServiceOrders.length}
          </div>
          <div className="text-[11px] text-slate-500">
            Em manutenção / orçamento
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Receita Hoje</span>
            <CircleDollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {formatCurrency(todayIncome)}
          </div>
          <div className="text-[11px] text-slate-500">
            Despesas do dia: {formatCurrency(todayExpense)}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Base de Clientes</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {totalCustomers}
          </div>
          <div className="text-[11px] text-slate-500">
            {totalVehicles} veículos cadastrados
          </div>
        </div>
      </div>
    </div>
  );
}
