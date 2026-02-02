'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, DollarSign, Plus, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { ProductSheet } from "@/components/products/ProductSheet";
import { ProductDeleteDialog } from "@/components/products/ProductDeleteDialog";
import { BulkDeleteProductsDialog } from "@/components/products/BulkDeleteProductsDialog";
import { BulkActionBar } from "@/components/products/BulkActionBar";
import { cn } from "@/lib/utils";
import type { ProductFormValues } from "@/lib/validations/product";
import { useI18n } from '@/locales/client';

interface Product {
  id: string;
  name: string;
  sapCode?: string;
  barcode?: string;
  sku?: string | null;
  unitPrice: number;
  unit: string;
  vatRate: number;
  currentPrice: number;
  priceWithVat: number;
  hasCustomerPrice: boolean;
  description?: string;
  isActive: boolean;
  customerPrice?: number;
}

interface Customer {
  id: string;
  name: string;
  customerCode: string;
}

export default function ProductsPage() {
  const t = useI18n();
  const [activeTab, setActiveTab] = useState<'products' | 'pricing'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [pricingProducts, setPricingProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  const [editingVat, setEditingVat] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // New state for CRUD operations
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | 'view'>('create');
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, [selectedCustomer]);

  // Load products for customer pricing tab
  useEffect(() => {
    if (!selectedCustomerId) {
      setPricingProducts([]);
      return;
    }

    setPricingLoading(true);
    setMessage('');
    fetch(`/api/admin/customer-prices?customerId=${selectedCustomerId}`)
      .then(res => res.json())
      .then(data => {
        setPricingProducts(data);
        setPricingLoading(false);
      })
      .catch(err => {
        console.error('Error loading products:', err);
        setPricingLoading(false);
      });
  }, [selectedCustomerId]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const url = selectedCustomer
        ? `/api/products?customerId=${selectedCustomer}`
        : '/api/products';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditPrice = (product: Product) => {
    setEditingProduct(product);
    setEditingPrice(product.currentPrice.toString());
    setEditingVat(product.vatRate.toString());
  };

  const savePrice = async () => {
    if (!editingProduct) return;

    const newPrice = parseFloat(editingPrice);
    const newVat = parseFloat(editingVat);

    if (isNaN(newPrice) || newPrice <= 0) {
      alert('Invalid price');
      return;
    }

    try {
      if (selectedCustomer) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: selectedCustomer,
            unitPrice: newPrice,
          }),
        });
      } else {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...editingProduct,
            unitPrice: newPrice,
            vatRate: newVat,
          }),
        });
      }

      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      alert('Failed to save price');
    }
  };

  // Customer pricing functions
  const handlePriceChange = (productId: string, value: string) => {
    setPricingProducts(pricingProducts.map(p =>
      p.id === productId
        ? { ...p, customerPrice: value ? parseFloat(value) : undefined }
        : p
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const prices = pricingProducts
      .filter(p => p.customerPrice !== undefined)
      .map(p => ({
        productId: p.id,
        unitPrice: p.customerPrice!,
      }));

    try {
      const res = await fetch('/api/admin/customer-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          prices,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ Сохранено ${data.count} цен для клиента`);
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(`❌ Ошибка: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Ошибка: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUseDefaultPrices = () => {
    setPricingProducts(pricingProducts.map(p => ({
      ...p,
      customerPrice: p.unitPrice,
    })));
  };

  const handleClearCustomPrices = () => {
    setPricingProducts(pricingProducts.map(p => ({
      ...p,
      customerPrice: undefined,
    })));
  };

  // Filter products for products tab
  const filteredProducts = useMemo(() => {
    if (!productSearchQuery) return products;

    const query = productSearchQuery.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.sapCode && p.sapCode.toLowerCase().includes(query)) ||
      (p.barcode && p.barcode.toLowerCase().includes(query))
    );
  }, [products, productSearchQuery]);

  // Filter products for pricing tab
  const filteredPricingProducts = useMemo(() => {
    if (!searchQuery) return pricingProducts;

    const query = searchQuery.toLowerCase();
    return pricingProducts.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.sku && p.sku.toLowerCase().includes(query))
    );
  }, [pricingProducts, searchQuery]);

  // Calculate statistics for pricing tab
  const stats = useMemo(() => {
    const customPriced = pricingProducts.filter(p => p.customerPrice !== undefined).length;
    const totalProducts = pricingProducts.length;
    const avgDiscount = pricingProducts
      .filter(p => p.customerPrice !== undefined)
      .reduce((sum, p) => {
        const discount = ((p.unitPrice - p.customerPrice!) / p.unitPrice) * 100;
        return sum + discount;
      }, 0) / (customPriced || 1);

    return {
      customPriced,
      totalProducts,
      avgDiscount: avgDiscount.toFixed(1),
      hasChanges: customPriced > 0,
    };
  }, [pricingProducts]);

  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);

  // CRUD Handlers
  const handleCreateNew = () => {
    setCurrentProduct(null);
    setSheetMode('create');
    setSheetOpen(true);
  };

  const handleView = (product: Product) => {
    setCurrentProduct(product);
    setSheetMode('view');
    setSheetOpen(true);
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setSheetMode('edit');
    setSheetOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleProductSave = async (data: ProductFormValues) => {
    try {
      if (sheetMode === 'create') {
        // Create new product
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create product');
        }

        alert('✅ Product created successfully');
      } else if (sheetMode === 'edit' && currentProduct) {
        // Update existing product
        const response = await fetch(`/api/products/${currentProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update product');
        }

        alert('✅ Product updated successfully');
      }

      // Refresh products list
      await fetchProducts();
      setSheetOpen(false);
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/products/${deletingProduct.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }

      alert('✅ Product deleted successfully');
      await fetchProducts();
      setDeleteDialogOpen(false);
      setDeletingProduct(null);
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProducts }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete products');
      }

      const result = await response.json();
      alert(`✅ ${result.count} products deleted successfully`);
      await fetchProducts();
      setBulkDeleteDialogOpen(false);
      setSelectedProducts([]);
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleRow = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">{t('Products.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 tracking-tight">📦 {t('Products.title')}</h1>
          <p className="text-sm text-slate-600">{t('Products.subtitle')}</p>
        </div>

        {/* Tab Interface */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'products' | 'pricing')} className="w-full">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-4 overflow-hidden sticky top-0 z-20">
            <TabsList className="w-full h-auto bg-transparent p-0 grid grid-cols-2 rounded-none">
              <TabsTrigger
                value="products"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-600 data-[state=active]:bg-sky-50/30 px-4 py-3 text-sm font-semibold transition-all data-[state=active]:text-sky-700 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>{t('Products.tabs.productList')} ({products.length})</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="pricing"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-600 data-[state=active]:bg-sky-50/30 px-4 py-3 text-sm font-semibold transition-all data-[state=active]:text-sky-700 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{t('Products.tabs.customerPricing')}</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-0 space-y-3">
            {/* Header with New Product Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t('Products.management')}</h2>
                <p className="text-xs text-slate-500">{t('Products.managementSubtitle')}</p>
              </div>
              <Button
                onClick={handleCreateNew}
                size="sm"
                className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm gap-2 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('Products.newProduct')}
              </Button>
            </div>

            {/* Customer Filter */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
              <div className="flex items-center gap-3">
                <div className="bg-sky-100 rounded-full p-2">
                  <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <label className="text-xs font-medium text-slate-900 whitespace-nowrap">
                    {t('Products.customerFilter.title')}:
                  </label>
                  <div className="flex-1">
                    <select
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      className="w-full max-w-xl px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-900 font-medium hover:bg-white transition-all focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
                    >
                      <option value="">{t('Products.customerFilter.basePrice')}</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} {customer.customerCode && `(${customer.customerCode})`}
                        </option>
                      ))}
                    </select>
                    {selectedCustomer && (
                      <p className="mt-1 text-xs text-sky-600 font-medium ml-1">
                        💎 {t('Products.customerFilter.customPriceNote')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`🔍 ${t('Products.searchPlaceholder')}`}
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 pl-9 bg-slate-50 border border-slate-200 rounded text-sm text-slate-900 placeholder:text-slate-500 hover:bg-white transition-all focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
                />
                <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Products Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                <table className="min-w-full w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="sticky left-0 z-10 bg-slate-50/95 backdrop-blur-sm px-2 py-1 w-8">
                        <Checkbox
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onCheckedChange={toggleAll}
                          aria-label="Select all products"
                          className="h-3.5 w-3.5"
                        />
                      </th>
                      <th className="px-2 py-1 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">{t('Products.table.product')}</th>
                      <th className="px-2 py-1 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">{t('Products.table.sapCode')}</th>
                      <th className="px-2 py-1 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">{t('Products.table.barcode')}</th>
                      <th className="px-2 py-1 text-right text-[10px] font-bold text-slate-700 uppercase tracking-wider">{t('Products.table.priceWithoutVat')}</th>
                      <th className="px-2 py-1 text-right text-[10px] font-bold text-slate-700 uppercase tracking-wider">{t('Products.table.vatPercent')}</th>
                      <th className="px-2 py-1 text-right text-[10px] font-bold text-slate-700 uppercase tracking-wider">{t('Products.table.priceWithVat')}</th>
                      <th className="px-2 py-1 text-center text-[10px] font-bold text-slate-700 uppercase tracking-wider w-20">{t('Products.table.actions')}</th>
                      <th className="px-2 py-1 text-center text-[10px] font-bold text-slate-700 uppercase tracking-wider w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredProducts.map((product) => {
                      const isSelected = selectedProducts.includes(product.id);
                      return (
                        <tr
                          key={product.id}
                          className={cn(
                            "border-b border-slate-100 hover:bg-slate-50/50 transition-colors group text-xs",
                            isSelected && "bg-sky-50/30"
                          )}
                        >
                          <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 px-2 py-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleRow(product.id)}
                              aria-label={`Select ${product.name}`}
                              className="h-3.5 w-3.5"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-1.5">
                              {product.hasCustomerPrice && (
                                <span className="text-sky-600 text-[10px]">💎</span>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate max-w-[220px]" title={product.name}>{product.name}</div>
                                {product.hasCustomerPrice && (
                                  <span className="inline-flex items-center px-1 py-0 rounded text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 mt-0.5 leading-none">
                                    {t('Products.table.customPrice')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-1">
                            <span className="text-[10px] font-mono font-medium text-slate-600">{product.sapCode || '—'}</span>
                          </td>
                          <td className="px-2 py-1">
                            <span className="text-[10px] font-mono font-medium text-slate-600">{product.barcode || '—'}</span>
                          </td>
                          <td className="px-2 py-1 text-right">
                            {editingProduct?.id === product.id ? (
                              <input
                                type="number"
                                value={editingPrice}
                                onChange={(e) => setEditingPrice(e.target.value)}
                                className="w-24 px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-right font-semibold text-slate-900 hover:bg-white transition-all focus:ring-1 focus:ring-sky-600 focus:border-sky-600 h-6"
                                step="0.01"
                              />
                            ) : (
                              <span className="text-xs font-bold text-slate-900 tabular-nums">
                                {product.currentPrice.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{' '}
                                <span className="text-[10px] text-slate-500 font-normal">сўм</span>
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1 text-right">
                            {editingProduct?.id === product.id && !selectedCustomer ? (
                              <input
                                type="number"
                                value={editingVat}
                                onChange={(e) => setEditingVat(e.target.value)}
                                className="w-12 px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-right font-semibold text-slate-900 hover:bg-white transition-all focus:ring-1 focus:ring-sky-600 focus:border-sky-600 h-6"
                                step="0.1"
                              />
                            ) : (
                              <span className="text-xs font-medium text-slate-700 tabular-nums">{product.vatRate}%</span>
                            )}
                          </td>
                          <td className="px-2 py-1 text-right">
                            <span className="text-xs font-bold text-sky-600 tabular-nums">
                              {product.priceWithVat.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              <span className="text-[10px] text-sky-400 font-normal">сўм</span>
                            </span>
                          </td>
                          <td className="px-2 py-1 text-center">
                            {editingProduct?.id === product.id ? (
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={savePrice}
                                  className="px-2 py-0.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-[10px] font-medium shadow-sm h-6 flex items-center"
                                >
                                  💾
                                </button>
                                <button
                                  onClick={() => setEditingProduct(null)}
                                  className="px-2 py-0.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded text-[10px] font-medium h-6 flex items-center"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditPrice(product)}
                                className="px-2 py-0.5 bg-sky-600 text-white rounded hover:bg-sky-700 text-[10px] font-medium shadow-sm h-6 flex items-center mx-auto"
                              >
                                ✏️
                              </button>
                            )}
                          </td>
                          <td className="px-2 py-1 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-0"
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => handleView(product)}
                                  className="cursor-pointer text-xs"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-2" />
                                  {t('Products.actions.viewDetails')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEdit(product)}
                                  className="cursor-pointer text-xs"
                                >
                                  <Edit className="h-3.5 w-3.5 mr-2" />
                                  {t('Products.actions.editProduct')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(product)}
                                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 text-xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  {t('Products.actions.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
                <p className="text-xs text-slate-600">
                  {t('Products.footer.showing')} <span className="font-semibold text-slate-900">{filteredProducts.length}</span> {t('Products.footer.of')} <span className="font-semibold text-slate-900">{products.length}</span> {t('Products.footer.products')}
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-sky-50 border border-sky-100 rounded-lg p-3">
              <h3 className="text-xs font-bold text-sky-900 mb-2 flex items-center gap-2">
                <span>💡</span> {t('Products.info.howToUse')}
              </h3>
              <ul className="text-xs text-sky-800 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">•</span>
                  <span><strong>{t('Products.info.basePrices')}</strong> {t('Products.info.basePricesDesc')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">•</span>
                  <span><strong>{t('Products.info.customPrices')}</strong> {t('Products.info.customPricesDesc')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">•</span>
                  <span><strong>{t('Products.info.vatFormula')}</strong> {t('Products.info.vatFormulaDesc')}</span>
                </li>
              </ul>
            </div>
          </TabsContent>

          {/* Customer Pricing Tab */}
          <TabsContent value="pricing" className="mt-0 space-y-6">
            {/* Customer Selection */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="bg-sky-100 rounded-full p-3">
                  <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Выберите клиента для массового редактирования цен
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      setSearchQuery('');
                    }}
                    className="w-full max-w-xl px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium hover:bg-white transition-all focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                  >
                    <option value="">-- Выберите клиента --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {selectedCustomerId ? (
              <>
                {/* Statistics Cards */}
                {!pricingLoading && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Всего товаров</p>
                          <p className="text-3xl font-bold text-slate-900 mt-2 tabular-nums">{stats.totalProducts}</p>
                        </div>
                        <div className="bg-sky-100 rounded-full p-3">
                          <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Индивидуальные цены</p>
                          <p className="text-3xl font-bold text-sky-600 mt-2 tabular-nums">{stats.customPriced}</p>
                        </div>
                        <div className="bg-sky-100 rounded-full p-3">
                          <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Средняя скидка</p>
                          <p className="text-3xl font-bold text-emerald-600 mt-2 tabular-nums">
                            {stats.customPriced > 0 ? `${stats.avgDiscount}%` : '—'}
                          </p>
                        </div>
                        <div className="bg-emerald-100 rounded-full p-3">
                          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Card */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {/* Header with Actions */}
                  <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Массовое редактирование цен
                        </h2>
                        {selectedCustomerObj && (
                          <p className="text-sky-100 mt-1">
                            Клиент: {selectedCustomerObj.name} ({selectedCustomerObj.customerCode})
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleUseDefaultPrices}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors backdrop-blur-sm"
                        >
                          📋 Базовые цены
                        </button>
                        <button
                          onClick={handleClearCustomPrices}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors backdrop-blur-sm"
                        >
                          🗑️ Очистить
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving || !stats.hasChanges}
                          className="px-6 py-2 bg-white text-sky-600 hover:bg-sky-50 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          {saving ? '💾 Сохранение...' : '💾 Сохранить'}
                        </button>
                      </div>
                    </div>

                    {/* Message Banner */}
                    {message && (
                      <div className={`mt-4 p-4 rounded-lg font-medium ${message.startsWith('✅')
                        ? 'bg-emerald-500 text-white'
                        : 'bg-red-500 text-white'
                        }`}>
                        {message}
                      </div>
                    )}
                  </div>

                  {/* Search Bar */}
                  {!pricingLoading && pricingProducts.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="🔍 Поиск по названию или артикулу..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-4 py-3 pl-10 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-500 hover:bg-white transition-all focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                        />
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Table */}
                  {pricingLoading ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
                      <p className="text-slate-600 font-medium">Загрузка товаров...</p>
                    </div>
                  ) : pricingProducts.length === 0 ? (
                    <div className="p-12 text-center">
                      <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-slate-500 font-medium">Товары не найдены</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                      <table className="min-w-full w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-200 sticky top-0 z-10">
                          <tr>
                            <th className="sticky left-0 z-10 bg-slate-50/95 backdrop-blur-sm px-6 py-3.5 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
                              Товар
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
                              Артикул
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
                              Единица
                            </th>
                            <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-900 uppercase tracking-wider">
                              Базовая цена
                            </th>
                            <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-900 uppercase tracking-wider">
                              Цена для клиента
                            </th>
                            <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-900 uppercase tracking-wider">
                              Разница
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {filteredPricingProducts.map(product => {
                            const hasCustomPrice = product.customerPrice !== undefined;
                            const discount = hasCustomPrice
                              ? ((product.unitPrice - product.customerPrice!) / product.unitPrice) * 100
                              : 0;
                            const isDiscount = discount > 0;
                            const isMarkup = discount < 0;

                            return (
                              <tr key={product.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors group ${hasCustomPrice ? 'bg-sky-50/30' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    {hasCustomPrice && (
                                      <span className="text-sky-600">💎</span>
                                    )}
                                    <span className="text-sm font-semibold text-slate-900">{product.name}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-mono font-medium text-slate-700">
                                    {product.sku || '—'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-medium text-slate-700">{product.unit}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                                    {product.unitPrice.toLocaleString()} сўм
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={product.customerPrice ?? ''}
                                    onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                    placeholder="Базовая цена"
                                    className="w-48 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-right text-slate-900 font-semibold placeholder:text-slate-400 hover:bg-white transition-all focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  {hasCustomPrice ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${isDiscount
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : isMarkup
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-slate-100 text-slate-800'
                                        }`}>
                                        {isDiscount ? '↓' : isMarkup ? '↑' : '='} {Math.abs(discount).toFixed(1)}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-slate-400">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Footer */}
                  {!pricingLoading && filteredPricingProducts.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                          Показано <span className="font-semibold text-slate-900">{filteredPricingProducts.length}</span> из <span className="font-semibold text-slate-900">{pricingProducts.length}</span> товаров
                        </p>
                        {stats.hasChanges && (
                          <p className="text-sm text-sky-600 font-medium">
                            ⚠️ Есть несохраненные изменения
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="bg-sky-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Выберите клиента</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  Выберите клиента из списка выше, чтобы просмотреть и настроить индивидуальные цены на товары
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs and Bulk Action Bar */}
        <ProductSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          initialData={currentProduct}
          onSave={handleProductSave}
          mode={sheetMode}
        />

        <ProductDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          product={deletingProduct}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />

        <BulkDeleteProductsDialog
          open={bulkDeleteDialogOpen}
          onOpenChange={setBulkDeleteDialogOpen}
          selectedCount={selectedProducts.length}
          onConfirm={handleBulkDeleteConfirm}
          isDeleting={isDeleting}
        />

        <BulkActionBar
          selectedCount={selectedProducts.length}
          onClearSelection={clearSelection}
          onBulkDelete={handleBulkDeleteClick}
        />
      </div>
    </div>
  );
}
