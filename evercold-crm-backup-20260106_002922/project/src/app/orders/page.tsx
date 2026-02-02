'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import DatePicker from '@/components/DatePicker'

interface Order {
  id: string
  orderNumber: string
  orderDate: string
  status: string
  totalAmount: number
  sourceType: string
  customer: {
    name: string
  }
  orderItems: Array<{
    id: string
    quantity: number
    branch?: {
      branchName: string
      branchCode: string
      oldBranchCode: string | null
      oldBranchName: string | null
    }
  }>
  delivery?: {
    id: string
    status: string
    scheduledDate: string | null
    driver: {
      id: string
      name: string
    } | null
    vehicle: {
      id: string
      plateNumber: string
    } | null
  } | null
}

const STATUS_RU: Record<string, string> = {
  NEW: 'Новый',
  CONFIRMED: 'Подтвержден',
  PICKING: 'Сбор',
  PACKING: 'Упаковка',
  READY: 'Готов',
  SHIPPING: 'Отправлен',
  DELIVERED: 'Доставлен',
  INVOICED: 'Выставлен счет',
  PAID: 'Оплачен',
  CANCELLED: 'Отменен',
  PENDING: 'Ожидание',
  IN_TRANSIT: 'В пути',
  FAILED: 'Не доставлен',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkUpdating, setBulkUpdating] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCustomer, setFilterCustomer] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) throw new Error('Не удалось загрузить заказы')

      const data = await response.json()
      setOrders(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Удалить заказ #${orderNumber}?`)) {
      return
    }

    setDeleting(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Не удалось удалить заказ')

      setOrders(orders.filter((o) => o.id !== orderId))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)))
    }
  }

  const bulkDelete = async () => {
    if (selectedOrders.size === 0) return

    if (!confirm(`Удалить ${selectedOrders.size} выбранных заказов?`)) {
      return
    }

    setBulkDeleting(true)
    try {
      const deletePromises = Array.from(selectedOrders).map(orderId =>
        fetch(`/api/orders/${orderId}`, { method: 'DELETE' })
      )

      await Promise.all(deletePromises)

      setOrders(orders.filter((o) => !selectedOrders.has(o.id)))
      setSelectedOrders(new Set())
    } catch (err: any) {
      alert(err.message || 'Не удалось удалить заказы')
    } finally {
      setBulkDeleting(false)
    }
  }

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedOrders.size === 0) return

    setBulkUpdating(true)
    try {
      const updatePromises = Array.from(selectedOrders).map(orderId =>
        fetch(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
      )

      await Promise.all(updatePromises)

      setOrders(orders.map(o =>
        selectedOrders.has(o.id) ? { ...o, status: newStatus } : o
      ))
      setSelectedOrders(new Set())
    } catch (err: any) {
      alert(err.message || 'Не удалось обновить заказы')
    } finally {
      setBulkUpdating(false)
    }
  }

  const exportOrders = async () => {
    const orderIdsToExport = selectedOrders.size > 0
      ? Array.from(selectedOrders)
      : filteredOrders.map(o => o.id)

    if (orderIdsToExport.length === 0) {
      alert('Нет заказов для экспорта')
      return
    }

    try {
      const response = await fetch('/api/orders/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: orderIdsToExport }),
      })

      if (!response.ok) throw new Error('Не удалось экспортировать заказы')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `заказы_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(err.message || 'Не удалось экспортировать заказы')
    }
  }

  const generateBulkInvoices = async () => {
    if (selectedOrders.size === 0) {
      alert('Выберите заказы для создания счетов-фактур')
      return
    }

    try {
      const response = await fetch('/api/orders/bulk-schet-faktura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Не удалось создать счета-фактуры')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `счета-фактуры_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(err.message || 'Не удалось создать счета-фактуры')
    }
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesOrderNumber = order.orderNumber.toLowerCase().includes(query)
      const matchesCustomer = order.customer.name.toLowerCase().includes(query)
      if (!matchesOrderNumber && !matchesCustomer) return false
    }

    if (dateFrom) {
      const orderDate = new Date(order.orderDate)
      const fromDate = new Date(dateFrom)
      if (orderDate < fromDate) return false
    }
    if (dateTo) {
      const orderDate = new Date(order.orderDate)
      const toDate = new Date(dateTo)
      if (orderDate > toDate) return false
    }

    if (filterStatus && order.status !== filterStatus) return false
    if (filterCustomer && order.customer.name !== filterCustomer) return false

    return true
  })

  const uniqueCustomers = Array.from(new Set(orders.map(o => o.customer.name)))

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800 border border-blue-300',
      CONFIRMED: 'bg-green-100 text-green-800 border border-green-300',
      PICKING: 'bg-orange-100 text-orange-800 border border-orange-300',
      PACKING: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      READY: 'bg-purple-100 text-purple-800 border border-purple-300',
      SHIPPING: 'bg-cyan-100 text-cyan-800 border border-cyan-300',
      DELIVERED: 'bg-indigo-100 text-indigo-800 border border-indigo-300',
      INVOICED: 'bg-pink-100 text-pink-800 border border-pink-300',
      PAID: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      CANCELLED: 'bg-red-100 text-red-800 border border-red-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border border-gray-300'
  }

  const getBranchInfo = (orderItems: Order['orderItems']) => {
    const branches = orderItems.filter(item => item.branch).map(item => item.branch!)
    const uniqueBranches = Array.from(new Map(branches.map(b => [b.branchCode, b])).values())

    if (uniqueBranches.length === 0) return { code: '', name: 'Нет филиала' }
    if (uniqueBranches.length === 1) {
      const branch = uniqueBranches[0]
      return { code: branch.branchCode, name: branch.branchName }
    }
    return {
      code: uniqueBranches.map(b => b.branchCode).join(', '),
      name: `${uniqueBranches.length} филиалов`
    }
  }

  const getTotalQuantity = (orderItems: Order['orderItems']) => {
    return orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Загрузка заказов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Заказы
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Показано: <span className="font-semibold">{filteredOrders.length}</span> из <span className="font-semibold">{orders.length}</span>
                {selectedOrders.size > 0 && ` • ${selectedOrders.size} выбрано`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportOrders}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-semibold shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Экспорт {selectedOrders.size > 0 && `(${selectedOrders.size})`}
              </button>
              <Link
                href="/"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-semibold shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Загрузить
              </Link>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedOrders.size > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-4 flex items-center gap-3 mb-4 shadow-sm">
              <span className="text-indigo-900 font-semibold">
                Выбрано: {selectedOrders.size}
              </span>
              <div className="flex gap-2 ml-auto flex-wrap">
                <button
                  onClick={generateBulkInvoices}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Счета-фактуры
                </button>
                <button
                  onClick={bulkDelete}
                  disabled={bulkDeleting}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {bulkDeleting ? 'Удаление...' : 'Удалить'}
                </button>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      bulkUpdateStatus(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  disabled={bulkUpdating}
                  className="bg-white border-2 border-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                >
                  <option value="">Изменить статус</option>
                  {Object.entries(STATUS_RU).filter(([key]) => !['PENDING', 'IN_TRANSIT', 'FAILED'].includes(key)).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
                <button
                  onClick={() => setSelectedOrders(new Set())}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-semibold"
                >
                  Отменить
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="🔍 Поиск по номеру или клиенту..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <DatePicker
                  value={dateFrom}
                  onChange={setDateFrom}
                  enableTime={true}
                  clearable={true}
                  placeholder="📅 От даты..."
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <DatePicker
                  value={dateTo}
                  onChange={setDateTo}
                  enableTime={true}
                  clearable={true}
                  placeholder="📅 До даты..."
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Все статусы</option>
                {Object.entries(STATUS_RU).filter(([key]) => !['PENDING', 'IN_TRANSIT', 'FAILED'].includes(key)).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              <select
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Все клиенты</option>
                {uniqueCustomers.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setDateFrom('')
                  setDateTo('')
                  setFilterStatus('')
                  setFilterCustomer('')
                }}
                className="md:col-span-2 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Очистить фильтры
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg
              className="w-24 h-24 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Заказов пока нет</h3>
            <p className="text-gray-600 mb-6">
              Загрузите файл Excel чтобы начать
            </p>
            <Link
              href="/"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Загрузить заказы
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-100 uppercase">№ Заказа</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-100 uppercase">Дата</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-100 uppercase">Клиент</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-100 uppercase">Филиал</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-100 uppercase">Кол-во</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-gray-100 uppercase">Сумма</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-100 uppercase">Статус</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-100 uppercase">Доставка</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-gray-100 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        index % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-sm font-bold text-gray-900">{order.orderNumber}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-sm font-bold text-gray-900">
                          {format(new Date(order.orderDate), 'dd.MM.yy')}
                        </div>
                        <div className="text-xs text-gray-600">
                          {format(new Date(order.orderDate), 'HH:mm')}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-sm font-bold text-gray-900">{order.customer.name}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {(() => {
                          const branchInfo = getBranchInfo(order.orderItems)
                          return (
                            <div>
                              {branchInfo.code && (
                                <div className="text-xs font-bold text-indigo-700">{branchInfo.code}</div>
                              )}
                              <div className="text-xs text-gray-700">{branchInfo.name}</div>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-sm font-bold text-gray-900">{getTotalQuantity(order.orderItems)}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {order.totalAmount.toLocaleString('ru-RU')}
                        </div>
                        <div className="text-xs text-gray-600">сўм</div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`px-3 py-1 inline-flex text-xs font-bold rounded-lg ${getStatusColor(order.status)}`}
                        >
                          {STATUS_RU[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {order.delivery ? (
                          <div>
                            <div className={`inline-flex px-2 py-1 rounded-lg font-semibold ${
                              order.delivery.status === 'DELIVERED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {STATUS_RU[order.delivery.status] || order.delivery.status}
                            </div>
                            {order.delivery.driver && (
                              <div className="text-gray-700 mt-1 font-medium">
                                {order.delivery.driver.name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={`/orders/${order.id}`}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            + Назначить
                          </Link>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/orders/${order.id}`}
                            title="Просмотр"
                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <Link
                            href={`/orders/${order.id}?edit=true`}
                            title="Изменить"
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => deleteOrder(order.id, order.orderNumber)}
                            disabled={deleting === order.id}
                            title="Удалить"
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={5} className="px-3 py-3 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        Итого ({filteredOrders.length}):
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold text-gray-900">
                        {filteredOrders.reduce((sum, order) => sum + getTotalQuantity(order.orderItems), 0)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString('ru-RU')}
                      </div>
                      <div className="text-xs text-gray-600">сўм</div>
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
