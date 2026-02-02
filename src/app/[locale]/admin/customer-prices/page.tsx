'use client';

import { useState, useEffect, useMemo } from 'react';

interface Customer {
  id: string;
  name: string;
  customerCode: string;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unitPrice: number;
  unit: string;
  customerPrice?: number;
}

export default function CustomerPricesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load customers on mount
  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(err => console.error('Error loading customers:', err));
  }, []);

  // Load products when customer is selected
  useEffect(() => {
    if (!selectedCustomerId) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setMessage('');
    fetch(`/api/admin/customer-prices?customerId=${selectedCustomerId}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading products:', err);
        setLoading(false);
      });
  }, [selectedCustomerId]);

  const handlePriceChange = (productId: string, value: string) => {
    setProducts(products.map(p =>
      p.id === productId
        ? { ...p, customerPrice: value ? parseFloat(value) : undefined }
        : p
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const prices = products
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
    setProducts(products.map(p => ({
      ...p,
      customerPrice: p.unitPrice,
    })));
  };

  const handleClearCustomPrices = () => {
    setProducts(products.map(p => ({
      ...p,
      customerPrice: undefined,
    })));
  };

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.sku && p.sku.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const customPriced = products.filter(p => p.customerPrice !== undefined).length;
    const totalProducts = products.length;
    const avgDiscount = products
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
  }, [products]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💰 Управление ценами клиентов</h1>
          <p className="text-lg text-gray-600">Настройте индивидуальные цены для каждого клиента</p>
        </div>

        {/* Customer Selection Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 rounded-full p-3">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Выберите клиента
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setSearchQuery('');
                }}
                className="w-full max-w-xl px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

        {/* Products Section */}
        {selectedCustomerId && (
          <>
            {/* Statistics Cards */}
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Всего товаров</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
                    </div>
                    <div className="bg-blue-100 rounded-full p-3">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Индивидуальные цены</p>
                      <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.customPriced}</p>
                    </div>
                    <div className="bg-indigo-100 rounded-full p-3">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Средняя скидка</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        {stats.customPriced > 0 ? `${stats.avgDiscount}%` : '—'}
                      </p>
                    </div>
                    <div className="bg-green-100 rounded-full p-3">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Header with Actions */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Установка цен для товаров
                    </h2>
                    {selectedCustomer && (
                      <p className="text-indigo-100 mt-1">
                        Клиент: {selectedCustomer.name} ({selectedCustomer.customerCode})
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
                      className="px-6 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {saving ? '💾 Сохранение...' : '💾 Сохранить'}
                    </button>
                  </div>
                </div>

                {/* Message Banner */}
                {message && (
                  <div className={`mt-4 p-4 rounded-lg font-medium ${
                    message.startsWith('✅')
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}>
                    {message}
                  </div>
                )}
              </div>

              {/* Search Bar */}
              {!loading && products.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="🔍 Поиск по названию или артикулу..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Table */}
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Загрузка товаров...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500 font-medium">Товары не найдены</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Товар
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Артикул
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Единица
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Базовая цена
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Цена для клиента
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Разница
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map(product => {
                        const hasCustomPrice = product.customerPrice !== undefined;
                        const discount = hasCustomPrice
                          ? ((product.unitPrice - product.customerPrice!) / product.unitPrice) * 100
                          : 0;
                        const isDiscount = discount > 0;
                        const isMarkup = discount < 0;

                        return (
                          <tr key={product.id} className={`hover:bg-indigo-50 transition-colors ${hasCustomPrice ? 'bg-blue-50/30' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {hasCustomPrice && (
                                  <span className="text-indigo-600">💎</span>
                                )}
                                <span className="text-sm font-semibold text-gray-900">{product.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-mono font-medium text-gray-700">
                                {product.sku || '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-700">{product.unit}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-bold text-gray-900">
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
                                className="w-48 border-2 border-gray-300 rounded-lg px-3 py-2 text-right text-gray-900 font-semibold placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {hasCustomPrice ? (
                                <div className="flex items-center justify-center gap-2">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                    isDiscount
                                      ? 'bg-green-100 text-green-800'
                                      : isMarkup
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {isDiscount ? '↓' : isMarkup ? '↑' : '='} {Math.abs(discount).toFixed(1)}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">—</span>
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
              {!loading && filteredProducts.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Показано <span className="font-semibold text-gray-900">{filteredProducts.length}</span> из <span className="font-semibold text-gray-900">{products.length}</span> товаров
                    </p>
                    {stats.hasChanges && (
                      <p className="text-sm text-indigo-600 font-medium">
                        ⚠️ Есть несохраненные изменения
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {!selectedCustomerId && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="bg-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Выберите клиента</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Выберите клиента из списка выше, чтобы просмотреть и настроить индивидуальные цены на товары
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
