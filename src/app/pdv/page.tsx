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
}

export default function PDVPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
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
      const [prodRes, custRes, empRes] = await Promise.all([
        fetch("/api/produtos"),
        fetch("/api/clientes"),
        fetch("/api/equipe"),
      ]);

      const [prodData, custData, empData] = await Promise.all([
        prodRes.json(),
        custRes.json(),
        empRes.json(),
      ]);

      setProducts(prodData);
      setCustomers(custData);
      setEmployees(empData.filter((e: any) => e.active));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Adicionar ao carrinho
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
    if (item && newQty > item.currentStock) {
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
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
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

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Erro ao concluir venda");

      setCompletedSale(resData);
      setCart([]);
      setDiscount("0");
      setSelectedCustomerId("");
      loadData(); // Atualiza estoques
    } catch (err: any) {
      alert(err.message || "Falha na venda");
    } finally {
      setSaving(false);
    }
  };

  // Filtro de produtos
  const filteredProducts = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            PDV Rápido (Venda de Balcão)
          </h1>
          <p className="text-sm text-slate-500">
            Venda peças, óleos e acessórios com leitor de código de barras, baixa de estoque e emissão de cupom.
          </p>
        </div>
      </div>

      {/* Layout PDV: Grade de Produtos (Esquerda) + Carrinho (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Busca e Grade de Produtos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barra de Busca / Scanner */}
          <div className="relative">
            <Barcode className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Escanear Código de Barras (EAN) ou Buscar por Nome, SKU, Marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm font-medium"
            />
          </div>

          {/* Grade de Produtos */}
          {loading ? (
            <div className="text-center py-16 text-slate-400">Carregando catálogo de peças...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhum produto encontrado</p>
              <p className="text-xs text-slate-500 mt-1">Verifique o termo de busca ou cadastre novas peças no Estoque.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredProducts.map((prod) => {
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
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Cupom de Venda</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {cart.length} {cart.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {/* Vendedor e Cliente */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                  Vendedor
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="">Balcão Geral</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                  Cliente (Opcional)
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs truncate"
                >
                  <option value="">Consumidor Final</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista do Carrinho */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 font-medium">
                  Carrinho vazio. Clique em um produto para adicionar.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {formatCurrency(item.unitPrice)} un.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                        className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                        className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="w-16 text-right font-black text-slate-900 pl-2">
                      {formatCurrency(item.totalPrice)}
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      className="p-1 text-slate-400 hover:text-red-600 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Resumo e Botão de Finalizar */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Desconto (R$):</span>
                <input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-20 p-1 border border-slate-200 rounded-lg text-right font-bold text-xs"
                />
              </div>

              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>TOTAL A PAGAR:</span>
                <span className="text-xl text-blue-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              Cobrar & Finalizar Venda (F2)
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Pagamento e Troco */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">Finalizar Venda de Balcão</h3>
              <button onClick={() => setIsCheckoutModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-xl text-center">
              <span className="text-xs text-slate-400 block font-semibold">Total a Pagar</span>
              <span className="text-3xl font-black text-emerald-400">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "DINHEIRO", label: "Dinheiro", icon: Banknote },
                  { id: "PIX", label: "PIX", icon: QrCode },
                  { id: "CARTAO_CREDITO", label: "Cartão Crédito", icon: CreditCard },
                  { id: "CARTAO_DEBITO", label: "Cartão Débito", icon: CreditCard },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSel = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-xl border flex items-center gap-2 font-bold transition-all ${
                        isSel
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSel ? "text-emerald-600" : "text-slate-400"}`} />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === "DINHEIRO" && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-amber-900 block mb-1">Valor Recebido (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full p-2 border border-amber-300 rounded-lg font-black text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-amber-900 block mb-1">Troco a Devolver</label>
                  <div className="text-xl font-black text-amber-900 pt-1">
                    {formatCurrency(changeNum)}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmSale}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                {saving ? "Processando..." : "Confirmar Venda & Baixar Estoque"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Comprovante de Venda Concluída */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">Venda Concluída!</h3>
              <p className="text-xs text-slate-500">Cupom de Balcão #{completedSale.saleNumber}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 text-left">
              <div className="flex justify-between font-bold">
                <span>Total Pago:</span>
                <span>{formatCurrency(completedSale.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Forma de Pagto:</span>
                <span>{completedSale.paymentMethod}</span>
              </div>
              {completedSale.changeAmount > 0 && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Troco Entregue:</span>
                  <span>{formatCurrency(completedSale.changeAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
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
