"use client"

import { useEffect, useState } from 'react'
import { Plus, Users, Truck, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FleetStatsBar } from '@/components/fleet/FleetStatsBar'
import { VehicleCard } from '@/components/fleet/VehicleCard'
import { VehicleEditor } from '@/components/fleet/VehicleEditor'
import { DriverTable, Driver } from '@/components/fleet/DriverTable'
import { DriverEditor } from '@/components/fleet/DriverEditor'
import { useI18n } from '@/locales/client'

interface Vehicle {
  id: string
  plateNumber: string
  model: string
  type: string
  capacity: number | null
  status: string
  driverId: string | null
  driver: {
    id: string
    name: string
  } | null
  _count: {
    deliveries: number
  }
  currentLoad?: {
    weight: number
    percentage: number
    itemCount: number
  } | null
}

export default function FleetPage() {
  const t = useI18n()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  // Filter State
  const [driverSearchQuery, setDriverSearchQuery] = useState('')
  const [driverStatusFilter, setDriverStatusFilter] = useState('ALL')

  // Editor State
  const [isVehicleEditorOpen, setIsVehicleEditorOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  const [isDriverEditorOpen, setIsDriverEditorOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<any>(null)

  // --- Vehicle Handlers ---

  const handleEditVehicle = (id: string) => {
    const vehicle = vehicles.find(v => v.id === id)
    if (vehicle) {
      setEditingVehicle(vehicle)
      setIsVehicleEditorOpen(true)
    }
  }

  const handleAddVehicle = () => {
    setEditingVehicle(null)
    setIsVehicleEditorOpen(true)
  }

  const handleSaveVehicle = async (data: any) => {
    try {
      const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles'
      const method = editingVehicle ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to save vehicle')

      await fetchData()
      setIsVehicleEditorOpen(false)
    } catch (error) {
      console.error('Error saving vehicle:', error)
      alert('Failed to save vehicle')
    }
  }

  // --- Driver Handlers ---

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver)
    setIsDriverEditorOpen(true)
  }

  const handleOnboardDriver = () => {
    setEditingDriver(null)
    setIsDriverEditorOpen(true)
  }

  const handleSaveDriver = async (data: any) => {
    try {
      const url = editingDriver ? `/api/drivers/${editingDriver.id}` : '/api/drivers'
      const method = editingDriver ? 'PATCH' : 'POST'

      // Format date for API
      const payload = {
        ...data,
        licenseExpiry: data.licenseExpiry ? data.licenseExpiry.toISOString() : null
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to save driver')

      await fetchData()
      setIsDriverEditorOpen(false)
    } catch (error) {
      console.error('Error saving driver:', error)
      alert('Failed to save driver')
    }
  }

  // --- Data Loading ---

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        fetch('/api/drivers', { credentials: 'include' })

        fetch('/api/vehicles')
      ])

      const driversData = await driversRes.json()
      const vehiclesData = await vehiclesRes.json()

      // Transform Drivers
      const driversArray = Array.isArray(driversData.drivers || driversData) ? (driversData.drivers || driversData) : []
      const formattedDrivers = driversArray.map((d: any) => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        email: d.email,
        licenseNumber: d.licenseNumber,
        licenseExpiry: d.licenseExpiry,
        status: d.status,
        vehicle: d.vehicles && d.vehicles.length > 0 ? d.vehicles[0] : null
      }))
      setDrivers(formattedDrivers)

      // Set Vehicles
      setVehicles(Array.isArray(vehiclesData.vehicles || vehiclesData) ? (vehiclesData.vehicles || vehiclesData) : [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- Filtering ---

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch =
      driver.name.toLowerCase().includes(driverSearchQuery.toLowerCase()) ||
      driver.licenseNumber.toLowerCase().includes(driverSearchQuery.toLowerCase())

    const matchesStatus = driverStatusFilter === 'ALL' || driver.status === driverStatusFilter

    return matchesSearch && matchesStatus
  })

  // --- Stats ---

  const vehicleStats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'AVAILABLE').length,
    inUse: vehicles.filter(v => v.status === 'IN_USE').length,
    maintenance: vehicles.filter(v => v.status === 'MAINTENANCE').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-sm font-medium text-slate-500">{t('Fleet.loadingData')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('Fleet.title')}</h1>
              <p className="text-sm text-slate-500 mt-1">{t('Fleet.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Removed "Manage Drivers" button */}
              <Button onClick={handleAddVehicle} className="gap-2 bg-sky-600 hover:bg-sky-700 text-white shadow-sm">
                <Plus className="h-4 w-4" />
                {t('Fleet.addVehicle')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Metric Strip */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <FleetStatsBar
            total={vehicleStats.total}
            available={vehicleStats.available}
            inUse={vehicleStats.inUse}
            maintenance={vehicleStats.maintenance}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="vehicles" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg h-auto shadow-sm">
              <TabsTrigger value="vehicles" className="gap-2 px-4 py-2 text-sm data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700 data-[state=active]:font-semibold">
                <Truck className="h-4 w-4" /> {t('Fleet.tabs.vehicles')}
              </TabsTrigger>
              <TabsTrigger value="drivers" className="gap-2 px-4 py-2 text-sm data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700 data-[state=active]:font-semibold">
                <Users className="h-4 w-4" /> {t('Fleet.tabs.drivers')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="vehicles" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  id={vehicle.id}
                  plateNumber={vehicle.plateNumber}
                  model={vehicle.model}
                  type={vehicle.type}
                  status={vehicle.status}
                  driverName={vehicle.driver?.name}
                  deliveryCount={vehicle._count.deliveries}
                  capacity={vehicle.capacity}
                  currentLoad={vehicle.currentLoad}
                  onEdit={handleEditVehicle}
                />
              ))}
              {vehicles.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Truck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">{t('Fleet.vehicles.emptyTitle')}</p>
                  <Button variant="link" className="text-sky-600 mt-2" onClick={handleAddVehicle}>{t('Fleet.vehicles.emptyAction')}</Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="drivers" className="mt-0 space-y-6">
            {/* Driver Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={t('Fleet.drivers.searchPlaceholder')}
                  className="pl-9 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  value={driverSearchQuery}
                  onChange={(e) => setDriverSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <select
                    className="h-10 pl-9 pr-4 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                    value={driverStatusFilter}
                    onChange={(e) => setDriverStatusFilter(e.target.value)}
                  >
                    <option value="ALL">{t('Fleet.drivers.filterAll')}</option>
                    <option value="ACTIVE">{t('Fleet.drivers.filterActive')}</option>
                    <option value="ON_LEAVE">{t('Fleet.drivers.filterOnLeave')}</option>
                    <option value="INACTIVE">{t('Fleet.drivers.filterInactive')}</option>
                  </select>
                </div>
                <Button onClick={handleOnboardDriver} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm ml-2">
                  <Plus className="h-4 w-4" />
                  {t('Fleet.drivers.onboardDriver')}
                </Button>
              </div>
            </div>

            {/* Driver Table */}
            <DriverTable data={filteredDrivers} onEdit={handleEditDriver} />
          </TabsContent>
        </Tabs>
      </div>

      <VehicleEditor
        open={isVehicleEditorOpen}
        onOpenChange={setIsVehicleEditorOpen}
        initialData={editingVehicle}
        drivers={drivers}
        onSave={handleSaveVehicle}
      />

      <DriverEditor
        open={isDriverEditorOpen}
        onOpenChange={setIsDriverEditorOpen}
        initialData={editingDriver}
        onSave={handleSaveDriver}
      />
    </div>
  )
}
