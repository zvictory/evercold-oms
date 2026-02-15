'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LeafletMap from '@/components/Map/LeafletMap';
import TurnByTurnNav from '@/components/Navigation/TurnByTurnNav';
import { DistanceCalculator } from '@/lib/distanceCalculator';

interface RouteStop {
  id: string;
  stopNumber: number;
  distanceFromPrev: number;
  status: string;
  estimatedArrival: string | null;
  actualArrival: string | null;
  completedAt: string | null;
  delivery: {
    id: string;
    order: {
      orderNumber: string;
      customer: {
        name: string;
      };
      orderItems: Array<{
        branch: {
          branchName: string;
          fullName: string;
          deliveryAddress: string;
          latitude: number;
          longitude: number;
          contactPerson: string | null;
          phone: string | null;
        };
      }>;
    };
  };
}

interface DeliveryRoute {
  id: string;
  routeName: string;
  scheduledDate: string;
  status: string;
  totalDistance: number;
  estimatedDuration: number;
  actualStartTime: string | null;
  actualEndTime: string | null;
  driver: {
    name: string;
    phone: string;
  };
  vehicle: {
    plateNumber: string;
    model: string;
  };
  stops: RouteStop[];
}

export default function RouteViewPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = params.routeId as string;

  const [route, setRoute] = useState<DeliveryRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<number | null>(null);

  useEffect(() => {
    fetchRoute();
  }, [routeId]);

  const fetchRoute = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/routes/${routeId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }

      const data = await response.json();
      setRoute(data.route);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateStopStatus = async (stopId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/routes/${routeId}/stops/${stopId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stop status');
      }

      await fetchRoute(); // Refresh route data
    } catch (err) {
      console.error('Error updating stop:', err);
      alert('Failed to update stop status');
    }
  };

  const startRoute = async () => {
    try {
      const response = await fetch(`/api/routes/${routeId}/start`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to start route');
      }

      await fetchRoute();
    } catch (err) {
      console.error('Error starting route:', err);
      alert('Failed to start route');
    }
  };

  const completeRoute = async () => {
    try {
      const response = await fetch(`/api/routes/${routeId}/complete`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to complete route');
      }

      await fetchRoute();
      alert('Route completed successfully!');
    } catch (err) {
      console.error('Error completing route:', err);
      alert('Failed to complete route');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading route...</p>
        </div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error || 'Route not found'}</p>
          <button
            onClick={() => router.push('/routes')}
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Back to Routes
          </button>
        </div>
      </div>
    );
  }

  // Prepare map data
  const markers = route.stops.map((stop, idx) => {
    const branch = stop.delivery.order.orderItems[0]?.branch;
    if (!branch) return null;

    return {
      id: stop.id,
      latitude: branch.latitude,
      longitude: branch.longitude,
      label: `${stop.stopNumber}. ${branch.branchName}`,
      color:
        stop.status === 'COMPLETED'
          ? 'bg-green-600'
          : stop.status === 'EN_ROUTE' || stop.status === 'ARRIVED'
          ? 'bg-yellow-600'
          : 'bg-indigo-600',
    };
  }).filter(Boolean) as any[];

  const routeCoordinates = markers.map((m) => [m.longitude, m.latitude] as [number, number]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PLANNED: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      PENDING: 'bg-gray-100 text-gray-600',
      EN_ROUTE: 'bg-blue-100 text-blue-800',
      ARRIVED: 'bg-yellow-100 text-yellow-800',
      SKIPPED: 'bg-orange-100 text-orange-800',
      FAILED: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const currentStop = route.stops.find((s) => s.status === 'EN_ROUTE' || s.status === 'PENDING');
  const completedStops = route.stops.filter((s) => s.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{route.routeName}</h1>
              <p className="text-sm text-gray-600">
                {route.driver.name} • {route.vehicle.plateNumber} • {new Date(route.scheduledDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(route.status)}
              {route.status === 'PLANNED' && (
                <button
                  onClick={startRoute}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Start Route
                </button>
              )}
              {route.status === 'IN_PROGRESS' && (
                <button
                  onClick={completeRoute}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Complete Route
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Map Status */}
        <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-900 font-semibold">✅ OpenStreetMap Active</p>
          <p className="text-sm text-green-700 mt-1">
            Free, open-source map showing Tashkent delivery routes with interactive markers.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {completedStops} of {route.stops.length} stops
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((completedStops / route.stops.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${(completedStops / route.stops.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <LeafletMap
                center={routeCoordinates[0] || [69.2401, 41.2995]}
                zoom={11}
                markers={markers}
                route={routeCoordinates}
                height="600px"
                onMarkerClick={(id) => {
                  const stopIndex = route.stops.findIndex((s) => s.id === id);
                  setSelectedStop(stopIndex);
                }}
              />
            </div>

            {/* Route Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Total Distance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {DistanceCalculator.formatDistance(route.totalDistance)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Est. Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {DistanceCalculator.formatDuration(route.estimatedDuration)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Stops</p>
                <p className="text-2xl font-bold text-gray-900">{route.stops.length}</p>
              </div>
            </div>

            {/* Turn-by-Turn Navigation */}
            <div className="mt-6">
              <TurnByTurnNav
                stops={route.stops.map((stop, idx) => {
                  const branch = stop.delivery.order.orderItems[0]?.branch;
                  return {
                    stopNumber: stop.stopNumber,
                    instruction: `Stop ${stop.stopNumber}: ${branch?.branchName || 'Delivery'}`,
                    distance: DistanceCalculator.formatDistance(stop.distanceFromPrev),
                    duration: DistanceCalculator.formatDuration(
                      Math.max(1, Math.round(stop.distanceFromPrev / 40 * 60))
                    ),
                    address: branch?.deliveryAddress || 'Unknown location',
                  };
                })}
                currentStop={completedStops}
                totalDistance={DistanceCalculator.formatDistance(route.totalDistance)}
                totalDuration={DistanceCalculator.formatDuration(route.estimatedDuration)}
              />
            </div>
          </div>

          {/* Stops List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-indigo-600 text-white px-4 py-3">
                <h2 className="font-semibold">Delivery Stops</h2>
              </div>
              <div className="max-h-[700px] overflow-y-auto">
                {route.stops.map((stop, idx) => {
                  const branch = stop.delivery.order.orderItems[0]?.branch;
                  if (!branch) return null;

                  return (
                    <div
                      key={stop.id}
                      className={`
                        border-b border-gray-200 p-4 cursor-pointer hover:bg-gray-50
                        ${selectedStop === idx ? 'bg-indigo-50' : ''}
                      `}
                      onClick={() => setSelectedStop(idx)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`
                            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                            text-white font-bold text-sm
                            ${
                              stop.status === 'COMPLETED'
                                ? 'bg-green-600'
                                : stop.status === 'EN_ROUTE' || stop.status === 'ARRIVED'
                                ? 'bg-yellow-600'
                                : 'bg-indigo-600'
                            }
                          `}
                        >
                          {stop.stopNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {branch.branchName}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{branch.deliveryAddress}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Order: {stop.delivery.order.orderNumber}
                          </p>
                          {stop.distanceFromPrev > 0 && (
                            <p className="text-xs text-gray-500">
                              {DistanceCalculator.formatDistance(stop.distanceFromPrev)} from previous
                            </p>
                          )}
                          <div className="mt-2">{getStatusBadge(stop.status)}</div>

                          {/* Action Buttons */}
                          {route.status === 'IN_PROGRESS' && stop.status === 'PENDING' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStopStatus(stop.id, 'EN_ROUTE');
                              }}
                              className="mt-2 text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Start Delivery
                            </button>
                          )}
                          {stop.status === 'EN_ROUTE' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStopStatus(stop.id, 'ARRIVED');
                              }}
                              className="mt-2 text-xs px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                            >
                              Mark Arrived
                            </button>
                          )}
                          {stop.status === 'ARRIVED' && (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStopStatus(stop.id, 'COMPLETED');
                                }}
                                className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Complete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStopStatus(stop.id, 'FAILED');
                                }}
                                className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Failed
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
