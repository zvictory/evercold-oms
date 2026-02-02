'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import DatePicker from '@/components/DatePicker'
import { formatDate, formatDateTime, toInputDateTimeValue } from '@/lib/date-utils'

interface OrderDetail {
  id: string
  orderNumber: string
  orderDate: string
  status: string
  subtotal: number
  vatAmount: number
  totalAmount: number
  sourceType: string
  contractInfo?: string
  notes?: string
  customer: {
    name: string
    customerCode?: string
    hasVat: boolean
  }
  orderItems: Array<{
    id: string
    quantity: number
    unitPrice: number
    subtotal: number
    vatRate: number
    vatAmount: number
    totalAmount: number
    productName: string
    sapCode?: string
    barcode?: string
    branch?: {
      branchName: string
      branchCode: string
      fullName: string
    }
    product: {
      name: string
      unit: string
    }
  }>
  delivery?: {
    id: string
    status: string
    scheduledDate: string | null
    pickupTime: string | null
    deliveryTime: string | null
    notes: string | null
    driver: {
      id: string
      name: string
      phone: string
    } | null
    vehicle: {
      id: string
      plateNumber: string
      model: string
    } | null
  } | null
}

interface Driver {
  id: string
  name: string
  phone: string
  status: string
}

interface Vehicle {
  id: string
  plateNumber: string
  model: string
  type: string
  status: string
}

interface EditableItem {
  id: string
  quantity: number
  unitPrice: number
  vatRate: number
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editableItems, setEditableItems] = useState<EditableItem[]>([])
  const [saving, setSaving] = useState(false)

  // Delivery management state
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [deliveryForm, setDeliveryForm] = useState({
    driverId: '',
    vehicleId: '',
    scheduledDate: '',
    notes: '',
  })
  const [assigningDelivery, setAssigningDelivery] = useState(false)

  // EDO sync state
  const [showEdoModal, setShowEdoModal] = useState(false)
  const [edoIntegrations, setEdoIntegrations] = useState<any[]>([])
  const [selectedIntegrationId, setSelectedIntegrationId] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [edoSyncRecords, setEdoSyncRecords] = useState<any[]>([])

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    fetchDriversAndVehicles()
    fetchEdoIntegrations()
  }, [])

  useEffect(() => {
    if (params.id) {
      fetchEdoSyncRecords(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    const editParam = searchParams.get('edit')
    if (editParam === 'true' && order) {
      setIsEditMode(true)
      setEditableItems(
        order.orderItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
        }))
      )
    }
  }, [searchParams, order])

  const fetchOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`)
      if (!response.ok) throw new Error('Failed to fetch order')

      const data = await response.json()
      setOrder(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchDriversAndVehicles = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        fetch('/api/drivers'),
        fetch('/api/vehicles'),
      ])

      if (driversRes.ok) {
        const driversData = await driversRes.json()
        const driversArray = driversData.drivers || driversData
        setDrivers(Array.isArray(driversArray) ? driversArray.filter((d: Driver) => d.status === 'ACTIVE') : [])
      }

      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json()
        const vehiclesArray = vehiclesData.vehicles || vehiclesData
        setVehicles(Array.isArray(vehiclesArray) ? vehiclesArray.filter((v: Vehicle) => v.status === 'AVAILABLE' || v.status === 'IN_USE') : [])
      }
    } catch (err) {
      console.error('Error fetching drivers/vehicles:', err)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!order) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')

      const updated = await response.json()
      setOrder({ ...order, status: updated.status })
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const deleteOrder = async () => {
    if (!order) return

    if (!confirm(`Вы уверены, что хотите удалить заказ №${order.orderNumber}?`)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete order')

      router.push('/orders')
    } catch (err: any) {
      alert(err.message)
      setDeleting(false)
    }
  }

  const updateEditableItem = (itemId: string, field: keyof EditableItem, value: number) => {
    setEditableItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    )
  }

  const calculateItemTotals = (item: EditableItem) => {
    const subtotal = item.quantity * item.unitPrice
    const vatAmount = (subtotal * item.vatRate) / 100
    const totalAmount = subtotal + vatAmount
    return { subtotal, vatAmount, totalAmount }
  }

  const saveChanges = async () => {
    if (!order) return

    setSaving(true)
    try {
      const updates = editableItems.map(item => {
        const { subtotal, vatAmount, totalAmount } = calculateItemTotals(item)
        return {
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          subtotal,
          vatAmount,
          totalAmount,
        }
      })

      const response = await fetch(`/api/orders/${order.id}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updates }),
      })

      if (!response.ok) throw new Error('Failed to save changes')

      await fetchOrder(order.id)
      setIsEditMode(false)
      router.push(`/orders/${order.id}`)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setIsEditMode(false)
    if (order?.id) {
      router.push(`/orders/${order.id}`)
    }
  }

  const openDeliveryModal = () => {
    if (order?.delivery) {
      // Editing existing delivery
      setDeliveryForm({
        driverId: order.delivery.driver?.id || '',
        vehicleId: order.delivery.vehicle?.id || '',
        scheduledDate: order.delivery.scheduledDate
          ? new Date(order.delivery.scheduledDate).toISOString().slice(0, 16)
          : '',
        notes: order.delivery.notes || '',
      })
    } else {
      // New delivery
      setDeliveryForm({
        driverId: '',
        vehicleId: '',
        scheduledDate: '',
        notes: '',
      })
    }
    setShowDeliveryModal(true)
  }

  const assignDelivery = async () => {
    if (!order) return

    setAssigningDelivery(true)
    try {
      if (order.delivery) {
        // Update existing delivery
        const response = await fetch(`/api/deliveries/${order.delivery.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId: deliveryForm.driverId || null,
            vehicleId: deliveryForm.vehicleId || null,
            scheduledDate: deliveryForm.scheduledDate || null,
            notes: deliveryForm.notes,
          }),
        })

        if (!response.ok) throw new Error('Failed to update delivery')
      } else {
        // Create new delivery
        const response = await fetch('/api/deliveries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            driverId: deliveryForm.driverId || null,
            vehicleId: deliveryForm.vehicleId || null,
            scheduledDate: deliveryForm.scheduledDate || null,
            status: 'PENDING',
            notes: deliveryForm.notes,
          }),
        })

        if (!response.ok) throw new Error('Failed to assign delivery')
      }

      await fetchOrder(order.id)
      setShowDeliveryModal(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setAssigningDelivery(false)
    }
  }

  const startDelivery = async () => {
    if (!order?.delivery) return

    if (!confirm('Начать доставку? Это отметит заказ как "В пути".')) return

    try {
      const response = await fetch(`/api/deliveries/${order.delivery.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_TRANSIT',
          pickupTime: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error('Failed to start delivery')

      await fetchOrder(order.id)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const markDelivered = async () => {
    if (!order?.delivery) return

    if (!confirm('Отметить эту доставку как завершенную?')) return

    try {
      const response = await fetch(`/api/deliveries/${order.delivery.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DELIVERED',
          deliveryTime: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error('Failed to mark as delivered')

      await fetchOrder(order.id)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const markFailed = async () => {
    if (!order?.delivery) return

    const reason = prompt('Введите причину неудачной доставки:')
    if (!reason) return

    try {
      const response = await fetch(`/api/deliveries/${order.delivery.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'FAILED',
          notes: `${order.delivery.notes ? order.delivery.notes + '\n' : ''}FAILED: ${reason}`,
        }),
      })

      if (!response.ok) throw new Error('Failed to mark delivery as failed')

      await fetchOrder(order.id)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const fetchEdoIntegrations = async () => {
    try {
      const response = await fetch('/api/edo/integrations')
      if (response.ok) {
        const data = await response.json()
        setEdoIntegrations(data.integrations || [])
        if (data.integrations?.length > 0) {
          setSelectedIntegrationId(data.integrations[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch EDO integrations:', error)
    }
  }

  const fetchEdoSyncRecords = async (orderId: string) => {
    try {
      const response = await fetch(`/api/edo/sync/status?orderId=${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setEdoSyncRecords(data.syncs || [])
      }
    } catch (error) {
      console.error('Failed to fetch EDO sync records:', error)
    }
  }

  const handleEdoSync = async () => {
    if (!order || !selectedIntegrationId) {
      alert('Пожалуйста, выберите интеграцию')
      return
    }

    setSyncing(true)
    try {
      const response = await fetch('/api/edo/sync/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          integrationId: selectedIntegrationId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`✅ Заказ успешно синхронизирован с ЭДО!\nВнешний ID: ${data.externalId}`)
        await fetchEdoSyncRecords(order.id)
        setShowEdoModal(false)
      } else {
        alert(`❌ Ошибка синхронизации: ${data.error}`)
      }
    } catch (error: any) {
      alert(`❌ Ошибка синхронизации: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      NEW: 'Новый',
      CONFIRMED: 'Подтвержден',
      PICKING: 'Сборка',
      PACKING: 'Упаковка',
      READY: 'Готов',
      SHIPPED: 'Отправлен',
      COMPLETED: 'Завершен',
      INVOICED: 'Выставлен счет',
      PAID: 'Оплачен',
      CANCELLED: 'Отменен',
      PENDING: 'Ожидание',
      IN_TRANSIT: 'В пути',
      DELIVERED: 'Доставлено',
      FAILED: 'Неудачно',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      NEW: 'bg-blue-100 text-blue-800 border-blue-200',
      CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
      PICKING: 'bg-orange-100 text-orange-800 border-orange-200',
      PACKING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      READY: 'bg-purple-100 text-purple-800 border-purple-200',
      SHIPPED: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      COMPLETED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      INVOICED: 'bg-pink-100 text-pink-800 border-pink-200',
      PAID: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка заказа...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-600 mb-4">Ошибка: {error || 'Заказ не найден'}</div>
          <Link href="/orders" className="text-indigo-600 hover:text-indigo-800">
            ← Вернуться к заказам
          </Link>
        </div>
      </div>
    )
  }

  const statuses = ['NEW', 'CONFIRMED', 'PICKING', 'PACKING', 'READY', 'SHIPPED', 'COMPLETED', 'INVOICED', 'PAID']

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/orders" className="text-indigo-600 hover:text-indigo-800 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Вернуться к заказам
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Заказ №{order.orderNumber}</h2>
              <p className="text-gray-600 mt-1">
                {formatDateTime(order.orderDate)}
              </p>
              {isEditMode && (
                <div className="mt-2 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Режим редактирования - изменяйте количество и цены ниже
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isEditMode ? (
                <>
                  <button
                    onClick={saveChanges}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {saving ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Отмена
                  </button>
                </>
              ) : (
                <>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                  <a
                    href={`/api/orders/${order.id}/schet-faktura`}
                    download
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Счет-фактура
                  </a>
                  <button
                    onClick={deleteOrder}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleting ? 'Удаление...' : 'Удалить заказ'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-200">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Клиент</h3>
              <p className="text-lg font-medium text-gray-900">{order.customer.name}</p>
              {order.customer.customerCode && (
                <p className="text-sm text-gray-600">Код: {order.customer.customerCode}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Филиал</h3>
              {(() => {
                const branches = order.orderItems
                  .filter(item => item.branch)
                  .map(item => item.branch!)
                const uniqueBranches = Array.from(
                  new Map(branches.map(b => [b.branchCode, b])).values()
                )

                if (uniqueBranches.length === 0) {
                  return <p className="text-lg font-medium text-gray-900">Нет филиала</p>
                } else if (uniqueBranches.length === 1) {
                  return (
                    <div>
                      <p className="text-lg font-medium text-gray-900">{uniqueBranches[0].branchName}</p>
                      <p className="text-sm text-gray-600">{uniqueBranches[0].branchCode}</p>
                    </div>
                  )
                } else {
                  return (
                    <div>
                      <p className="text-lg font-medium text-gray-900">{uniqueBranches.length} филиалов</p>
                      <p className="text-sm text-gray-600">
                        {uniqueBranches.map(b => b.branchCode).join(', ')}
                      </p>
                    </div>
                  )
                }
              })()}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Тип источника</h3>
              <p className="text-lg font-medium text-gray-900">
                {order.sourceType === 'DETAILED' ? 'Детальный заказ' : 'Реестр'}
              </p>
            </div>
            {order.contractInfo && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Информация о контракте</h3>
                <p className="text-gray-900">{order.contractInfo}</p>
              </div>
            )}
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Товары заказа</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Товар</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Количество</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Цена за единицу</th>
                    {order.customer.hasVat && (
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Промежуточная сумма</th>
                    )}
                    {order.customer.hasVat && (
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">НДС ({order.orderItems[0]?.vatRate}%)</th>
                    )}
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Итого</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.orderItems.map((item, index) => {
                    const editableItem = editableItems.find(e => e.id === item.id)
                    const { subtotal, vatAmount, totalAmount } = editableItem
                      ? calculateItemTotals(editableItem)
                      : { subtotal: item.subtotal, vatAmount: item.vatAmount, totalAmount: item.totalAmount }

                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-base font-semibold text-gray-900">{item.productName}</div>
                          {item.sapCode && (
                            <div className="text-xs text-gray-600 mt-1">SAP: {item.sapCode}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEditMode && editableItem ? (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="number"
                                value={editableItem.quantity}
                                onChange={(e) => updateEditableItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                min="0"
                                step="1"
                              />
                              <span className="text-sm text-gray-600">{item.product.unit}</span>
                            </div>
                          ) : (
                            <span className="text-base font-medium text-gray-900">{item.quantity} {item.product.unit}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEditMode && editableItem ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                value={editableItem.unitPrice}
                                onChange={(e) => updateEditableItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-28 px-2 py-1 border border-gray-300 rounded text-right text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                min="0"
                                step="100"
                              />
                              <span className="text-sm text-gray-600">сўм</span>
                            </div>
                          ) : (
                            <span className="text-base font-medium text-gray-900">{item.unitPrice.toLocaleString()} сўм</span>
                          )}
                        </td>
                        {order.customer.hasVat && (
                          <td className="px-6 py-4 text-right text-base font-medium text-gray-900">{subtotal.toLocaleString()} сўм</td>
                        )}
                        {order.customer.hasVat && (
                          <td className="px-6 py-4 text-right text-base font-medium text-gray-900">{vatAmount.toLocaleString()} сўм</td>
                        )}
                        <td className="px-6 py-4 text-right text-base font-semibold text-gray-900">{totalAmount.toLocaleString()} сўм</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right text-base font-semibold text-gray-900">
                      {isEditMode && <span className="text-green-600 mr-2">(Пересчитано)</span>}
                      {order.customer.hasVat ? 'Промежуточная сумма:' : 'Итого:'}
                    </td>
                    {order.customer.hasVat && (
                      <td className="px-6 py-4 text-right text-base font-semibold text-gray-900">
                        {isEditMode
                          ? editableItems.reduce((sum, item) => sum + calculateItemTotals(item).subtotal, 0).toLocaleString()
                          : order.subtotal.toLocaleString()
                        } сўм
                      </td>
                    )}
                    {order.customer.hasVat && (
                      <td className="px-6 py-4 text-right text-base font-semibold text-gray-900">
                        {isEditMode
                          ? editableItems.reduce((sum, item) => sum + calculateItemTotals(item).vatAmount, 0).toLocaleString()
                          : order.vatAmount.toLocaleString()
                        } сўм
                      </td>
                    )}
                    <td className="px-6 py-4 text-right text-lg font-bold text-gray-900">
                      {isEditMode
                        ? editableItems.reduce((sum, item) => sum + calculateItemTotals(item).totalAmount, 0).toLocaleString()
                        : order.totalAmount.toLocaleString()
                      } сўм
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* EDO Sync Section */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Интеграция с ЭДО</h3>
              <button
                onClick={() => setShowEdoModal(true)}
                disabled={edoIntegrations.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
              >
                📄 Синхронизировать с ЭДО
              </button>
            </div>

            {edoIntegrations.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <svg
                  className="w-12 h-12 text-yellow-400 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-gray-700 font-medium mb-1">Интеграции с ЭДО не настроены</p>
                <p className="text-sm text-gray-600 mb-4">
                  Настройте интеграцию с ЭДО для синхронизации заказов с Didox, Hippo или Faktura
                </p>
                <Link
                  href="/settings/edo"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Настроить ЭДО
                </Link>
              </div>
            ) : edoSyncRecords.length > 0 ? (
              <div className="space-y-3">
                {edoSyncRecords.map((sync) => (
                  <div
                    key={sync.id}
                    className={`border rounded-lg p-4 ${
                      sync.status === 'synced'
                        ? 'bg-green-50 border-green-200'
                        : sync.status === 'failed'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              sync.status === 'synced'
                                ? 'bg-green-100 text-green-800'
                                : sync.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : sync.status === 'syncing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {sync.status === 'synced' ? 'СИНХРОНИЗИРОВАНО' : sync.status === 'failed' ? 'ОШИБКА' : sync.status === 'syncing' ? 'СИНХРОНИЗАЦИЯ' : sync.status.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {sync.integration.name} ({sync.integration.provider})
                          </span>
                        </div>
                        {sync.externalId && (
                          <p className="text-sm text-gray-600">
                            Внешний ID: <span className="font-mono">{sync.externalId}</span>
                          </p>
                        )}
                        {sync.syncedAt && (
                          <p className="text-sm text-gray-600">
                            Синхронизировано: {new Date(sync.syncedAt).toLocaleString()}
                          </p>
                        )}
                        {sync.errorMessage && (
                          <p className="text-sm text-red-600 mt-1">
                            Ошибка: {sync.errorMessage}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Link
                          href="/edo/sync"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Подробнее →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-3"
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
                <p className="text-gray-700 font-medium mb-1">Еще не синхронизировано</p>
                <p className="text-sm text-gray-600">
                  Нажмите "Синхронизировать с ЭДО" для загрузки заказа в систему электронного документооборота
                </p>
              </div>
            )}
          </div>

          {/* Delivery Assignment Section */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Отслеживание доставки</h3>
              {order.delivery ? (
                order.delivery.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={openDeliveryModal}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium border border-gray-300"
                    >
                      Изменить назначение
                    </button>
                    <button
                      onClick={startDelivery}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      🚚 Начать доставку
                    </button>
                  </div>
                ) : order.delivery.status === 'IN_TRANSIT' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={markDelivered}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      ✓ Отметить как доставлено
                    </button>
                    <button
                      onClick={markFailed}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      ✗ Отметить как неудачно
                    </button>
                  </div>
                ) : order.delivery.status === 'DELIVERED' ? (
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-semibold border border-green-200">
                    ✓ ДОСТАВЛЕНО
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-semibold border border-red-200">
                    ✗ {getStatusLabel(order.delivery.status)}
                  </span>
                )
              ) : (
                <button
                  onClick={openDeliveryModal}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  + Назначить доставку
                </button>
              )}
            </div>

            {order.delivery ? (
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Водитель</h4>
                    {order.delivery.driver ? (
                      <div>
                        <p className="text-base font-medium text-gray-900">{order.delivery.driver.name}</p>
                        <p className="text-sm text-gray-600">{order.delivery.driver.phone}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Водитель не назначен</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Транспорт</h4>
                    {order.delivery.vehicle ? (
                      <div>
                        <p className="text-base font-medium text-gray-900 font-mono">{order.delivery.vehicle.plateNumber}</p>
                        <p className="text-sm text-gray-600">{order.delivery.vehicle.model}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Транспорт не назначен</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Статус доставки</h4>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                        order.delivery.status === 'DELIVERED'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : order.delivery.status === 'IN_TRANSIT'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : order.delivery.status === 'FAILED'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : order.delivery.status === 'CANCELLED'
                          ? 'bg-gray-100 text-gray-800 border border-gray-300'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      }`}
                    >
                      {order.delivery.status === 'IN_TRANSIT' ? '🚚 ' : ''}
                      {order.delivery.status === 'DELIVERED' ? '✓ ' : ''}
                      {order.delivery.status === 'FAILED' ? '✗ ' : ''}
                      {getStatusLabel(order.delivery.status)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Запланированная дата</h4>
                    {order.delivery.scheduledDate ? (
                      <p className="text-base font-medium text-gray-900">
                        {formatDateTime(order.delivery.scheduledDate)}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic">Не запланировано</p>
                    )}
                  </div>

                  {order.delivery.pickupTime && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Забрано в</h4>
                      <p className="text-base font-medium text-gray-900">
                        {formatDateTime(order.delivery.pickupTime)}
                      </p>
                    </div>
                  )}

                  {order.delivery.deliveryTime && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Доставлено в</h4>
                      <p className="text-base font-medium text-gray-900">
                        {formatDateTime(order.delivery.deliveryTime)}
                      </p>
                    </div>
                  )}

                  {order.delivery.notes && (
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Примечания</h4>
                      <p className="text-gray-900">{order.delivery.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <svg
                  className="w-12 h-12 text-blue-400 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-700 font-medium mb-1">Доставка еще не назначена</p>
                <p className="text-sm text-gray-600">
                  Нажмите "Назначить доставку" для назначения водителя и транспорта для этого заказа
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Обновить статус</h3>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(status)}
                  disabled={updating || order.status === status}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    order.status === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* EDO Sync Modal */}
      {showEdoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Синхронизировать заказ с ЭДО</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleEdoSync()
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Выберите интеграцию с ЭДО
                  </label>
                  <select
                    value={selectedIntegrationId}
                    onChange={(e) => setSelectedIntegrationId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {edoIntegrations.map((integration) => (
                      <option key={integration.id} value={integration.id}>
                        {integration.name} ({integration.provider})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    Это загрузит заказ <strong>№{order?.orderNumber}</strong> в выбранную систему ЭДО.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Общая сумма: <strong>{order?.totalAmount.toLocaleString()} сўм</strong>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  disabled={syncing}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {syncing ? 'Синхронизация...' : 'Синхронизировать с ЭДО'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEdoModal(false)}
                  disabled={syncing}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Assignment Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {order.delivery ? 'Изменить назначение доставки' : 'Назначить доставку'}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                assignDelivery()
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Водитель</label>
                  <select
                    value={deliveryForm.driverId}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, driverId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Выберите водителя</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} - {driver.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Транспорт</label>
                  <select
                    value={deliveryForm.vehicleId}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Выберите транспорт</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plateNumber} - {vehicle.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Запланированная дата и время
                  </label>
                  <DatePicker
                    value={deliveryForm.scheduledDate}
                    onChange={(date) =>
                      setDeliveryForm({ ...deliveryForm, scheduledDate: date })
                    }
                    enableTime={true}
                    placeholder="Выберите дату и время"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Примечания</label>
                  <textarea
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="Инструкции по доставке, особые требования и т.д."
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  disabled={assigningDelivery}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {assigningDelivery ? 'Сохранение...' : order.delivery ? 'Обновить' : 'Назначить'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  disabled={assigningDelivery}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
