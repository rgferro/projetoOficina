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
} from "lucide-react";
import { generateWhatsappLink, buildWashReadyMessage } from "@/lib/whatsapp";

// Força renderização dinâmica para dados sempre frescos
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Dados do Lava-Jato hoje
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const activeWashTickets = await prisma.washTicket.findMany({
    where: {
      status: { in: ["AGUARDANDO", "EM_LAVAGEM", "FINALIZADO"] },
    },
    include: {
      vehicle: { include: { customer: true } },
      employee: true,
    },
    orderBy: { enteredAt: "asc" },
  });

  const waitingCount = activeWashTickets.filter((t) => t.status === "AGUARDANDO").length;
  const inProgressCount = activeWashTickets.filter((t) => t.status === "EM_LAVAGEM").length;
  const readyCount = activeWashTickets.filter((t) => t.status === "FINALIZADO").length;

  // 2. Dados das Ordens de Serviço ativas
  const activeServiceOrders = await prisma.serviceOrder.findMany({
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
  const todayTransactions = await prisma.financialTransaction.findMany({
    where: {
      date: { gte: todayStart },
    },
  });

  const todayIncome = todayTransactions
    .filter((t) => t.type === "RECEITA")
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpense = todayTransactions
    .filter((t) => t.type === "DESPESA")
    .reduce((sum, t) => sum + t.amount, 0);

  // 4. Configurações da oficina
  const settings = await prisma.workshopSetting.findUnique({
    where: { id: "default" },
  });

  // 5. Totalizadores gerais
  const totalCustomers = await prisma.customer.count();
  const totalVehicles = await prisma.vehicle.count();

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/30 text-blue-100 text-xs font-semibold backdrop-blur-sm mb-2 border border-blue-400/20">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Sistema Ativo & Operacional
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {settings?.workshopName || "AutoGestão Oficina & Lava-Jato"}
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Acompanhamento em tempo real do pátio, fila de lavagem, ordens de serviço e caixa do dia.
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
            className="px-4 py-2.5 rounded-xl bg-blue-900/60 hover:bg-blue-900/80 border border-blue-400/30 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            Criar Nova OS
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Lava-Jato Ativo */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Lava-Jato (Pátio)
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">
              {activeWashTickets.length}
              <span className="text-xs font-medium text-slate-500 ml-1.5">veículos</span>
            </div>
            <div className="flex items-center gap-2 mt-3 text-[11px] font-semibold">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                ⏳ {waitingCount} fila
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                🧼 {inProgressCount} lavando
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                ✨ {readyCount} pronto
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Oficina (OS em Aberto) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Oficina (OS Ativas)
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">
              {activeServiceOrders.length}
              <span className="text-xs font-medium text-slate-500 ml-1.5">ordens</span>
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Em execução & orçamentos
            </p>
          </div>
        </div>

        {/* Card 3: Caixa de Hoje */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Faturamento Hoje
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {formatCurrency(todayIncome)}
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center justify-between font-medium">
              <span>Despesas: {formatCurrency(todayExpense)}</span>
              <span className="text-emerald-700 font-semibold">
                Líq: {formatCurrency(todayIncome - todayExpense)}
              </span>
            </p>
          </div>
        </div>

        {/* Card 4: Base de Clientes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Base de Clientes
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">
              {totalCustomers}
              <span className="text-xs font-medium text-slate-500 ml-1.5">clientes</span>
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1 font-medium">
              🚗 {totalVehicles} veículos cadastrados
            </p>
          </div>
        </div>
      </div>

      {/* Grid Principal: Lava-Jato no Pátio & OS Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Lava-Jato em Andamento */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-cyan-600" />
                Fila do Lava-Jato em Tempo Real
              </h2>
              <p className="text-xs text-slate-500">
                Veículos atualmente no pátio aguardando, lavando ou prontos para retirada.
              </p>
            </div>
            <Link
              href="/lavajato"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Ver Kanban Completo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeWashTickets.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <Droplets className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">Nenhum veículo no pátio no momento.</p>
              <Link
                href="/lavajato?action=new"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-blue-600 hover:underline"
              >
                + Dar entrada em um veículo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeWashTickets.map((ticket) => {
                const whatsappMsg = buildWashReadyMessage({
                  customerName: ticket.vehicle.customer.name,
                  vehicleName: `${ticket.vehicle.brand} ${ticket.vehicle.model}`,
                  plate: ticket.vehicle.plate,
                  price: ticket.price,
                  workshopName: settings?.workshopName,
                  customTemplate: settings?.whatsappWashReadyTemplate,
                });
                const whatsappUrl = generateWhatsappLink(
                  ticket.vehicle.customer.phone,
                  whatsappMsg
                );

                const statusColor =
                  ticket.status === "FINALIZADO"
                    ? "border-emerald-300 bg-emerald-50/40"
                    : ticket.status === "EM_LAVAGEM"
                    ? "border-blue-200 bg-blue-50/30"
                    : "border-amber-200 bg-amber-50/30";

                const statusBadge =
                  ticket.status === "FINALIZADO" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✨ Pronto p/ Retirada
                    </span>
                  ) : ticket.status === "EM_LAVAGEM" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      🧼 Em Lavagem
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      ⏳ Na Fila
                    </span>
                  );

                return (
                  <div
                    key={ticket.id}
                    className={`p-4 rounded-xl border ${statusColor} flex flex-col justify-between transition-all hover:shadow-sm`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-900 text-white tracking-wider">
                          {formatPlate(ticket.vehicle.plate)}
                        </span>
                        {statusBadge}
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 truncate">
                        {ticket.vehicle.brand} {ticket.vehicle.model}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                        👤 {ticket.vehicle.customer.name} ({formatPhone(ticket.vehicle.customer.phone)})
                      </p>
                      <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                        <span>{ticket.serviceType}</span>
                        <span className="font-bold text-slate-900">{formatCurrency(ticket.price)}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(ticket.enteredAt)}
                      </span>

                      {ticket.status === "FINALIZADO" && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Avisar no WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Coluna 3: Alertas CRM Rápidos */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                CRM & Reengajamento
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Preditivo
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Dispare mensagens automáticas para clientes com retorno pendente de lava-jato ou revisão de 6 meses.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Droplets className="w-4 h-4 text-cyan-600" />
                  Retorno de Lava-Jato
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Clientes que não lavam há +15 ou +30 dias.
                </p>
                <Link
                  href="/crm?tab=lavajato"
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  Ver lista de contatos <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  Troca de Óleo & Revisão
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Clientes com mais de 6 meses da última OS.
                </p>
                <Link
                  href="/crm?tab=oficina"
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  Disparar lembretes <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          <Link
            href="/crm"
            className="w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-center font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            Abrir Central de WhatsApp Marketing
          </Link>
        </div>
      </div>

      {/* Seção Ordens de Serviço Recentes */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              Ordens de Serviço em Aberto
            </h2>
            <p className="text-xs text-slate-500">
              Serviços mecânicos em andamento na oficina.
            </p>
          </div>
          <Link
            href="/oficina"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Ver Todas as OSs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeServiceOrders.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-500">Nenhuma Ordem de Serviço aberta no momento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nº OS</th>
                  <th className="py-3 px-4">Veículo / Placa</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Mecânico</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Valor Total</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeServiceOrders.map((os) => {
                  const statusMap: Record<string, { label: string; cls: string }> = {
                    ORCAMENTO: { label: "Orçamento", cls: "bg-purple-100 text-purple-800" },
                    APROVADO: { label: "Aprovado", cls: "bg-blue-100 text-blue-800" },
                    EM_EXECUCAO: { label: "Em Execução", cls: "bg-amber-100 text-amber-800" },
                    AGUARDANDO_PECA: { label: "Aguardando Peça", cls: "bg-red-100 text-red-800" },
                    CONCLUIDO: { label: "Concluído", cls: "bg-emerald-100 text-emerald-800" },
                  };
                  const currentStatus = statusMap[os.status] || {
                    label: os.status,
                    cls: "bg-slate-100 text-slate-800",
                  };

                  return (
                    <tr key={os.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-blue-600">
                        #{os.osNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{os.vehicle.model}</div>
                        <div className="font-mono text-[11px] text-slate-500 font-bold">
                          {formatPlate(os.vehicle.plate)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{os.customer.name}</div>
                        <div className="text-[11px] text-slate-500">{formatPhone(os.customer.phone)}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {os.employee?.name || "Não atribuído"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${currentStatus.cls}`}>
                          {currentStatus.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        {formatCurrency(os.grandTotal)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/oficina/${os.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition-colors"
                        >
                          Abrir OS
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
