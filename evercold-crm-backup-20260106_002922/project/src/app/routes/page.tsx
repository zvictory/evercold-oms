'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
        fetch('/api/routes'),
        fetch('/api/deliveries?status=PENDING'),
        fetch('/api/drivers'),
        fetch('/api/vehicles'),
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
      alert('Please select at least one delivery');
      return;
    }

    if (!selectedDriver || !selectedVehicle) {
      alert('Please select a driver and vehicle');
      return;
    }

    try {
      setOptimizing(true);

      const response = await fetch('/api/routes/optimize', {
        method: 'POST',
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

      alert(`Route created successfully!\nDistance: ${data.summary.totalDistance}\nTime: ${data.summary.estimatedTime}`);

      setSelectedDeliveries(new Set());
      setSelectedDriver('');
      setSelectedVehicle('');
      setActiveTab('routes');
      await fetchData();
    } catch (error) {
      console.error('Error creating route:', error);
      alert(`Failed to create route: ${(error as Error).message}`);
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
    if (!confirm('Are you sure you want to delete this route?')) return;

    try {
      const response = await fetch(`/api/routes/${routeId}`, {
        method: 'DELETE',
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
    if (!confirm('Are you sure you want to delete this driver?')) return;

    try {
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: 'DELETE',
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
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
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
      PLANNED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      AVAILABLE: 'bg-green-100 text-green-800',
      IN_USE: 'bg-yellow-100 text-yellow-800',
      MAINTENANCE: 'bg-orange-100 text-orange-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Route Planning & Fleet Management</h1>
          <p className="text-gray-600">Manage routes, drivers, and vehicles</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('routes')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'routes'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Routes ({routes.length})
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'create'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Create Route ({pendingDeliveries.length} pending)
              </button>
              <button
                onClick={() => setActiveTab('drivers')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'drivers'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Drivers ({drivers.length})
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'vehicles'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Vehicles ({vehicles.length})
              </button>
              <div className="ml-auto flex items-center">
                <button
                  onClick={() => router.push('/branches')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  Manage Branches
                </button>
              </div>
            </nav>
          </div>

          {/* Routes Tab */}
          {activeTab === 'routes' && (
            <div className="p-6">
              {routes.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="mt-4 text-gray-500">No routes created yet</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Create First Route
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
                      <div key={route.id} className="border border-gray-200 rounded-lg p-4">
                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                                <input
                                  type="text"
                                  value={editFormData.routeName || ''}
                                  onChange={(e) => setEditFormData({ ...editFormData, routeName: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                                <DatePicker
                                  value={editFormData.scheduledDate || ''}
                                  onChange={(date) => setEditFormData({ ...editFormData, scheduledDate: date })}
                                  placeholder="Выберите дату"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                              <textarea
                                value={editFormData.notes || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveRoute(route.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditRoute}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{route.routeName}</h3>
                                {getStatusBadge(route.status)}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
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
                                <div className="mt-2 text-sm text-gray-600">
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
                                    <span className="text-gray-600">{completedStops} of {totalStops} completed</span>
                                    <span className="text-gray-600">{Math.round(progressPercent)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="ml-4 flex gap-2">
                              <button
                                onClick={() => router.push(`/routes/${route.id}`)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
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
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Select Deliveries ({selectedDeliveries.size} selected)
                  </h2>

                  {pendingDeliveries.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">No pending deliveries available</p>
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
                              isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                            } ${!hasCoordinates ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => hasCoordinates && toggleDeliverySelection(delivery.id)}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!hasCoordinates}
                                onChange={() => hasCoordinates && toggleDeliverySelection(delivery.id)}
                                className="mt-1 h-4 w-4 text-indigo-600 rounded"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-medium text-gray-900">{delivery.order.orderNumber}</h3>
                                  <span className="text-xs text-gray-500">{new Date(delivery.order.orderDate).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-600">{delivery.order.customer.name}</p>
                                {branch && <p className="text-sm text-gray-600">{branch.branchName} - {branch.deliveryAddress}</p>}
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
                  <div className="bg-gray-50 rounded-lg p-4 sticky top-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Details</h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Driver</label>
                        <select
                          value={selectedDriver}
                          onChange={(e) => setSelectedDriver(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-600"
                        >
                          <option value="">Select driver...</option>
                          {drivers.filter(d => d.status === 'ACTIVE').map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} - {driver.phone}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
                        <select
                          value={selectedVehicle}
                          onChange={(e) => setSelectedVehicle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-600"
                        >
                          <option value="">Select vehicle...</option>
                          {vehicles.filter(v => v.status === 'AVAILABLE').map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.plateNumber} - {vehicle.model}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                        <DatePicker
                          value={scheduledDate}
                          onChange={setScheduledDate}
                          placeholder="Выберите дату"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 space-y-2">
                          <div className="flex justify-between">
                            <span>Selected Deliveries:</span>
                            <span className="font-medium">{selectedDeliveries.size}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={createOptimizedRoute}
                        disabled={selectedDeliveries.size === 0 || !selectedDriver || !selectedVehicle || optimizing}
                        className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                      >
                        {optimizing ? 'Optimizing Route...' : 'Create Optimized Route'}
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
                <h2 className="text-lg font-semibold text-gray-900">Drivers ({drivers.length})</h2>
                <button
                  onClick={() => setAddingDriver(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  + Add Driver
                </button>
              </div>

              {addingDriver && (
                <div className="mb-4 border-2 border-indigo-500 rounded-lg p-4 bg-indigo-50">
                  <h3 className="font-semibold text-gray-900 mb-3">New Driver</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={newDriverData.name}
                        onChange={(e) => setNewDriverData({ ...newDriverData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        value={newDriverData.phone}
                        onChange={(e) => setNewDriverData({ ...newDriverData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newDriverData.email}
                        onChange={(e) => setNewDriverData({ ...newDriverData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                      <input
                        type="text"
                        value={newDriverData.licenseNumber}
                        onChange={(e) => setNewDriverData({ ...newDriverData, licenseNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={createDriver}
                      disabled={!newDriverData.name || !newDriverData.phone || !newDriverData.licenseNumber}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setAddingDriver(false);
                        setNewDriverData({ name: '', phone: '', email: '', licenseNumber: '', licenseExpiry: '' });
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {drivers.map((driver) => {
                  const isEditing = editingDriver === driver.id;

                  return (
                    <div key={driver.id} className="border border-gray-200 rounded-lg p-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                              <input
                                type="text"
                                value={editFormData.name || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                              <input
                                type="tel"
                                value={editFormData.phone || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                              <input
                                type="email"
                                value={editFormData.email || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                              <select
                                value={editFormData.status || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                              >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="ON_LEAVE">On Leave</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveDriver(driver.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditDriver}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
                              {getStatusBadge(driver.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
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
                              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteDriver(driver.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              Delete
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
                <h2 className="text-lg font-semibold text-gray-900">Vehicles ({vehicles.length})</h2>
                <button
                  onClick={() => setAddingVehicle(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  + Add Vehicle
                </button>
              </div>

              {addingVehicle && (
                <div className="mb-4 border-2 border-indigo-500 rounded-lg p-4 bg-indigo-50">
                  <h3 className="font-semibold text-gray-900 mb-3">New Vehicle</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number *</label>
                      <input
                        type="text"
                        value={newVehicleData.plateNumber}
                        onChange={(e) => setNewVehicleData({ ...newVehicleData, plateNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                      <input
                        type="text"
                        value={newVehicleData.model}
                        onChange={(e) => setNewVehicleData({ ...newVehicleData, model: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={newVehicleData.type}
                        onChange={(e) => setNewVehicleData({ ...newVehicleData, type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                      >
                        <option value="VAN">Van</option>
                        <option value="TRUCK">Truck</option>
                        <option value="REFRIGERATED_VAN">Refrigerated Van</option>
                        <option value="REFRIGERATED_TRUCK">Refrigerated Truck</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (kg)</label>
                      <input
                        type="number"
                        value={newVehicleData.capacity}
                        onChange={(e) => setNewVehicleData({ ...newVehicleData, capacity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={createVehicle}
                      disabled={!newVehicleData.plateNumber || !newVehicleData.model}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setAddingVehicle(false);
                        setNewVehicleData({ plateNumber: '', model: '', type: 'VAN', capacity: '' });
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {vehicles.map((vehicle) => {
                  const isEditing = editingVehicle === vehicle.id;

                  return (
                    <div key={vehicle.id} className="border border-gray-200 rounded-lg p-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                              <input
                                type="text"
                                value={editFormData.plateNumber || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, plateNumber: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                              <input
                                type="text"
                                value={editFormData.model || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                              <select
                                value={editFormData.type || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                              >
                                <option value="VAN">Van</option>
                                <option value="TRUCK">Truck</option>
                                <option value="REFRIGERATED_VAN">Refrigerated Van</option>
                                <option value="REFRIGERATED_TRUCK">Refrigerated Truck</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                              <select
                                value={editFormData.status || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-600"
                              >
                                <option value="AVAILABLE">Available</option>
                                <option value="IN_USE">In Use</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="RETIRED">Retired</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveVehicle(vehicle.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditVehicle}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{vehicle.plateNumber}</h3>
                              {getStatusBadge(vehicle.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
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
                              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteVehicle(vehicle.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              Delete
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
