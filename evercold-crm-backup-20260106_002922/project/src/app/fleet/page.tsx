'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Driver {
  id: string
  name: string
  phone: string
  email: string | null
  licenseNumber: string
  licenseExpiry: string | null
  status: string
  notes: string | null
  vehicles: Array<{
    id: string
    plateNumber: string
    model: string
  }>
  _count: {
    deliveries: number
  }
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
  driver: {
    id: string
    name: string
  } | null
  _count: {
    deliveries: number
  }
}

export default function FleetPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        fetch('/api/drivers'),
        fetch('/api/vehicles')
      ])

      const driversData = await driversRes.json()
      const vehiclesData = await vehiclesRes.json()

      setDrivers(Array.isArray(driversData.drivers || driversData) ? (driversData.drivers || driversData) : [])
      setVehicles(Array.isArray(vehiclesData.vehicles || vehiclesData) ? (vehiclesData.vehicles || vehiclesData) : [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
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

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = !searchQuery ||
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driver?.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery) ||
      d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const vehicleStats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'AVAILABLE').length,
    inUse: vehicles.filter(v => v.status === 'IN_USE').length,
    maintenance: vehicles.filter(v => v.status === 'MAINTENANCE').length,
  }

  const driverStats = {
    total: drivers.length,
    active: drivers.filter(d => d.status === 'ACTIVE').length,
    onLeave: drivers.filter(d => d.status === 'ON_LEAVE').length,
    inactive: drivers.filter(d => d.status === 'INACTIVE').length,
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
      <div className="bg-white border-b text-gray-900 placeholder:text-gray-500">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🚛 Управление автопарком</h1>
              <p className="text-gray-600 mt-1">Транспорт и водители</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 text-gray-900 placeholder:text-gray-500">
          <button
            onClick={() => {
              setActiveTab('vehicles')
              setSearchQuery('')
              setStatusFilter('ALL')
            }}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'vehicles'
                ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🚗 Транспорт ({vehicles.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('drivers')
              setSearchQuery('')
              setStatusFilter('ALL')
            }}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'drivers'
                ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👨‍✈️ Водители ({drivers.length})
          </button>
        </div>

        {/* Vehicles Tab */}
        {activeTab === 'vehicles' && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-gray-900 placeholder:text-gray-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Всего транспорта</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{vehicleStats.total}</p>
                  </div>
                  <div className="bg-indigo-100 rounded-full p-4">
                    <span className="text-3xl">🚗</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-gray-900 placeholder:text-gray-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Доступно</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{vehicleStats.available}</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-4">
                    <span className="text-3xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-gray-900 placeholder:text-gray-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">В работе</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{vehicleStats.inUse}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-4">
                    <span className="text-3xl">🚚</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-gray-900 placeholder:text-gray-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">На ремонте</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{vehicleStats.maintenance}</p>
                  </div>
                  <div className="bg-orange-100 rounded-full p-4">
                    <span className="text-3xl">🔧</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6 text-gray-900 placeholder:text-gray-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="🔍 Поиск по номеру, модели, водителю..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder:text-gray-500"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                >
                  <option value="ALL">Все статусы</option>
                  <option value="AVAILABLE">Доступен</option>
                  <option value="IN_USE">В работе</option>
                  <option value="MAINTENANCE">На обслуживании</option>
                </select>
                <div className="flex gap-2">
                  <Link
                    href="/vehicles"
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-center font-medium"
                  >
                    📋 Управление транспортом
                  </Link>
                </div>
              </div>
            </div>

            {/* Vehicles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow text-gray-900 placeholder:text-gray-500">
                  <div className={`h-2 rounded-t-xl ${
                    vehicle.status === 'AVAILABLE' ? 'bg-green-500' :
                    vehicle.status === 'IN_USE' ? 'bg-blue-500' :
                    'bg-orange-500'
                  }`}></div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">{getTypeIcon(vehicle.type)}</span>
                      <div>
                        <Link
                          href={`/vehicles/${vehicle.id}`}
                          className="text-xl font-bold font-mono text-gray-900 hover:text-indigo-600"
                        >
                          {vehicle.plateNumber}
                        </Link>
                        <p className="text-sm text-gray-600">{vehicle.model}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Тип:</span>
                        <span className="font-medium text-gray-900">
                          {vehicle.type === 'VAN' ? 'Фургон' : vehicle.type === 'TRUCK' ? 'Грузовик' : vehicle.type}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Водитель:</span>
                        <span className="font-medium text-gray-900">{vehicle.driver?.name || '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Доставок:</span>
                        <span className="font-medium text-gray-900">{vehicle._count.deliveries}</span>
                      </div>
                    </div>

                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      vehicle.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                      vehicle.status === 'IN_USE' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {vehicle.status === 'AVAILABLE' ? 'Доступен' :
                       vehicle.status === 'IN_USE' ? 'В работе' :
                       'На обслуживании'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Drivers Tab */}
        {activeTab === 'drivers' && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-gray-900 placeholder:text-gray-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Всего водителей</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{driverStats.total}</p>
                  </div>
                  <div className="bg-indigo-100 rounded-full p-4">
                    <span className="text-3xl">👥</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-gray-900 placeholder:text-gray-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Активные</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{driverStats.active}</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-4">
                    <span className="text-3xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-gray-900 placeholder:text-gray-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">В отпуске</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{driverStats.onLeave}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-4">
                    <span className="text-3xl">🏖️</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-gray-900 placeholder:text-gray-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Неактивные</p>
                    <p className="text-3xl font-bold text-gray-600 mt-2">{driverStats.inactive}</p>
                  </div>
                  <div className="bg-gray-100 rounded-full p-4">
                    <span className="text-3xl">⏸️</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6 text-gray-900 placeholder:text-gray-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="🔍 Поиск по имени, телефону, номеру лицензии..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder:text-gray-500"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                >
                  <option value="ALL">Все статусы</option>
                  <option value="ACTIVE">Активный</option>
                  <option value="ON_LEAVE">В отпуске</option>
                  <option value="INACTIVE">Неактивный</option>
                </select>
                <div className="flex gap-2">
                  <Link
                    href="/drivers"
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-center font-medium"
                  >
                    📋 Управление водителями
                  </Link>
                </div>
              </div>
            </div>

            {/* Drivers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrivers.map((driver) => (
                <div key={driver.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow text-gray-900 placeholder:text-gray-500">
                  <div className={`h-2 rounded-t-xl ${
                    driver.status === 'ACTIVE' ? 'bg-green-500' :
                    driver.status === 'ON_LEAVE' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-indigo-100 rounded-full p-3">
                        <span className="text-3xl">👨‍✈️</span>
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/drivers/${driver.id}`}
                          className="text-lg font-bold text-gray-900 hover:text-indigo-600 block"
                        >
                          {driver.name}
                        </Link>
                        <p className="text-sm text-gray-600">{driver.phone}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Лицензия:</span>
                        <span className="font-medium font-mono text-gray-900">{driver.licenseNumber}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Транспорт:</span>
                        <span className="font-medium text-gray-900">{driver.vehicles.length > 0 ? driver.vehicles[0].plateNumber : '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Доставок:</span>
                        <span className="font-medium text-gray-900">{driver._count.deliveries}</span>
                      </div>
                    </div>

                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      driver.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      driver.status === 'ON_LEAVE' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {driver.status === 'ACTIVE' ? 'Активен' :
                       driver.status === 'ON_LEAVE' ? 'В отпуске' :
                       'Неактивен'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
