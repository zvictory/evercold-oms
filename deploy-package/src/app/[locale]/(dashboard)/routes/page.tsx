'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DistanceCalculator } from '@/lib/distanceCalculator';
import DatePicker from '@/components/DatePicker';

interface Delivery {
  id: string;
  orderId: string;
  status: string;
  scheduledDate: string | null;
  order: {
    orderNumber: string;
    orderDate: string;
    customer: {
      name: string;
    };
    orderItems: Array<{
      branchId: string;
      branch: {
        branchName: string;
        deliveryAddress: string;
        latitude: number | null;
        longitude: number | null;
      };
    }>;
  };
}

interface Route {
  id: string;
  routeName: string;
  scheduledDate: string;
  status: string;
  totalDistance: number | null;
  estimatedDuration: number | null;
  notes: string | null;
  driver: {
    id: string;
    name: string;
  };
  vehicle: {
    id: string;
    plateNumber: string;
  };
  stops: Array<{
    id: string;
    status: string;
  }>;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  licenseNumber: string;
  status: string;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  type: string;
  status: string;
}

export default function RoutesPage() {
  const router = useRouter();
  const t = useTranslations('Logistics');
  const [activeTab, setActiveTab] = useState<'routes' | 'create' | 'drivers' | 'vehicles'>('routes');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState<Set<string>>(new Set());
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [optimizing, setOptimizing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inline edit states
  const [editingRoute, setEditingRoute] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  // New item states
  const [addingDriver, setAddingDriver] = useState(false);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [newDriverData, setNewDriverData] = useState({
    name: '',
    phone: '',
    email: '',
    licenseNumber: '',
    licenseExpiry: '',
  });
  const [newVehicleData, setNewVehicleData] = useState({
    plateNumber: '',
    model: '',
    type: 'VAN' as const,
    capacity: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [routesRes, deliveriesRes, driversRes, vehiclesRes] = await Promise.all([
        fetch('/api/routes', { credentials: 'include' }),
        fetch('/api/deliveries?status=PENDING', { credentials: 'include' }),
        fetch('/api/drivers', { credentials: 'include' }),
        fetch('/api/vehicles', { credentials: 'include' }),
      ]);

      if (routesRes.ok) {
        const routesData = await routesRes.json();
        setRoutes(routesData.routes || []);
      }

      if (deliveriesRes.ok) {
        const deliveriesData = await deliveriesRes.json();
        setPendingDeliveries(deliveriesData.deliveries || []);
      }

      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(driversData.drivers || []);
      }

      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        setVehicles(vehiclesData.vehicles || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDeliverySelection = (deliveryId: string) => {
    const newSelection = new Set(selectedDeliveries);
    if (newSelection.has(deliveryId)) {
      newSelection.delete(deliveryId);
    } else {
      newSelection.add(deliveryId);
    }
    setSelectedDeliveries(newSelection);
  };

  const createOptimizedRoute = async () => {
    if (selectedDeliveries.size === 0) {
      alert(t('errors.noDeliveriesSelected'));
      return;
    }

    if (!selectedDriver || !selectedVehicle) {
      alert(t('errors.noDriverSelected'));
      return;
    }

    try {
      setOptimizing(true);

      const response = await fetch('/api/routes/optimize', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryIds: Array.from(selectedDeliveries),
          driverId: selectedDriver,
          vehicleId: selectedVehicle,
          scheduledDate,
          returnToDepot: true,
          saveRoute: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create route');
      }

      const data = await response.json();

      alert(`${t('success.routeCreated')}\nDistance: ${data.summary.totalDistance}\nTime: ${data.summary.estimatedTime}`);

      setSelectedDeliveries(new Set());
      setSelectedDriver('');
      setSelectedVehicle('');
      setActiveTab('routes');
      await fetchData();
    } catch (error) {
      console.error('Error creating route:', error);
      alert(`${t('errors.failedToCreateRoute')}: ${(error as Error).message}`);
    } finally {
      setOptimizing(false);
    }
  };

  // Route CRUD operations
  const startEditRoute = (route: Route) => {
    setEditingRoute(route.id);
    setEditFormData({
      routeName: route.routeName,
      notes: route.notes || '',
      scheduledDate: route.scheduledDate.split('T')[0],
    });
  };

  const cancelEditRoute = () => {
    setEditingRoute(null);
    setEditFormData({});
  };

  const saveRoute = async (routeId: string) => {
    try {
      const response = await fetch(`/api/routes/${routeId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) throw new Error('Failed to update route');

      await fetchData();
      setEditingRoute(null);
      setEditFormData({});
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  };

  const deleteRoute = async (routeId: string) => {
    if (!confirm(t('confirmations.deleteRoute'))) return;

    try {
      const response = await fetch(`/api/routes/${routeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete route');
      }

      await fetchData();
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  };

  // Driver CRUD operations
  const startEditDriver = (driver: Driver) => {
    setEditingDriver(driver.id);
    setEditFormData({
      name: driver.name,
      phone: driver.phone,
      email: driver.email || '',
      licenseNumber: driver.licenseNumber,
      status: driver.status,
    });
  };

  const cancelEditDriver = () => {
    setEditingDriver(null);
    setEditFormData({});
  };

  const saveDriver = async (driverId: string) => {
    try {
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) throw new Error('Failed to update driver');

      await fetchData();
      setEditingDriver(null);
      setEditFormData({});
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  };

  const createDriver = async () => {
    try {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDriverData),
      });

      if (!response.ok) throw new Error('Failed to create driver');

      await fetchData();
      setAddingDriver(false);
      setNewDriverData({
        name: '',
        phone: '',
        email: '',
        licenseNumber: '',
        licenseExpiry: '',
      });
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  };

  const deleteDriver = async (driverId: string) => {
    if (!confirm(t('confirmations.deleteDriver'))) return;

    try {
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete driver');
      }

      await fetchData();
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  };

  // Vehicle CRUD operations
  const startEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle.id);
    setEditFormData({
      plateNumber: vehicle.plateNumber,
      model: vehicle.model,
      type: vehicle.type,
      status: vehicle.status,
    });
  };

  const cancelEditVehicle = () => {
    setEditingVehicle(null);
    setEditFormData({});
  };

  const saveVehicle = async (vehicleId: string) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) throw new Error('Failed to update vehicle');

      await fetchData();
      setEditingVehicle(null);
      setEditFormData({});
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  };

  const createVehicle = async () => {
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehicleData),
      });

      if (!response.ok) throw new Error('Failed to create vehicle');

      await fetchData();
      setAddingVehicle(false);
      setNewVehicleData({
        plateNumber: '',
        model: '',
        type: 'VAN',
        capacity: '',
      });
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    if (!confirm(t('confirmations.deleteVehicle'))) return;

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete vehicle');
      }

      await fetchData();
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PLANNED: 'bg-blue-50 text-blue-700 border-blue-200',
      IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
      COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      CANCELLED: 'bg-red-50 text-red-700 border-red-200',
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      INACTIVE: 'bg-slate-50 text-slate-700 border-slate-200',
      AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      IN_USE: 'bg-amber-50 text-amber-700 border-amber-200',
      MAINTENANCE: 'bg-orange-50 text-orange-700 border-orange-200',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">{t('filters.all')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">{t('routes.title')}</h1>
          <p className="text-slate-600">{t('routes.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('routes')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'routes'
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {t('routes.routesList')} ({routes.length})
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'create'
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {t('routes.createRoute')} ({pendingDeliveries.length} {t('routes.pendingDeliveries')})
              </button>
              <button
                onClick={() => setActiveTab('drivers')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'drivers'
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {t('routes.driversTab')} ({drivers.length})
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'vehicles'
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {t('routes.vehiclesTab')} ({vehicles.length})
              </button>
              <div className="ml-auto flex items-center">
                <button
                  onClick={() => router.push('/branches')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium shadow-sm"
                >
                  {t('routes.viewBranches')}
                </button>
              </div>
            </nav>
          </div>

          {/* Routes Tab */}
          {activeTab === 'routes' && (
            <div className="p-6">
              {routes.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="mt-4 text-slate-500">No routes created yet</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 shadow-sm"
                  >
                    {t('routes.createRoute')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {routes.map((route) => {
                    const isEditing = editingRoute === route.id;
                    const completedStops = route.stops.filter((s) => s.status === 'COMPLETED').length;
                    const totalStops = route.stops.length;
                    const progressPercent = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

                    return (
                      <div key={route.id} className="border border-slate-200 rounded-lg p-4">
                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.routeName')}</label>
                                <input
                                  type="text"
                                  value={editFormData.routeName || ''}
                                  onChange={(e) => setEditFormData({ ...editFormData, routeName: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.scheduledDate')}</label>
                                <DatePicker
                                  value={editFormData.scheduledDate || ''}
                                  onChange={(date) => setEditFormData({ ...editFormData, scheduledDate: date })}
                                  placeholder="Выберите дату"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-600 cursor-pointer"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.notes')}</label>
                              <textarea
                                value={editFormData.notes || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveRoute(route.id)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
                              >
                                {t('routes.save')}
                              </button>
                              <button
                                onClick={cancelEditRoute}
                                className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                              >
                                {t('routes.cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-slate-900">{route.routeName}</h3>
                                {getStatusBadge(route.status)}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                                <div>
                                  <span className="font-medium">Driver:</span> {route.driver.name}
                                </div>
                                <div>
                                  <span className="font-medium">Vehicle:</span> {route.vehicle.plateNumber}
                                </div>
                                <div>
                                  <span className="font-medium">Date:</span> {new Date(route.scheduledDate).toLocaleDateString()}
                                </div>
                                <div>
                                  <span className="font-medium">Stops:</span> {totalStops}
                                </div>
                              </div>

                              {route.totalDistance && (
                                <div className="mt-2 text-sm text-slate-600">
                                  <span className="font-medium">Distance:</span> {DistanceCalculator.formatDistance(route.totalDistance)}
                                  {route.estimatedDuration && (
                                    <>
                                      {' • '}
                                      <span className="font-medium">Est. Time:</span> {DistanceCalculator.formatDuration(route.estimatedDuration)}
                                    </>
                                  )}
                                </div>
                              )}

                              {route.status === 'IN_PROGRESS' && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-slate-600">{completedStops} of {totalStops} completed</span>
                                    <span className="text-slate-600">{Math.round(progressPercent)}%</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div className="bg-sky-600 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="ml-4 flex gap-2">
                              <button
                                onClick={() => router.push(`/routes/${route.id}`)}
                                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm"
                              >
                                View
                              </button>
                              {route.status === 'PLANNED' && (
                                <>
                                  <button
                                    onClick={() => startEditRoute(route)}
                                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteRoute(route.id)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Create Route Tab */}
          {activeTab === 'create' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    {t('routes.selectDeliveries')} ({selectedDeliveries.size} selected)
                  </h2>

                  {pendingDeliveries.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
                      <p className="text-slate-500">No pending deliveries available</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {pendingDeliveries.map((delivery) => {
                        const isSelected = selectedDeliveries.has(delivery.id);
                        const branch = delivery.order.orderItems[0]?.branch;
                        const hasCoordinates = branch?.latitude && branch?.longitude;

                        return (
                          <div
                            key={delivery.id}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                              isSelected ? 'border-sky-600 bg-sky-50' : 'border-slate-200 hover:border-slate-300'
                            } ${!hasCoordinates ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => hasCoordinates && toggleDeliverySelection(delivery.id)}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!hasCoordinates}
                                onChange={() => hasCoordinates && toggleDeliverySelection(delivery.id)}
                                className="mt-1 h-4 w-4 text-sky-600 rounded"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-medium text-slate-900">{delivery.order.orderNumber}</h3>
                                  <span className="text-xs text-slate-500">{new Date(delivery.order.orderDate).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-slate-600">{delivery.order.customer.name}</p>
                                {branch && <p className="text-sm text-slate-600">{branch.branchName} - {branch.deliveryAddress}</p>}
                                {!hasCoordinates && <p className="text-xs text-red-600 mt-1">⚠️ No coordinates available</p>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-slate-50/50 rounded-lg p-4 sticky top-4 border border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('optimization.routeDetails')}</h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('routes.driver')}</label>
                        <select
                          value={selectedDriver}
                          onChange={(e) => setSelectedDriver(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-600"
                        >
                          <option value="">{t('routes.selectDriver')}</option>
                          {drivers.filter(d => d.status === 'ACTIVE').map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} - {driver.phone}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('routes.vehicle')}</label>
                        <select
                          value={selectedVehicle}
                          onChange={(e) => setSelectedVehicle(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-600"
                        >
                          <option value="">{t('routes.selectVehicle')}</option>
                          {vehicles.filter(v => v.status === 'AVAILABLE').map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.plateNumber} - {vehicle.model}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('routes.scheduledDate')}</label>
                        <DatePicker
                          value={scheduledDate}
                          onChange={setScheduledDate}
                          placeholder="Выберите дату"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-600 cursor-pointer"
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-200">
                        <div className="text-sm text-slate-600 space-y-2">
                          <div className="flex justify-between">
                            <span>Selected Deliveries:</span>
                            <span className="font-medium">{selectedDeliveries.size}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={createOptimizedRoute}
                        disabled={selectedDeliveries.size === 0 || !selectedDriver || !selectedVehicle || optimizing}
                        className="w-full px-4 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium shadow-sm"
                      >
                        {optimizing ? t('optimization.optimizing') : t('routes.createOptimized')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Drivers Tab */}
          {activeTab === 'drivers' && (
            <div className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-900">{t('routes.driversTab')} ({drivers.length})</h2>
                <button
                  onClick={() => setAddingDriver(true)}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 shadow-sm"
                >
                  + {t('routes.addDriver')}
                </button>
              </div>

              {addingDriver && (
                <div className="mb-4 border-2 border-sky-500 rounded-lg p-4 bg-sky-50">
                  <h3 className="font-semibold text-slate-900 mb-3">{t('routes.newDriver')}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.name')} *</label>
                      <input
                        type="text"
                        value={newDriverData.name}
                        onChange={(e) => setNewDriverData({ ...newDriverData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.phone')} *</label>
                      <input
                        type="tel"
                        value={newDriverData.phone}
                        onChange={(e) => setNewDriverData({ ...newDriverData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.email')}</label>
                      <input
                        type="email"
                        value={newDriverData.email}
                        onChange={(e) => setNewDriverData({ ...newDriverData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.licenseNumber')} *</label>
                      <input
                        type="text"
                        value={newDriverData.licenseNumber}
                        onChange={(e) => setNewDriverData({ ...newDriverData, licenseNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={createDriver}
                      disabled={!newDriverData.name || !newDriverData.phone || !newDriverData.licenseNumber}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 shadow-sm"
                    >
                      {t('routes.create')}
                    </button>
                    <button
                      onClick={() => {
                        setAddingDriver(false);
                        setNewDriverData({ name: '', phone: '', email: '', licenseNumber: '', licenseExpiry: '' });
                      }}
                      className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                    >
                      {t('routes.cancel')}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {drivers.map((driver) => {
                  const isEditing = editingDriver === driver.id;

                  return (
                    <div key={driver.id} className="border border-slate-200 rounded-lg p-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.name')}</label>
                              <input
                                type="text"
                                value={editFormData.name || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.phone')}</label>
                              <input
                                type="tel"
                                value={editFormData.phone || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.email')}</label>
                              <input
                                type="email"
                                value={editFormData.email || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.status')}</label>
                              <select
                                value={editFormData.status || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                              >
                                <option value="ACTIVE">{t('drivers.active')}</option>
                                <option value="INACTIVE">{t('drivers.inactive')}</option>
                                <option value="ON_LEAVE">On Leave</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveDriver(driver.id)}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
                            >
                              {t('routes.save')}
                            </button>
                            <button
                              onClick={cancelEditDriver}
                              className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                            >
                              {t('routes.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-900">{driver.name}</h3>
                              {getStatusBadge(driver.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                              <div>
                                <span className="font-medium">Phone:</span> {driver.phone}
                              </div>
                              <div>
                                <span className="font-medium">Email:</span> {driver.email || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">License:</span> {driver.licenseNumber}
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 flex gap-2">
                            <button
                              onClick={() => startEditDriver(driver)}
                              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm shadow-sm"
                            >
                              {t('routes.edit')}
                            </button>
                            <button
                              onClick={() => deleteDriver(driver.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm shadow-sm"
                            >
                              {t('routes.delete')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vehicles Tab */}
          {activeTab === 'vehicles' && (
            <div className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-900">{t('routes.vehiclesTab')} ({vehicles.length})</h2>
                <button
                  onClick={() => setAddingVehicle(true)}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 shadow-sm"
                >
                  + {t('routes.addVehicle')}
                </button>
              </div>

              {addingVehicle && (
                <div className="mb-4 border-2 border-sky-500 rounded-lg p-4 bg-sky-50">
                  <h3 className="font-semibold text-slate-900 mb-3">{t('routes.newVehicle')}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.plateNumber')} *</label>
                      <input
                        type="text"
                        value={newVehicleData.plateNumber}
                        onChange={(e) => setNewVehicleData({ ...newVehicleData, plateNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.model')} *</label>
                      <input
                        type="text"
                        value={newVehicleData.model}
                        onChange={(e) => setNewVehicleData({ ...newVehicleData, model: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.type')}</label>
                      <select
                        value={newVehicleData.type}
                        onChange={(e) => setNewVehicleData({ ...newVehicleData, type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                      >
                        <option value="VAN">Van</option>
                        <option value="TRUCK">Truck</option>
                        <option value="REFRIGERATED_VAN">Refrigerated Van</option>
                        <option value="REFRIGERATED_TRUCK">Refrigerated Truck</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.capacity')} (kg)</label>
                      <input
                        type="number"
                        value={newVehicleData.capacity}
                        onChange={(e) => setNewVehicleData({ ...newVehicleData, capacity: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={createVehicle}
                      disabled={!newVehicleData.plateNumber || !newVehicleData.model}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 shadow-sm"
                    >
                      {t('routes.create')}
                    </button>
                    <button
                      onClick={() => {
                        setAddingVehicle(false);
                        setNewVehicleData({ plateNumber: '', model: '', type: 'VAN', capacity: '' });
                      }}
                      className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                    >
                      {t('routes.cancel')}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {vehicles.map((vehicle) => {
                  const isEditing = editingVehicle === vehicle.id;

                  return (
                    <div key={vehicle.id} className="border border-slate-200 rounded-lg p-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.plateNumber')}</label>
                              <input
                                type="text"
                                value={editFormData.plateNumber || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, plateNumber: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.model')}</label>
                              <input
                                type="text"
                                value={editFormData.model || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.type')}</label>
                              <select
                                value={editFormData.type || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                              >
                                <option value="VAN">Van</option>
                                <option value="TRUCK">Truck</option>
                                <option value="REFRIGERATED_VAN">Refrigerated Van</option>
                                <option value="REFRIGERATED_TRUCK">Refrigerated Truck</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">{t('routes.status')}</label>
                              <select
                                value={editFormData.status || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                              >
                                <option value="AVAILABLE">{t('vehicles.available')}</option>
                                <option value="IN_USE">{t('vehicles.inUse')}</option>
                                <option value="MAINTENANCE">{t('vehicles.maintenance')}</option>
                                <option value="RETIRED">Retired</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveVehicle(vehicle.id)}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
                            >
                              {t('routes.save')}
                            </button>
                            <button
                              onClick={cancelEditVehicle}
                              className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                            >
                              {t('routes.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-900">{vehicle.plateNumber}</h3>
                              {getStatusBadge(vehicle.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                              <div>
                                <span className="font-medium">Model:</span> {vehicle.model}
                              </div>
                              <div>
                                <span className="font-medium">Type:</span> {vehicle.type.replace('_', ' ')}
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 flex gap-2">
                            <button
                              onClick={() => startEditVehicle(vehicle)}
                              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm shadow-sm"
                            >
                              {t('routes.edit')}
                            </button>
                            <button
                              onClick={() => deleteVehicle(vehicle.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm shadow-sm"
                            >
                              {t('routes.delete')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
