"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Car,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  Edit2,
  ChevronRight,
  X,
  CheckCircle,
  AlertCircle,
  Calendar,
  Save,
  Lock,
} from "lucide-react";
import {
  formatPhone,
  formatPlate,
  formatDocument,
  formatCurrency,
  formatDateTime,
} from "@/lib/formatters";
import { useAuth } from "@/lib/authContext";

export default function ClientesPage() {
  const { currentEmployee } = useAuth();
  // Somente ADMIN, GERENTE e ATENDENTE podem criar/editar clientes
  const canManage =
    !currentEmployee ||
    currentEmployee.accessLevel === "ADMIN" ||
    currentEmployee.accessLevel === "GERENTE" ||
    currentEmployee.accessLevel === "ATENDENTE";

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modais
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isEditVehicleModalOpen, setIsEditVehicleModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Form states - Novo Cliente
  const [formData, setFormData] = useState({
    name: "",
    type: "PF",
    phone: "",
    email: "",
    document: "",
    stateRegistration: "",
    birthDate: "",
    address: "",
    notes: "",
    // Veículo inicial (opcional)
    plate: "",
    brand: "",
    model: "",
    year: "",
    color: "",
    category: "Hatch / Sedan",
    currentKm: "",
  });

  // Form states - Editar Cliente
  const [editCustomerData, setEditCustomerData] = useState({
    id: "",
    name: "",
    type: "PF",
    phone: "",
    email: "",
    document: "",
    stateRegistration: "",
    birthDate: "",
    address: "",
    notes: "",
  });

  // Form states - Novo Veículo
  const [vehicleData, setVehicleData] = useState({
    plate: "",
    brand: "",
    model: "",
    year: "",
    color: "",
    category: "Hatch / Sedan",
    currentKm: "",
    notes: "",
  });

  // Form states - Editar Veículo
  const [editVehicleData, setEditVehicleData] = useState({
    id: "",
    plate: "",
    brand: "",
    model: "",
    year: "",
    color: "",
    category: "Hatch / Sedan",
    currentKm: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      loadCustomers();
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);

  // Abre detalhes do cliente
  const handleOpenDetails = async (customer: any) => {
    try {
      const res = await fetch(`/api/clientes/${customer.id}`);
      const data = await res.json();
      setSelectedCustomer(data);
      setIsDetailsModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Abre modal de edição de cliente
  const handleOpenEditCustomer = (customer: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditCustomerData({
      id: customer.id,
      name: customer.name || "",
      type: customer.type || "PF",
      phone: customer.phone || "",
      email: customer.email || "",
      document: customer.document || "",
      stateRegistration: customer.stateRegistration || "",
      birthDate: customer.birthDate ? customer.birthDate.substring(0, 10) : "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
    setErrorMessage("");
    setIsEditCustomerModalOpen(true);
  };

  // Salvar Novo Cliente
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        phone: formData.phone,
        email: formData.email,
        document: formData.document,
        stateRegistration: formData.stateRegistration,
        birthDate: formData.birthDate || null,
        address: formData.address,
        notes: formData.notes,
        vehicle: formData.plate
          ? {
              plate: formData.plate,
              brand: formData.brand || "Geral",
              model: formData.model || "Modelo",
              year: formData.year ? Number(formData.year) : null,
              color: formData.color,
              category: formData.category,
              currentKm: formData.currentKm ? Number(formData.currentKm) : 0,
            }
          : undefined,
      };

      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Erro ao salvar cliente");
      }

      setIsNewCustomerModalOpen(false);
      setSuccessMessage("Cliente cadastrado com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3500);

      setFormData({
        name: "",
        type: "PF",
        phone: "",
        email: "",
        document: "",
        stateRegistration: "",
        birthDate: "",
        address: "",
        notes: "",
        plate: "",
        brand: "",
        model: "",
        year: "",
        color: "",
        category: "Hatch / Sedan",
        currentKm: "",
      });
      loadCustomers();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Atualizar Cliente Existente
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/clientes/${editCustomerData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editCustomerData),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Erro ao atualizar dados do cliente");
      }

      setIsEditCustomerModalOpen(false);
      setSuccessMessage("Dados do cliente atualizados com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3500);

      // Se o modal de detalhes estiver aberto, atualiza os dados locais
      if (selectedCustomer && selectedCustomer.id === editCustomerData.id) {
        handleOpenDetails({ id: editCustomerData.id });
      }

      loadCustomers();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Salvar Novo Veículo para Cliente
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setSaving(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...vehicleData,
          customerId: selectedCustomer.id,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Erro ao salvar veículo");
      }

      setIsAddVehicleModalOpen(false);
      setVehicleData({
        plate: "",
        brand: "",
        model: "",
        year: "",
        color: "",
        category: "Hatch / Sedan",
        currentKm: "",
        notes: "",
      });

      setSuccessMessage("Veículo adicionado com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3500);

      handleOpenDetails(selectedCustomer);
      loadCustomers();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Abrir edição de veículo
  const handleOpenEditVehicle = (vehicle: any) => {
    setEditVehicleData({
      id: vehicle.id,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year ? String(vehicle.year) : "",
      color: vehicle.color || "",
      category: vehicle.category || "Hatch / Sedan",
      currentKm: vehicle.currentKm ? String(vehicle.currentKm) : "",
      notes: vehicle.notes || "",
    });
    setErrorMessage("");
    setIsEditVehicleModalOpen(true);
  };

  // Salvar Edição do Veículo
  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/veiculos/${editVehicleData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editVehicleData),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Erro ao atualizar veículo");
      }

      setIsEditVehicleModalOpen(false);
      setSuccessMessage("Veículo atualizado com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3500);

      if (selectedCustomer) {
        handleOpenDetails(selectedCustomer);
      }
      loadCustomers();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Excluir Veículo
  const handleDeleteVehicle = async (vehicleId: string, plate: string) => {
    if (!confirm(`Tem certeza que deseja excluir o veículo placa ${plate}?`)) return;

    try {
      await fetch(`/api/veiculos/${vehicleId}`, { method: "DELETE" });
      setSuccessMessage("Veículo removido com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3500);

      if (selectedCustomer) {
        handleOpenDetails(selectedCustomer);
      }
      loadCustomers();
    } catch (err) {
      alert("Erro ao excluir veículo");
    }
  };

  // Deletar Cliente
  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${name}" e todos os seus veículos e históricos?`)) {
      return;
    }

    try {
      await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      setIsDetailsModalOpen(false);
      setSuccessMessage("Cliente excluído com sucesso.");
      setTimeout(() => setSuccessMessage(""), 3500);
      loadCustomers();
    } catch (err) {
      alert("Erro ao excluir cliente");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600" />
            Gestão de Clientes & Veículos
          </h1>
          <p className="text-sm text-slate-500">
            Cadastre, consulte e altere os dados cadastrais dos clientes e de seus veículos com histórico completo.
          </p>
        </div>

        {canManage ? (
          <button
            id="clientes-new-btn"
            onClick={() => setIsNewCustomerModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        ) : (
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs">
            <Lock className="w-3.5 h-3.5" />
            Somente Leitura
          </span>
        )}
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Barra de Busca */}
      <div id="clientes-search-bar" className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por Nome do Cliente, WhatsApp, CPF/CNPJ ou Placa do Veículo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
        />
      </div>

      {/* Lista de Clientes */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando clientes...</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhum cliente encontrado</h3>
          <p className="text-xs text-slate-500 mt-1">
            {search ? "Tente buscar por outro termo." : "Cadastre seu primeiro cliente para começar."}
          </p>
        </div>
      ) : (
        <div id="clientes-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div
              key={c.id}
              onClick={() => handleOpenDetails(c)}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {c.type === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {c.vehicles?.length || 0} {c.vehicles?.length === 1 ? "veículo" : "veículos"}
                    </span>
                    {canManage && (
                      <button
                        type="button"
                        title="Editar Dados do Cliente"
                        onClick={(e) => handleOpenEditCustomer(c, e)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-medium">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{formatPhone(c.phone)}</span>
                  </div>
                  {c.document && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{formatDocument(c.document)}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2 text-slate-500 truncate">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{c.email}</span>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-2 text-slate-500 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Veículos em destaque */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {c.vehicles?.slice(0, 2).map((v: any) => (
                    <span
                      key={v.id}
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800"
                    >
                      <Car className="w-3 h-3 text-slate-500" />
                      {formatPlate(v.plate)}
                    </span>
                  ))}
                  {c.vehicles?.length > 2 && (
                    <span className="text-[10px] text-slate-400 font-bold">
                      +{c.vehicles.length - 2}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Novo Cliente */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Cadastrar Novo Cliente
              </h3>
              <button
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva / Oficina Silva LTDA"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Pessoa
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="PF">Pessoa Física (PF)</option>
                    <option value="PJ">Pessoa Jurídica (PJ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp / Celular *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF / CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, Número, Bairro, Cidade"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Veículo do Cliente (Opcional - pode cadastrar agora ou depois)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Placa
                    </label>
                    <input
                      type="text"
                      placeholder="ABC1D23"
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Marca / Fabricante
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Honda, Toyota, Fiat"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Modelo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Civic 2.0, Gol 1.6"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Categoria
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    >
                      <option value="Hatch / Sedan">Hatch / Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Caminhonete">Caminhonete</option>
                      <option value="Moto">Moto</option>
                      <option value="Van / Utilitário">Van / Utilitário</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cor
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Prata, Preto"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      KM Atual
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 45000"
                      value={formData.currentKm}
                      onChange={(e) => setFormData({ ...formData, currentKm: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Dados do Cliente */}
      {isEditCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                Alterar Dados do Cliente
              </h3>
              <button
                onClick={() => setIsEditCustomerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={editCustomerData.name}
                    onChange={(e) => setEditCustomerData({ ...editCustomerData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Pessoa
                  </label>
                  <select
                    value={editCustomerData.type}
                    onChange={(e) => setEditCustomerData({ ...editCustomerData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="PF">Pessoa Física (PF)</option>
                    <option value="PJ">Pessoa Jurídica (PJ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={editCustomerData.phone}
                    onChange={(e) => setEditCustomerData({ ...editCustomerData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF / CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={editCustomerData.document}
                    onChange={(e) => setEditCustomerData({ ...editCustomerData, document: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={editCustomerData.birthDate}
                    onChange={(e) => setEditCustomerData({ ...editCustomerData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={editCustomerData.email}
                    onChange={(e) => setEditCustomerData({ ...editCustomerData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    value={editCustomerData.address}
                    onChange={(e) => setEditCustomerData({ ...editCustomerData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações Internas
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais, preferências ou observações sobre o cliente..."
                  value={editCustomerData.notes}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalhes do Cliente & Veículos */}
      {isDetailsModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl my-8">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{selectedCustomer.name}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                    {selectedCustomer.type === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {formatPhone(selectedCustomer.phone)}
                  {selectedCustomer.document && ` • ${formatDocument(selectedCustomer.document)}`}
                  {selectedCustomer.email && ` • ${selectedCustomer.email}`}
                </p>
                {selectedCustomer.address && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {selectedCustomer.address}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canManage && (
                  <button
                    onClick={() => handleOpenEditCustomer(selectedCustomer)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar Dados
                  </button>
                )}
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Veículos Cadastrados */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-600" />
                    Veículos Vinculados ({selectedCustomer.vehicles?.length || 0})
                  </h3>
                  {canManage && (
                    <button
                      onClick={() => setIsAddVehicleModalOpen(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Outro Veículo
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCustomer.vehicles?.map((v: any) => (
                    <div
                      key={v.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                            {formatPlate(v.plate)}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {v.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800">
                          {v.brand} {v.model}
                        </h4>
                        <div className="text-xs text-slate-500 mt-1">
                          KM: <strong className="text-slate-700">{v.currentKm?.toLocaleString() || "0"} km</strong>
                          {v.color && ` • Cor: ${v.color}`}
                          {v.year && ` • Ano: ${v.year}`}
                        </div>
                      </div>

                      {canManage && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleOpenEditVehicle(v)}
                            className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Editar
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteVehicle(v.id, v.plate)}
                            className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Histórico de Ordens de Serviço */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Histórico de Ordens de Serviço (OS)
                </h3>

                {selectedCustomer.serviceOrders?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">Nenhuma OS registrada para este cliente.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCustomer.serviceOrders?.map((os: any) => (
                      <div
                        key={os.id}
                        className="p-3 rounded-xl border border-slate-100 bg-white flex items-center justify-between text-xs hover:border-slate-300 transition-all"
                      >
                        <div>
                          <div className="font-bold text-slate-800">
                            OS #{os.osNumber} - {os.vehicle?.model} ({formatPlate(os.vehicle?.plate)})
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            {formatDateTime(os.createdAt)} • Status: {os.status}
                          </div>
                        </div>
                        <div className="text-right font-extrabold text-slate-900">
                          {formatCurrency(os.grandTotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ações de exclusão */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteCustomer(selectedCustomer.id, selectedCustomer.name)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir Cliente
                </button>

                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Veículo a Cliente Existente */}
      {isAddVehicleModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Novo Veículo para {selectedCustomer.name}
              </h3>
              <button onClick={() => setIsAddVehicleModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Placa *</label>
                <input
                  type="text"
                  required
                  placeholder="ABC1D23"
                  value={vehicleData.plate}
                  onChange={(e) => setVehicleData({ ...vehicleData, plate: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marca</label>
                  <input
                    type="text"
                    placeholder="Honda"
                    value={vehicleData.brand}
                    onChange={(e) => setVehicleData({ ...vehicleData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Modelo</label>
                  <input
                    type="text"
                    placeholder="Civic"
                    value={vehicleData.model}
                    onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria</label>
                  <select
                    value={vehicleData.category}
                    onChange={(e) => setVehicleData({ ...vehicleData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="Hatch / Sedan">Hatch / Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Caminhonete">Caminhonete</option>
                    <option value="Moto">Moto</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">KM Atual</label>
                  <input
                    type="number"
                    placeholder="45000"
                    value={vehicleData.currentKm}
                    onChange={(e) => setVehicleData({ ...vehicleData, currentKm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"
                >
                  {saving ? "Salvando..." : "Salvar Veículo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Veículo Existente */}
      {isEditVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Alterar Veículo
              </h3>
              <button onClick={() => setIsEditVehicleModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateVehicle} className="space-y-3 text-xs">
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Placa *</label>
                <input
                  type="text"
                  required
                  placeholder="ABC1D23"
                  value={editVehicleData.plate}
                  onChange={(e) => setEditVehicleData({ ...editVehicleData, plate: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marca</label>
                  <input
                    type="text"
                    placeholder="Honda"
                    value={editVehicleData.brand}
                    onChange={(e) => setEditVehicleData({ ...editVehicleData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Modelo</label>
                  <input
                    type="text"
                    placeholder="Civic"
                    value={editVehicleData.model}
                    onChange={(e) => setEditVehicleData({ ...editVehicleData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria</label>
                  <select
                    value={editVehicleData.category}
                    onChange={(e) => setEditVehicleData({ ...editVehicleData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="Hatch / Sedan">Hatch / Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Caminhonete">Caminhonete</option>
                    <option value="Moto">Moto</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">KM Atual</label>
                  <input
                    type="number"
                    placeholder="45000"
                    value={editVehicleData.currentKm}
                    onChange={(e) => setEditVehicleData({ ...editVehicleData, currentKm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cor</label>
                  <input
                    type="text"
                    placeholder="Prata"
                    value={editVehicleData.color}
                    onChange={(e) => setEditVehicleData({ ...editVehicleData, color: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ano</label>
                  <input
                    type="number"
                    placeholder="2022"
                    value={editVehicleData.year}
                    onChange={(e) => setEditVehicleData({ ...editVehicleData, year: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditVehicleModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
