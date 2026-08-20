"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  FileCode,
  AlertTriangle,
  ArrowUpDown,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  X,
  Upload,
  CheckCircle2,
  Building,
  Lock,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useAuth } from "@/lib/authContext";

export default function EstoquePage() {
  const { currentEmployee, currentPlan } = useAuth();
  const isElite = currentPlan === "ELITE";
  const isFinancialPrivileged =
    !currentEmployee ||
    currentEmployee.accessLevel === "ADMIN" ||
    currentEmployee.accessLevel === "GERENTE" ||
    currentEmployee.accessLevel === "ATENDENTE";

  const isCostPrivileged =
    !currentEmployee ||
    currentEmployee.accessLevel === "ADMIN" ||
    currentEmployee.accessLevel === "GERENTE";

  // Somente ADMIN e GERENTE podem criar, editar e excluir produtos do estoque
  const canManage =
    !currentEmployee ||
    currentEmployee.accessLevel === "ADMIN" ||
    currentEmployee.accessLevel === "GERENTE";

  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("TODAS");

  // Modais
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);

  // Form states - Produto
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    brand: "",
    category: "Peças Gerais",
    unit: "UN",
    costPrice: "",
    profitMargin: "50",
    salePrice: "",
    currentStock: "",
    minStock: "2",
    shelfLocation: "",
    supplierId: "",
    notes: "",
  });

  // XML Import states
  const [xmlContent, setXmlContent] = useState("");
  const [defaultMargin, setDefaultMargin] = useState("50");
  const [generatePayable, setGeneratePayable] = useState(true);
  const [xmlLoading, setXmlLoading] = useState(false);
  const [xmlResult, setXmlResult] = useState<any>(null);

  const [saving, setSaving] = useState(false);

  const categories = [
    "TODAS",
    "Lubrificantes",
    "Filtros",
    "Freios",
    "Suspensão",
    "Motor",
    "Elétrica & Iluminação",
    "Arrefecimento",
    "Acessórios",
    "Pneus",
    "Peças Gerais",
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const url = `/api/produtos?q=${encodeURIComponent(search)}&lowStock=${lowStockOnly}&category=${selectedCategory}`;
      const [prodRes, supRes] = await Promise.all([
        fetch(url),
        fetch("/api/fornecedores"),
      ]);

      const [prodData, supData] = await Promise.all([
        prodRes.json(),
        supRes.json(),
      ]);

      setProducts(prodData);
      setSuppliers(supData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(delay);
  }, [search, lowStockOnly, selectedCategory]);

  // Abre modal de criação
  const handleOpenNew = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      sku: "",
      barcode: "",
      brand: "",
      category: "Peças Gerais",
      unit: "UN",
      costPrice: "",
      profitMargin: "50",
      salePrice: "",
      currentStock: "0",
      minStock: "2",
      shelfLocation: "",
      supplierId: "",
      notes: "",
    });
    setIsProductModalOpen(true);
  };

  // Abre modal de edição
  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku || "",
      barcode: p.barcode || "",
      brand: p.brand || "",
      category: p.category || "Peças Gerais",
      unit: p.unit || "UN",
      costPrice: String(p.costPrice || 0),
      profitMargin: String(p.profitMargin || 50),
      salePrice: String(p.salePrice || 0),
      currentStock: String(p.currentStock || 0),
      minStock: String(p.minStock || 2),
      shelfLocation: p.shelfLocation || "",
      supplierId: p.supplierId || "",
      notes: p.notes || "",
    });
    setIsProductModalOpen(true);
  };

  // Auto-cálculo de preço de venda ao mudar custo ou margem
  const handleCostOrMarginChange = (costVal: string, marginVal: string) => {
    const cost = parseFloat(costVal) || 0;
    const margin = parseFloat(marginVal) || 0;
    const calculatedSale = cost * (1 + margin / 100);

    setProductForm((prev) => ({
      ...prev,
      costPrice: costVal,
      profitMargin: marginVal,
      salePrice: calculatedSale > 0 ? calculatedSale.toFixed(2) : prev.salePrice,
    }));
  };

  // Salvar Produto
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingProduct ? `/api/produtos/${editingProduct.id}` : "/api/produtos";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");

      setIsProductModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Deletar produto
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o produto "${name}" do estoque?`)) return;
    try {
      await fetch(`/api/produtos/${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      alert("Erro ao excluir produto");
    }
  };

  // Leitura de arquivo XML local
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setXmlContent(content);
    };
    reader.readAsText(file);
  };

  // Submeter importação de XML
  const handleImportXML = async () => {
    if (!xmlContent) {
      alert("Selecione ou cole o arquivo XML da NF-e");
      return;
    }

    setXmlLoading(true);
    setXmlResult(null);

    try {
      const res = await fetch("/api/produtos/importar-xml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xmlContent,
          defaultProfitMargin: Number(defaultMargin) || 50,
          generateAccountPayable: generatePayable,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na importação");

      setXmlResult(data);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setXmlLoading(false);
    }
  };

  // Métricas de Estoque
  const totalItemsCount = products.reduce((sum, p) => sum + p.currentStock, 0);
  const totalCostValue = products.reduce((sum, p) => sum + p.currentStock * p.costPrice, 0);
  const totalSaleValue = products.reduce((sum, p) => sum + p.currentStock * p.salePrice, 0);
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-blue-600" />
            Controle de Estoque & Peças
          </h1>
          <p className="text-sm text-slate-500">
            Cadastre peças, acompanhe alertas de estoque mínimo e importe notas fiscais eletrônicas (XML NF-e).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {canManage ? (
            <>
              {isElite ? (
                <button
                  id="estoque-xml-btn"
                  onClick={() => {
                    setXmlResult(null);
                    setXmlContent("");
                    setIsXmlModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs sm:text-sm border border-purple-200 transition-all shadow-sm"
                >
                  <FileCode className="w-4 h-4 text-purple-600" />
                  Importar XML de NF-e
                </button>
              ) : (
                <Link
                  href="/assinatura"
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all shadow-sm"
                  title="Importador de XML de NF-e disponível no Plano Oficina Elite"
                >
                  <Lock className="w-3.5 h-3.5 text-purple-600" />
                  <span>Importar XML (Elite)</span>
                </Link>
              )}

              <button
                id="estoque-new-btn"
                onClick={handleOpenNew}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Novo Produto
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs">
              <Lock className="w-3.5 h-3.5" />
              Somente Consulta
            </span>
          )}
        </div>
      </div>

      {/* Cards de Métricas do Estoque */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isCostPrivileged ? "lg:grid-cols-4" : "lg:grid-cols-2"} gap-4`}>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Catálogo de Peças
            </span>
            <span className="text-2xl font-black text-slate-900">{products.length} itens</span>
            <p className="text-xs text-slate-500 mt-1">{totalItemsCount} unidades no total</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {isCostPrivileged && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Valor Imobilizado (Custo)
              </span>
              <span className="text-2xl font-black text-slate-800">
                {formatCurrency(totalCostValue)}
              </span>
              <p className="text-xs text-slate-500 mt-1">Capital investido em estoque</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        )}

        {isCostPrivileged && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Valor Potencial de Venda
              </span>
              <span className="text-2xl font-black text-emerald-600">
                {formatCurrency(totalSaleValue)}
              </span>
              <p className="text-xs text-emerald-700 font-semibold mt-1">
                Lucro Estimado: {formatCurrency(totalSaleValue - totalCostValue)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        )}

        <div
          id="estoque-critical-alert"
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`rounded-2xl p-5 border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            lowStockOnly
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400"
              : "bg-white border-slate-200 hover:border-amber-300"
          }`}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block mb-1">
              Estoque Baixo (Reposição)
            </span>
            <span className="text-2xl font-black text-amber-700">{lowStockCount} itens</span>
            <p className="text-xs text-amber-800 mt-1">
              {lowStockOnly ? "Filtrando estoque crítico ✓" : "Clique para filtrar"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="estoque-search-input"
            type="text"
            placeholder="Buscar por nome da peça, SKU, código de barras ou fabricante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
          />
        </div>

        {/* Categorias */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              Categoria: {c}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela de Produtos */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Carregando estoque...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">Nenhum produto encontrado no estoque</h3>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre suas peças ou importe um XML de NF-e para alimentar o estoque.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Peça / Descrição</th>
                  <th className="py-3 px-4">Código / SKU</th>
                  <th className="py-3 px-4">Categoria / Marca</th>
                  <th className="py-3 px-4 text-center">Estoque Atual</th>
                  {isCostPrivileged && <th className="py-3 px-4 text-right">Preço Custo</th>}
                  {isFinancialPrivileged && <th className="py-3 px-4 text-right">Preço Venda</th>}
                  {canManage && <th className="py-3 px-4 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const isLow = p.currentStock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                        {p.shelfLocation && (
                          <span className="text-[10px] text-slate-500 font-semibold">
                            📍 {p.shelfLocation}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 font-semibold">
                        <div>{p.sku || "-"}</div>
                        {p.barcode && <div className="text-[10px] text-slate-400">{p.barcode}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] block w-max mb-0.5">
                          {p.category}
                        </span>
                        <span className="text-slate-500 text-[11px]">{p.brand || "-"}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-black text-xs ${
                            isLow
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                          }`}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                        {isLow && (
                          <span className="block text-[9px] text-amber-700 font-bold mt-0.5">
                            Mín: {p.minStock}
                          </span>
                        )}
                      </td>
                      {isCostPrivileged && (
                        <td className="py-3 px-4 text-right text-slate-600 font-mono">
                          {formatCurrency(p.costPrice)}
                        </td>
                      )}
                      {isFinancialPrivileged && (
                        <td className="py-3 px-4 text-right font-black text-slate-900 text-sm font-mono">
                          {formatCurrency(p.salePrice)}
                          {isCostPrivileged && (
                            <span className="block text-[9px] text-emerald-600 font-bold">
                              +{p.profitMargin}% margem
                            </span>
                          )}
                        </td>
                      )}
                      {canManage && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Cadastro / Edição de Produto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                {editingProduct ? "Editar Peça / Produto" : "Novo Produto no Estoque"}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome da Peça / Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Jogo de Pastilhas de Freio Dianteiras"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código SKU / Ref.</label>
                  <input
                    type="text"
                    placeholder="PST-042"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código de Barras (EAN)</label>
                  <input
                    type="text"
                    placeholder="7891234560011"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fabricante / Marca</label>
                  <input
                    type="text"
                    placeholder="Bosch, Fras-le"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  >
                    {categories.filter((c) => c !== "TODAS").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unidade de Medida</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  >
                    <option value="UN">Unidade (UN)</option>
                    <option value="L">Litro (L)</option>
                    <option value="PAR">Par (PAR)</option>
                    <option value="JG">Jogo (JG)</option>
                    <option value="KG">Quilo (KG)</option>
                  </select>
                </div>
              </div>

              {/* Preços e Margem */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    value={productForm.costPrice}
                    onChange={(e) => handleCostOrMarginChange(e.target.value, productForm.profitMargin)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Margem Lucro (%)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="50"
                    value={productForm.profitMargin}
                    onChange={(e) => handleCostOrMarginChange(productForm.costPrice, e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-blue-700 block mb-1">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="75.00"
                    value={productForm.salePrice}
                    onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
                    className="w-full p-2 border border-blue-300 rounded-xl font-black text-blue-700 bg-white"
                  />
                </div>
              </div>

              {/* Quantidades e Localização */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estoque Atual</label>
                  <input
                    type="number"
                    step="1"
                    value={productForm.currentStock}
                    onChange={(e) => setProductForm({ ...productForm, currentStock: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    step="1"
                    value={productForm.minStock}
                    onChange={(e) => setProductForm({ ...productForm, minStock: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prateleira / Local</label>
                  <input
                    type="text"
                    placeholder="Ex: Prateleira B2"
                    value={productForm.shelfLocation}
                    onChange={(e) => setProductForm({ ...productForm, shelfLocation: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fornecedor Principal</label>
                <select
                  value={productForm.supplierId}
                  onChange={(e) => setProductForm({ ...productForm, supplierId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                >
                  <option value="">Nenhum / Cadastrado Avulso</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {saving ? "Salvando..." : "Salvar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Importação de XML de NF-e */}
      {isXmlModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-6 h-6 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Importador de XML de Nota Fiscal (NF-e)
                </h3>
              </div>
              <button onClick={() => setIsXmlModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {!xmlResult ? (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600">
                  Carregue o arquivo <code className="text-purple-600">.xml</code> da nota fiscal de compra fornecida pelo distribuidor de peças. O sistema cadastra novos produtos automaticamente ou soma ao estoque dos existentes com atualização de preço de custo.
                </p>

                {/* Área de Upload */}
                <div className="border-2 border-dashed border-purple-200 rounded-2xl p-6 text-center bg-purple-50/40 hover:bg-purple-50 transition-colors">
                  <Upload className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <label className="cursor-pointer font-bold text-purple-700 hover:underline block">
                    <span>Clique para selecionar o arquivo XML da NF-e</span>
                    <input
                      type="file"
                      accept=".xml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {xmlContent ? "✓ Arquivo XML carregado na memória!" : "Formatos suportados: XML padrão NF-e 4.0"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Margem de Lucro Padrão para novos itens (%)
                    </label>
                    <input
                      type="number"
                      value={defaultMargin}
                      onChange={(e) => setDefaultMargin(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="genPayable"
                      checked={generatePayable}
                      onChange={(e) => setGeneratePayable(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <label htmlFor="genPayable" className="font-semibold text-slate-700 cursor-pointer">
                      Gerar Conta a Pagar automaticamente
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsXmlModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!xmlContent || xmlLoading}
                    onClick={handleImportXML}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20 disabled:opacity-50"
                  >
                    {xmlLoading ? "Processando XML..." : "Processar e Alimentar Estoque"}
                  </button>
                </div>
              </div>
            ) : (
              /* Resultado da Importação */
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Importação Concluída com Sucesso!</h4>
                    <p className="mt-0.5">
                      NF-e nº <strong>{xmlResult.invoiceNumber}</strong> • Fornecedor: <strong>{xmlResult.supplierName}</strong>
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      {xmlResult.totalItemsImported} itens processados | Valor Total: {formatCurrency(xmlResult.totalInvoiceAmount)}
                    </p>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5">
                  {xmlResult.results?.map((res: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-[11px]"
                    >
                      <span className="font-bold text-slate-800">{res.product.name}</span>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800">
                        {res.action}: +{res.importedQty} un.
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsXmlModalOpen(false);
                      setXmlResult(null);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
