'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Driver {
  id: string
  name: string
}

interface Vehicle {
  id: string
  plateNumber: string
  model: string
  type: string
  capacity: number | null
  status: string
  driverId: string | null
  notes: string | null
  driver: Driver | null
  _count: {
    deliveries: number
  }
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [formData, setFormData] = useState({
    plateNumber: '',
    model: '',
    type: 'VAN',
    capacity: '',
    status: 'AVAILABLE',
    driverId: '',
    notes: '',
  })

  useEffect(() => {
    fetchVehicles()
    fetchDrivers()
  }, [])

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      const data = await response.json()
      const vehiclesArray = data.vehicles || data
      setVehicles(Array.isArray(vehiclesArray) ? vehiclesArray : [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers')
      const data = await response.json()
      const driversArray = data.drivers || data
      const activeDrivers = Array.isArray(driversArray)
        ? driversArray.filter((d: any) => d.status === 'ACTIVE')
        : []
      setDrivers(activeDrivers)
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles'
      const method = editingVehicle ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? parseFloat(formData.capacity) : null,
          driverId: formData.driverId || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to save vehicle')

      await fetchVehicles()
      setShowAddModal(false)
      setEditingVehicle(null)
      setFormData({
        plateNumber: '',
        model: '',
        type: 'VAN',
        capacity: '',
        status: 'AVAILABLE',
        driverId: '',
        notes: '',
      })
    } catch (error) {
      console.error('Error saving vehicle:', error)
      alert('Не удалось сохранить транспорт')
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      plateNumber: vehicle.plateNumber,
      model: vehicle.model,
      type: vehicle.type,
      capacity: vehicle.capacity?.toString() || '',
      status: vehicle.status,
      driverId: vehicle.driverId || '',
      notes: vehicle.notes || '',
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот транспорт?')) return

    try {
      const response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete vehicle')
      await fetchVehicles()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      alert('Не удалось удалить транспорт')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_USE':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'RETIRED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Доступен'
      case 'IN_USE': return 'В работе'
      case 'MAINTENANCE': return 'На обслуживании'
      case 'RETIRED': return 'Выведен'
      default: return status
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'VAN': return 'Фургон'
      case 'TRUCK': return 'Грузовик'
      case 'REFRIGERATED_VAN': return 'Рефрижератор (фургон)'
      case 'REFRIGERATED_TRUCK': return 'Рефрижератор (грузовик)'
      default: return type
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VAN': return '🚐'
      case 'TRUCK': return '🚚'
      case 'REFRIGERATED_VAN': return '🧊🚐'
      case 'REFRIGERATED_TRUCK': return '🧊🚚'
      default: return '🚗'
    }
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.driver?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || vehicle.status === statusFilter
    const matchesType = typeFilter === 'ALL' || vehicle.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'AVAILABLE').length,
    inUse: vehicles.filter(v => v.status === 'IN_USE').length,
    maintenance: vehicles.filter(v => v.status === 'MAINTENANCE').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-gray-600 text-center py-12">Загрузка...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🚗 Транспорт</h1>
              <p className="text-gray-600 mt-1">Управление автопарком</p>
            </div>
            <button
              onClick={() => {
                setEditingVehicle(null)
                setFormData({
                  plateNumber: '',
                  model: '',
                  type: 'VAN',
                  capacity: '',
                  status: 'AVAILABLE',
                  driverId: '',
                  notes: '',
                })
                setShowAddModal(true)
              }}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium shadow-sm flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Добавить транспорт
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Всего транспорта</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="bg-indigo-100 rounded-full p-4">
                <span className="text-3xl">🚗</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Доступно</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.available}</p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <span className="text-3xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">В работе</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.inUse}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <span className="text-3xl">🚚</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">На ремонте</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.maintenance}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-4">
                <span className="text-3xl">🔧</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="🔍 Поиск по номеру, модели, водителю..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Все статусы</option>
              <option value="AVAILABLE">Доступен</option>
              <option value="IN_USE">В работе</option>
              <option value="MAINTENANCE">На обслуживании</option>
              <option value="RETIRED">Выведен</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Все типы</option>
              <option value="VAN">Фургон</option>
              <option value="TRUCK">Грузовик</option>
              <option value="REFRIGERATED_VAN">Рефрижератор (фургон)</option>
              <option value="REFRIGERATED_TRUCK">Рефрижератор (грузовик)</option>
            </select>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Найдено: <span className="font-semibold">{filteredVehicles.length}</span> из {vehicles.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 rounded-lg font-medium ${viewMode === 'cards' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
              >
                📋 Карточки
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg font-medium ${viewMode === 'table' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
              >
                📊 Таблица
              </button>
            </div>
          </div>
        </div>

        {/* Cards View */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
                <div className={`h-2 ${vehicle.status === 'AVAILABLE' ? 'bg-green-500' : vehicle.status === 'IN_USE' ? 'bg-blue-500' : vehicle.status === 'MAINTENANCE' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{getTypeIcon(vehicle.type)}</span>
                      <div>
                        <Link href={`/vehicles/${vehicle.id}`} className="text-xl font-bold text-gray-900 hover:text-indigo-600 font-mono">
                          {vehicle.plateNumber}
                        </Link>
                        <p className="text-sm text-gray-600">{vehicle.model}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Тип:</span>
                      <span className="font-medium text-gray-900">{getTypeLabel(vehicle.type)}</span>
                    </div>

                    {vehicle.capacity && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Грузоподъемность:</span>
                        <span className="font-medium text-gray-900">{vehicle.capacity} кг</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Водитель:</span>
                      <span className="font-medium text-gray-900">{vehicle.driver?.name || '—'}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Доставок:</span>
                      <span className="font-medium text-gray-900">{vehicle._count.deliveries}</span>
                    </div>

                    <div className="pt-3 border-t">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(vehicle.status)}`}>
                        {getStatusLabel(vehicle.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <button
                      onClick={() => handleEdit(vehicle)}
                      className="flex-1 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium text-sm"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Номер</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Модель</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Тип</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Грузоподъемность</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Статус</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Водитель</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Доставок</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/vehicles/${vehicle.id}`} className="text-indigo-600 hover:text-indigo-900 font-bold font-mono">
                        {vehicle.plateNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getTypeLabel(vehicle.type)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.capacity ? `${vehicle.capacity} кг` : '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(vehicle.status)}`}>
                        {getStatusLabel(vehicle.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.driver?.name || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle._count.deliveries}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button onClick={() => handleEdit(vehicle)} className="text-indigo-600 hover:text-indigo-900 mr-4 font-medium">
                        Изменить
                      </button>
                      <button onClick={() => handleDelete(vehicle.id)} className="text-red-600 hover:text-red-900 font-medium">
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredVehicles.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Транспорт не найден
              </div>
            )}
          </div>
        )}

        {vehicles.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <span className="text-6xl mb-4 block">🚗</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет транспорта</h3>
            <p className="text-gray-600 mb-6">Добавьте первый транспорт для начала работы</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
            >
              + Добавить транспорт
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingVehicle ? 'Редактировать транспорт' : 'Добавить транспорт'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Гос. номер *</label>
                  <input
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono uppercase text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500"
                    placeholder="01 A 123 BC"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Модель *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500"
                    placeholder="DAMAS-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Тип транспорта</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="VAN">🚐 Фургон</option>
                    <option value="TRUCK">🚚 Грузовик</option>
                    <option value="REFRIGERATED_VAN">🧊🚐 Рефрижератор (фургон)</option>
                    <option value="REFRIGERATED_TRUCK">🧊🚚 Рефрижератор (грузовик)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Грузоподъемность (кг)</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500"
                    placeholder="1000"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="AVAILABLE">✅ Доступен</option>
                    <option value="IN_USE">🚚 В работе</option>
                    <option value="MAINTENANCE">🔧 На обслуживании</option>
                    <option value="RETIRED">❌ Выведен</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Водитель</label>
                  <select
                    value={formData.driverId}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Не назначен</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Примечания</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Дополнительная информация..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
                >
                  {editingVehicle ? 'Сохранить изменения' : 'Добавить транспорт'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingVehicle(null)
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
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
