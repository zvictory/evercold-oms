'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Analytics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByStatus: Record<string, number>
  deliveriesByStatus: Record<string, number>
  driverPerformance: Array<{ name: string; deliveries: number; revenue: number }>
  totalDeliveries: number
  completedDeliveries: number
  revenueByCustomer: Array<{ name: string; revenue: number }>
  ordersByDate: Array<{ date: string; count: number; revenue: number }>
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
}

const STATUS_TRANSLATIONS: Record<string, string> = {
  // Order statuses
  NEW: 'Новый',
  CONFIRMED: 'Подтвержден',
  PICKING: 'Сбор',
  PACKING: 'Упаковка',
  READY: 'Готов',
  SHIPPED: 'Отправлен',
  COMPLETED: 'Завершен',
  INVOICED: 'Выставлен счет',
  PAID: 'Оплачен',
  CANCELLED: 'Отменен',
  // Delivery statuses
  PENDING: 'Ожидание',
  IN_TRANSIT: 'В пути',
  DELIVERED: 'Доставлен',
  FAILED: 'Не доставлен',
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      if (!response.ok) throw new Error('Не удалось загрузить аналитику')

      const data = await response.json()
      setAnalytics(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Загрузка данных...</p>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
          <div className="text-red-600 mb-4 flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ошибка: {error || 'Не удалось загрузить аналитику'}</span>
          </div>
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    )
  }

  const deliveryRate = analytics.totalDeliveries > 0
    ? (analytics.completedDeliveries / analytics.totalDeliveries) * 100
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Панель управления заказами
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Мониторинг заказов, доставок и эффективности водителей</p>
        </div>

        {/* Key Metrics - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Orders */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Всего заказов</p>
                  <p className="text-5xl font-bold text-white mt-1">{analytics.totalOrders}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Deliveries */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 p-6 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium uppercase tracking-wide">Доставок</p>
                  <p className="text-5xl font-bold text-white mt-1">{analytics.completedDeliveries}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Rate */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide">Успешность</p>
                  <p className="text-5xl font-bold text-white mt-1">{deliveryRate.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 p-6 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-sm font-medium uppercase tracking-wide">Выручка</p>
                  <p className="text-3xl font-bold text-white mt-1">{(analytics.totalRevenue / 1000000).toFixed(2)}М</p>
                  <p className="text-orange-100 text-xs mt-0.5">сўм</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Driver Performance - Top Deliverers */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Рейтинг водителей</h3>
            </div>
            <div className="space-y-4">
              {analytics.driverPerformance.length > 0 ? (
                analytics.driverPerformance.map((driver, idx) => {
                  const maxDeliveries = Math.max(...analytics.driverPerformance.map(d => d.deliveries), 1)
                  const percentage = (driver.deliveries / maxDeliveries) * 100
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <div key={driver.name} className="group bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200 hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{medals[idx] || '🚚'}</div>
                          <div>
                            <p className="text-lg font-bold text-gray-900">{driver.name}</p>
                            <p className="text-sm text-gray-600">{driver.deliveries} доставок</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-indigo-600">
                            {(driver.revenue / 1000).toFixed(0)}K
                          </p>
                          <p className="text-xs text-gray-600">сўм</p>
                        </div>
                      </div>
                      <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="absolute h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="font-medium">Нет данных о доставках</p>
                  <p className="text-sm mt-1">Назначьте водителей для доставки заказов</p>
                </div>
              )}
            </div>
          </div>

          {/* Orders by Status */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Статусы заказов</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                <div key={status} className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">{STATUS_TRANSLATIONS[status] || status}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{count}</p>
                    </div>
                    <div className="text-cyan-600 text-2xl">
                      {status === 'DELIVERED' && '✓'}
                      {status === 'IN_TRANSIT' && '🚚'}
                      {status === 'PENDING' && '⏳'}
                      {status === 'NEW' && '📋'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delivery Status and Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Delivery Status */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Статус доставок</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(analytics.deliveriesByStatus).length > 0 ? (
                Object.entries(analytics.deliveriesByStatus).map(([status, count]) => {
                  const percentage = analytics.totalDeliveries > 0
                    ? (count / analytics.totalDeliveries) * 100
                    : 0
                  return (
                    <div key={status} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-900">{STATUS_TRANSLATIONS[status] || status}</span>
                        <span className="text-2xl font-bold text-green-600">{count}</span>
                      </div>
                      <div className="relative w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="absolute h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{percentage.toFixed(1)}% от всех доставок</p>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="font-medium">Нет данных о доставках</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Популярные товары</h3>
            </div>
            <div className="space-y-3">
              {analytics.topProducts.map((product, idx) => (
                <div key={product.name} className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600 mt-1">{product.quantity} шт.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{(product.revenue / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-gray-600">сўм</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Топ клиенты</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {analytics.revenueByCustomer.map((customer, idx) => {
              const maxRevenue = Math.max(...analytics.revenueByCustomer.map(c => c.revenue), 1)
              const percentage = (customer.revenue / maxRevenue) * 100
              return (
                <div key={customer.name} className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <p className="text-sm font-bold text-gray-900 flex-1">{customer.name}</p>
                  </div>
                  <div className="mb-2">
                    <p className="text-2xl font-bold text-pink-600">
                      {(customer.revenue / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-gray-600">сўм</p>
                  </div>
                  <div className="relative w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="absolute h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
