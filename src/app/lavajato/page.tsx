"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Droplets,
  Plus,
  Search,
  MessageSquare,
  CheckCircle,
  Clock,
  Car,
  DollarSign,
  ArrowRight,
  Sparkles,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Send,
  AlertTriangle,
} from "lucide-react";
import {
  formatCurrency,
  formatPlate,
  formatPhone,
  formatDateTime,
} from "@/lib/formatters";
import {
  generateWhatsappLink,
  buildWashReadyMessage,
} from "@/lib/whatsapp";

export default function LavaJatoPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modais
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTicketForPayment, setSelectedTicketForPayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [toastMsg, setToastMsg] = useState("");
  const [sendingWaId, setSendingWaId] = useState<string | null>(null);
  const [waAlertTicket, setWaAlertTicket] = useState<any>(null);
  const [waAlertMessage, setWaAlertMessage] = useState<string>("");

  const [standardServices, setStandardServices] = useState<any[]>([]);

  // Form states - Nova Lavagem
  const [isExpressRegister, setIsExpressRegister] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: "",
    serviceType: "Lavagem Completa",
    price: "70",
    employeeId: "",
    notes: "",
    // Expresso
    newPlate: "",
    newCustomerName: "",
    newCustomerPhone: "",
    newVehicleModel: "",
    newVehicleCategory: "Hatch / Sedan",
  });

  const [saving, setSaving] = useState(false);

  const washOptions =
    standardServices.length > 0
      ? standardServices.map((s) => ({
          name: s.name,
          defaultPrice: String(s.defaultPrice),
        }))
      : [
          { name: "Lavagem Simples (Ducha + Aspiração)", defaultPrice: "50" },
          { name: "Lavagem Completa", defaultPrice: "70" },
          { name: "Lavagem Completa + Cera", defaultPrice: "90" },
          { name: "Higienização Interna Completa", defaultPrice: "180" },
          { name: "Lavagem de Motor + Chassi", defaultPrice: "120" },
          { name: "Polimento Técnico e Cristalização", defaultPrice: "350" },
        ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, empRes, vehRes, setRes, servRes] = await Promise.all([
        fetch("/api/lavajato"),
        fetch("/api/equipe"),
        fetch("/api/veiculos"),
        fetch("/api/configuracoes"),
        fetch("/api/servicos-padrao"),
      ]);

      const [ticketsData, empData, vehData, setData, servData] = await Promise.all([
        ticketsRes.json(),
        empRes.json(),
        vehRes.json(),
        setRes.json(),
        servRes.json(),
      ]);

      setTickets(ticketsData);
      setEmployees(empData.filter((e: any) => e.active));
      setVehicles(vehData);
      setSettings(setData);
      setStandardServices(Array.isArray(servData) ? servData : []);
    } catch (err) {
      console.error("Erro ao carregar dados do lava-jato:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewTicketModal = () => {
    const defaultService =
      standardServices.length > 0
        ? standardServices[0]
        : { name: "Lavagem Completa", defaultPrice: 70 };

    setFormData({
      vehicleId: "",
      serviceType: defaultService.name,
      price: String(defaultService.defaultPrice),
      employeeId: "",
      notes: "",
      newPlate: "",
      newCustomerName: "",
      newCustomerPhone: "",
      newVehicleModel: "",
      newVehicleCategory: "Hatch / Sedan",
    });
    setIsExpressRegister(false);
    setIsNewTicketModalOpen(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Troca de status de lavagem
  const handleUpdateStatus = async (
    ticketId: string,
    newStatus: string,
    extraData: any = {}
  ) => {
    try {
      const res = await fetch("/api/lavajato", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ticketId,
          status: newStatus,
          ...extraData,
        }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submissão do checkout / entrega
  const handleConfirmPaymentAndDelivery = async () => {
    if (!selectedTicketForPayment) return;
    setSaving(true);

    try {
      await handleUpdateStatus(selectedTicketForPayment.id, "ENTREGUE", {
        paymentMethod,
      });
      setIsPaymentModalOpen(false);
      setSelectedTicketForPayment(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Envio de WhatsApp com verificação de conexão em tempo real
  const handleSendSilentWhatsapp = async (ticket: any, message: string) => {
    setSendingWaId(ticket.id);
    try {
      // 1. Verifica status do WhatsApp da oficina
      const statusRes = await fetch("/api/whatsapp/status");
      const statusData = await statusRes.json();

      if (statusData.status !== "CONNECTED") {
        // Abre o modal de alerta instrutivo
        setWaAlertTicket(ticket);
        setWaAlertMessage(message);
        setSendingWaId(null);
        return;
      }

      // 2. Disparo silencioso em segundo plano
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: ticket.vehicle.customer.phone,
          message: message,
          customerName: ticket.vehicle.customer.name,
          referenceType: "LAVA_JATO",
          referenceId: ticket.id,
        }),
      });

      if (res.ok) {
        handleUpdateStatus(ticket.id, "FINALIZADO", { notifiedWhatsapp: true });
        setToastMsg(`✓ WhatsApp enviado com sucesso para ${ticket.vehicle.customer.name}!`);
        setTimeout(() => setToastMsg(""), 3500);
      } else {
        setWaAlertTicket(ticket);
        setWaAlertMessage(message);
      }
    } catch (err) {
      setWaAlertTicket(ticket);
      setWaAlertMessage(message);
    } finally {
      setSendingWaId(null);
    }
  };

  // Salvar Nova Entrada no Lava-Jato
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: any = {
        serviceType: formData.serviceType,
        price: Number(formData.price),
        employeeId: formData.employeeId || undefined,
        notes: formData.notes || undefined,
      };

      if (isExpressRegister) {
        payload.newPlate = formData.newPlate;
        payload.newCustomerName = formData.newCustomerName;
        payload.newCustomerPhone = formData.newCustomerPhone;
        payload.newVehicleModel = formData.newVehicleModel;
        payload.newVehicleCategory = formData.newVehicleCategory;
      } else {
        payload.vehicleId = formData.vehicleId;
      }

      const res = await fetch("/api/lavajato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsNewTicketModalOpen(false);
        setFormData({
          vehicleId: "",
          serviceType: "Lavagem Completa",
          price: "70",
          employeeId: "",
          notes: "",
          newPlate: "",
          newCustomerName: "",
          newCustomerPhone: "",
          newVehicleModel: "",
          newVehicleCategory: "Hatch / Sedan",
        });
        loadData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Erro ao criar ticket");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao criar ticket");
    } finally {
      setSaving(false);
    }
  };

  // Filtro de tickets
  const filteredTickets = tickets.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.vehicle?.plate.toLowerCase().includes(q) ||
      t.vehicle?.model.toLowerCase().includes(q) ||
      t.vehicle?.customer?.name.toLowerCase().includes(q)
    );
  });

  const waitingList = filteredTickets.filter((t) => t.status === "AGUARDANDO");
  const inProgressList = filteredTickets.filter((t) => t.status === "EM_LAVAGEM");
  const readyList = filteredTickets.filter((t) => t.status === "FINALIZADO");
  const deliveredList = filteredTickets.filter((t) => t.status === "ENTREGUE").slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Droplets className="w-7 h-7 text-cyan-600" />
            Módulo Lava-Jato (Quadro de Pátio)
          </h1>
          <p className="text-sm text-slate-500">
            Controle de fluxo de veículos, disparo automático de aviso no WhatsApp e baixa direta no caixa.
          </p>
        </div>

          <button
            id="lavajato-new-btn"
            onClick={handleOpenNewTicketModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Entrada
          </button>
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-500/20 animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg("")} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Barra de Filtro */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por placa, cliente ou veículo no pátio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 shadow-sm"
          />
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Carregando quadro do lava-jato...</div>
      ) : (
        <div id="lavajato-kanban-board" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Coluna 1: Aguardando */}
          <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200/80 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 className="font-bold text-sm text-slate-800">Aguardando</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900 text-xs font-bold">
                {waitingList.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {waitingList.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm hover:shadow transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                        {formatPlate(ticket.vehicle.plate)}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">#{ticket.ticketNumber}</span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900">
                      {ticket.vehicle.brand} {ticket.vehicle.model}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      👤 {ticket.vehicle.customer.name}
                    </p>
                    <p className="text-xs text-slate-500">{formatPhone(ticket.vehicle.customer.phone)}</p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{ticket.serviceType}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(ticket.price)}</span>
                    </div>

                    {ticket.notes && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-2 font-medium">
                        ⚠️ {ticket.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(ticket.enteredAt)}
                    </span>

                    <button
                      onClick={() => handleUpdateStatus(ticket.id, "EM_LAVAGEM")}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                    >
                      <span>Iniciar</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {waitingList.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400 font-medium">
                  Nenhum veículo aguardando
                </div>
              )}
            </div>
          </div>

          {/* Coluna 2: Em Lavagem */}
          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-200/80 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-blue-200 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
                <h3 className="font-bold text-sm text-blue-950">Em Lavagem</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 text-xs font-bold">
                {inProgressList.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {inProgressList.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-blue-900 text-white">
                        {formatPlate(ticket.vehicle.plate)}
                      </span>
                      <span className="text-[11px] font-bold text-blue-400">#{ticket.ticketNumber}</span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900">
                      {ticket.vehicle.brand} {ticket.vehicle.model}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      👤 {ticket.vehicle.customer.name}
                    </p>
                    <p className="text-xs text-slate-500">{formatPhone(ticket.vehicle.customer.phone)}</p>

                    {ticket.employee && (
                      <p className="text-xs text-blue-700 bg-blue-50/80 px-2 py-1 rounded-md mt-2 font-medium">
                        🧼 Lavador: {ticket.employee.name}
                      </p>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{ticket.serviceType}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(ticket.price)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, "AGUARDANDO")}
                      className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                    >
                      Voltar
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(ticket.id, "FINALIZADO")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Finalizar</span>
                    </button>
                  </div>
                </div>
              ))}
              {inProgressList.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400 font-medium">
                  Nenhum veículo em lavagem agora
                </div>
              )}
            </div>
          </div>

          {/* Coluna 3: Finalizado (Pronto para Retirada & WhatsApp) */}
          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-sm text-emerald-950">Pronto / Finalizado</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-xs font-bold">
                {readyList.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {readyList.map((ticket) => {
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

                return (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-xl p-4 border-2 border-emerald-300 shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-emerald-950 text-white">
                          {formatPlate(ticket.vehicle.plate)}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600">✨ Pronto</span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">
                        {ticket.vehicle.brand} {ticket.vehicle.model}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">
                        👤 {ticket.vehicle.customer.name}
                      </p>
                      <p className="text-xs text-slate-500">{formatPhone(ticket.vehicle.customer.phone)}</p>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">{ticket.serviceType}</span>
                        <span className="font-black text-emerald-700 text-sm">{formatCurrency(ticket.price)}</span>
                      </div>

                      {/* Botão de Disparo WhatsApp Silencioso Interno */}
                      <button
                        id="lavajato-whatsapp-action"
                        type="button"
                        disabled={sendingWaId === ticket.id}
                        onClick={() => handleSendSilentWhatsapp(ticket, whatsappMsg)}
                        className="mt-3 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all text-center disabled:opacity-50"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{sendingWaId === ticket.id ? "Enviando..." : "Avisar no WhatsApp"}</span>
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, "EM_LAVAGEM")}
                        className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                      >
                        Voltar
                      </button>

                      <button
                        id="lavajato-deliver-action"
                        onClick={() => {
                          setSelectedTicketForPayment(ticket);
                          setIsPaymentModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Entregar & Receber</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              {readyList.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400 font-medium">
                  Nenhum veículo pronto aguardando retirada
                </div>
              )}
            </div>
          </div>

          {/* Coluna 4: Entregues Hoje */}
          <div className="bg-slate-100/60 rounded-2xl p-4 border border-slate-200 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <h3 className="font-bold text-sm text-slate-700">Entregues Recentes</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                {deliveredList.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {deliveredList.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white/80 rounded-xl p-3.5 border border-slate-200/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-700">
                      {formatPlate(ticket.vehicle.plate)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Pago ({ticket.paymentMethod || "PIX"})
                    </span>
                  </div>
                  <div className="text-slate-800 font-semibold truncate">
                    {ticket.vehicle.brand} {ticket.vehicle.model}
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                    <span>{formatDateTime(ticket.deliveredAt)}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(ticket.price)}</span>
                  </div>
                </div>
              ))}
              {deliveredList.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400 font-medium">
                  Nenhum veículo entregue ainda
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nova Entrada de Veículo no Lava-Jato */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-cyan-600" />
                Nova Entrada no Lava-Jato
              </h2>
              <button onClick={() => setIsNewTicketModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              {/* Alternador: Veículo Cadastrado vs Expresso */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsExpressRegister(false)}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    !isExpressRegister
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Veículo Já Cadastrado
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpressRegister(true)}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    isExpressRegister
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ⚡ Entrada Expressa
                </button>
              </div>

              {!isExpressRegister ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Selecione o Veículo / Cliente *
                  </label>
                  <select
                    required
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="">Selecione um veículo cadastrado...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} - {v.brand} {v.model} ({v.customer?.name})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 bg-cyan-50/50 p-3.5 rounded-xl border border-cyan-100">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Placa *</label>
                      <input
                        type="text"
                        required
                        placeholder="ABC1D23"
                        value={formData.newPlate}
                        onChange={(e) =>
                          setFormData({ ...formData, newPlate: e.target.value.toUpperCase() })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase text-sm"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Modelo</label>
                      <input
                        type="text"
                        placeholder="Ex: Corolla, Onix"
                        value={formData.newVehicleModel}
                        onChange={(e) =>
                          setFormData({ ...formData, newVehicleModel: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nome do Cliente *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nome do cliente"
                        value={formData.newCustomerName}
                        onChange={(e) =>
                          setFormData({ ...formData, newCustomerName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">WhatsApp *</label>
                      <input
                        type="text"
                        required
                        placeholder="11987654321"
                        value={formData.newCustomerPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, newCustomerPhone: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tipo de Lavagem */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tipo de Serviço *</label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => {
                    const selected = washOptions.find((o) => o.name === e.target.value);
                    setFormData({
                      ...formData,
                      serviceType: e.target.value,
                      price: selected ? selected.defaultPrice : formData.price,
                    });
                  }}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
                >
                  {washOptions.map((opt) => (
                    <option key={opt.name} value={opt.name}>
                      {opt.name} - R$ {opt.defaultPrice}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor e Lavador */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valor Cobrado (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lavador Responsável</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="">Atribuir depois...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observações do Pátio</label>
                <input
                  type="text"
                  placeholder="Ex: Cuidado com insulfilm novo, cliente aguardando na loja"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-md shadow-cyan-600/20"
                >
                  {saving ? "Salvando..." : "Registrar Entrada"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Entrega e Recebimento */}
      {isPaymentModalOpen && selectedTicketForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Entrega & Recebimento da Lavagem
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedTicketForPayment.vehicle.brand} {selectedTicketForPayment.vehicle.model} (
                  {formatPlate(selectedTicketForPayment.vehicle.plate)})
                </p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
              <span className="text-xs text-emerald-800 font-semibold block">Total a Receber</span>
              <span className="text-3xl font-black text-emerald-700">
                {formatCurrency(selectedTicketForPayment.price)}
              </span>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-xs text-slate-700 block">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "PIX", label: "PIX", icon: QrCode },
                  { id: "DINHEIRO", label: "Dinheiro", icon: Banknote },
                  { id: "CARTAO_CREDITO", label: "Cartão Crédito", icon: CreditCard },
                  { id: "CARTAO_DEBITO", label: "Cartão Débito", icon: CreditCard },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id)}
                      className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmPaymentAndDelivery}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                {saving ? "Confirmando..." : "Confirmar Entrega & Baixa no Caixa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ALERTA: WHATSAPP DESCONECTADO */}
      {waAlertTicket && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">WhatsApp da Oficina Desconectado</h3>
                  <p className="text-[11px] text-slate-500">Aviso automático em segundo plano</p>
                </div>
              </div>
              <button
                onClick={() => setWaAlertTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed space-y-2">
              <p>
                O aparelho WhatsApp oficial da sua oficina ainda não está conectado no sistema.
              </p>
              <p className="text-[11px] text-amber-800">
                Para enviar avisos <strong>100% automáticos e silenciosos</strong> sem abrir o navegador, basta parear seu celular uma única vez em <strong>Ajustes da Oficina</strong>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">
                Cliente: {waAlertTicket.vehicle.customer.name}
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                {formatPhone(waAlertTicket.vehicle.customer.phone)} • {waAlertTicket.vehicle.brand} {waAlertTicket.vehicle.model}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  const whatsappUrl = generateWhatsappLink(
                    waAlertTicket.vehicle.customer.phone,
                    waAlertMessage
                  );
                  window.open(whatsappUrl, "_blank");
                  handleUpdateStatus(waAlertTicket.id, "FINALIZADO", { notifiedWhatsapp: true });
                  setWaAlertTicket(null);
                  setToastMsg("✓ Aviso aberto no WhatsApp Web!");
                  setTimeout(() => setToastMsg(""), 3500);
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                Abrir Mensagem no WhatsApp Web Agora
              </button>

              <Link
                href="/configuracoes"
                onClick={() => setWaAlertTicket(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <QrCode className="w-4 h-4 text-slate-500" />
                Ir para Configurações (Parear QR Code)
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

