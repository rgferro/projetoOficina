"use client";

import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Printer,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Package,
  User,
  Wrench,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatPlate } from "@/lib/formatters";

interface CartItem {
  productId: string;
  name: string;
  brand?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  currentStock: number;
  isService?: boolean;
}

export default function PDVPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [standardServices, setStandardServices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [catalogTab, setCatalogTab] = useState<"ALL" | "PRODUCTS" | "SERVICES">("ALL");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [discount, setDiscount] = useState("0");

  // Modal de Pagamento
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("DINHEIRO");
  const [paidAmount, setPaidAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, custRes, empRes, servRes] = await Promise.all([
        fetch("/api/produtos"),
        fetch("/api/clientes"),
        fetch("/api/equipe"),
        fetch("/api/servicos-padrao"),
      ]);

      const [prodData, custData, empData, servData] = await Promise.all([
        prodRes.json(),
        custRes.json(),
        empRes.json(),
        servRes.json(),
      ]);

      setProducts(Array.isArray(prodData) ? prodData : []);
      setCustomers(Array.isArray(custData) ? custData : []);
      setEmployees(Array.isArray(empData) ? empData.filter((e: any) => e.active) : []);
      setStandardServices(Array.isArray(servData) ? servData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Adicionar produto ao carrinho
  const handleAddToCart = (product: any) => {
    const existing = cart.find((i) => i.productId === product.id);

    if (existing) {
      if (existing.quantity >= product.currentStock) {
        alert(`Estoque insuficiente! Apenas ${product.currentStock} unidades disponíveis.`);
        return;
      }
      setCart(
        cart.map((i) =>
          i.productId === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                totalPrice: (i.quantity + 1) * i.unitPrice,
              }
            : i
        )
      );
    } else {
      if (product.currentStock <= 0) {
        alert("Produto sem estoque disponível!");
        return;
      }
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          brand: product.brand,
          unitPrice: product.salePrice,
          quantity: 1,
          totalPrice: product.salePrice,
          currentStock: product.currentStock,
          isService: false,
        },
      ]);
    }
  };

  // Adicionar serviço ao carrinho
  const handleAddServiceToCart = (serv: any) => {
    const serviceKey = `serv-${serv.id}`;
    const existing = cart.find((i) => i.productId === serviceKey);

    if (existing) {
      setCart(
        cart.map((i) =>
          i.productId === serviceKey
            ? {
                ...i,
                quantity: i.quantity + 1,
                totalPrice: (i.quantity + 1) * i.unitPrice,
              }
            : i
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: serviceKey,
          name: `[Serviço] ${serv.name}`,
          brand: serv.category || "Mão de Obra",
          unitPrice: serv.defaultPrice,
          quantity: 1,
          totalPrice: serv.defaultPrice,
          currentStock: 9999,
          isService: true,
        },
      ]);
    }
  };

  // Atualizar quantidade no carrinho
  const handleUpdateQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(cart.filter((i) => i.productId !== productId));
      return;
    }

    const item = cart.find((i) => i.productId === productId);
    if (item && !item.isService && newQty > item.currentStock) {
      alert(`Quantidade excede o estoque disponível (${item.currentStock}).`);
      return;
    }

    setCart(
      cart.map((i) =>
        i.productId === productId
          ? {
              ...i,
              quantity: newQty,
              totalPrice: newQty * i.unitPrice,
            }
          : i
      )
    );
  };

  // Remover item
  const handleRemoveItem = (productId: string) => {
    setCart(cart.filter((i) => i.productId !== productId));
  };

  // Totais
  const subtotal = cart.reduce((sum, i) => sum + i.totalPrice, 0);
  const discountNum = Number(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discountNum);

  const paidNum = Number(paidAmount) || grandTotal;
  const changeNum = Math.max(0, paidNum - grandTotal);

  // Abrir checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setPaidAmount(String(grandTotal));
    setIsCheckoutModalOpen(true);
  };

  // Finalizar venda
  const handleConfirmSale = async () => {
    setSaving(true);
    try {
      const payload = {
        customerId: selectedCustomerId || null,
        employeeId: selectedEmployeeId || null,
        items: cart.map((i) => ({
          productId: i.productId.startsWith("serv-") ? null : i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        })),
        discount: discountNum,
        paymentMethod,
        paidAmount: paidNum,
      };

      const res = await fetch("/api/pdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const sale = await res.json();
        setCompletedSale(sale);
        setCart([]);
        setDiscount("0");
        setIsCheckoutModalOpen(false);
        loadData(); // Atualiza estoque em tempo real
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao registrar venda");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setSaving(false);
    }
  };

  // Filtragem de produtos e serviços
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.includes(search)) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredServices = standardServices.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            PDV Balcão • Caixa & Vendas Rápidas
          </h1>
          <p className="text-sm text-slate-500">
            Realize vendas de peças, produtos e serviços cadastrados com cálculo automático de troco e baixa de estoque.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Coluna 1 & 2: Catálogo de Produtos e Serviços */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barra de Busca e Leitor de Código de Barras */}
          <div className="relative">
            <Barcode className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por Nome, Código de Barras (EAN), SKU, Marca ou Serviço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm font-medium"
            />
          </div>

          {/* Alternador de Abas: Todos vs Peças vs Serviços */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCatalogTab("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                catalogTab === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Todos ({products.length + standardServices.length})
            </button>
            <button
              onClick={() => setCatalogTab("PRODUCTS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                catalogTab === "PRODUCTS"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Peças & Estoque ({products.length})
            </button>
            <button
              onClick={() => setCatalogTab("SERVICES")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                catalogTab === "SERVICES"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Serviços Cadastrados ({standardServices.length})
            </button>
          </div>

          {/* Grade de Itens */}
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-xs">Carregando catálogo...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
              {/* SERVIÇOS CADASTRADOS */}
              {(catalogTab === "ALL" || catalogTab === "SERVICES") &&
                filteredServices.map((serv) => (
                  <div
                    key={`serv-${serv.id}`}
                    onClick={() => handleAddServiceToCart(serv)}
                    className="bg-white rounded-xl border border-blue-100 hover:border-blue-500 p-3.5 flex flex-col justify-between transition-all select-none hover:shadow-md cursor-pointer active:scale-95 group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider truncate">
                          {serv.category || "Serviço"}
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          Mão de Obra
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight">
                        {serv.name}
                      </h4>
                      {serv.estimatedMinutes > 0 && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          ⏱️ ~{serv.estimatedMinutes} min
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-blue-600">
                        {formatCurrency(serv.defaultPrice)}
                      </span>
                      <button
                        type="button"
                        className="p-1 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

              {/* PRODUTOS DO ESTOQUE */}
              {(catalogTab === "ALL" || catalogTab === "PRODUCTS") &&
                filteredProducts.map((prod) => {
                  const isOutOfStock = prod.currentStock <= 0;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => !isOutOfStock && handleAddToCart(prod)}
                      className={`bg-white rounded-xl border p-3.5 flex flex-col justify-between transition-all select-none ${
                        isOutOfStock
                          ? "opacity-50 border-slate-200 cursor-not-allowed bg-slate-50"
                          : "border-slate-200/90 hover:border-blue-500 hover:shadow-md cursor-pointer active:scale-95"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                            {prod.brand || prod.category}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                              prod.currentStock <= prod.minStock
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {prod.currentStock} {prod.unit}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight">
                          {prod.name}
                        </h4>
                        {prod.sku && (
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            SKU: {prod.sku}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-black text-blue-600">
                          {formatCurrency(prod.salePrice)}
                        </span>
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Coluna 3: Carrinho e Checkout */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between h-full min-h-[600px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Carrinho ({cart.reduce((s, i) => s + i.quantity, 0)})
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Identificação de Cliente & Vendedor */}
            <div className="space-y-2">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="">Consumidor Final (Sem cadastro)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>

              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="">Vendedor / Atendente</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Lista de Itens no Carrinho */}
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  O carrinho está vazio.<br />Clique em um produto ou serviço para adicionar.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-slate-900 line-clamp-1">{item.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {formatCurrency(item.unitPrice)} un
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                        className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold w-5 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                        className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right pl-2 min-w-[70px]">
                      <div className="font-black text-slate-900">
                        {formatCurrency(item.totalPrice)}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="text-[10px] text-rose-500 hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subtotal, Desconto e Total Final */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Desconto (R$):</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-20 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-right font-bold text-xs"
                />
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-100">
                <span>Total a Pagar:</span>
                <span className="text-blue-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Finalizar Venda (F2)
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE PAGAMENTO / CHECKOUT */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Forma de Pagamento</h3>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <span className="text-xs text-blue-700 font-bold uppercase">Total da Venda</span>
              <div className="text-3xl font-black text-blue-900 mt-0.5">
                {formatCurrency(grandTotal)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: "DINHEIRO", label: "Dinheiro", icon: Banknote },
                { id: "PIX", label: "PIX", icon: QrCode },
                { id: "CARTAO_CREDITO", label: "Cartão de Crédito", icon: CreditCard },
                { id: "CARTAO_DEBITO", label: "Cartão de Débito", icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border font-bold flex items-center gap-2 transition-all ${
                      paymentMethod === m.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {paymentMethod === "DINHEIRO" && (
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Valor Recebido (R$):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-right font-bold text-sm"
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Troco a Devolver:</span>
                  <span className="text-sm font-black text-emerald-600">
                    {formatCurrency(changeNum)}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={handleConfirmSale}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? "Registrando..." : "Confirmar e Emitir Comprovante"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE COMPROVANTE APÓS VENDA */}
      {completedSale && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-slate-900">Venda Concluída com Sucesso!</h3>
            <p className="text-xs text-slate-500">
              Venda <strong>#{completedSale.saleNumber}</strong> no valor de{" "}
              <strong>{formatCurrency(completedSale.finalAmount)}</strong>
            </p>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Imprimir Cupom
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
