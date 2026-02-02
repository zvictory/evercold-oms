'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface RouteStop {
  id: string;
  stopNumber: number;
  status: 'PENDING' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  deliveryId: string;
  actualArrival?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  delivery: {
    id: string;
    order: {
      orderNumber: string;
      customer: {
        name: string;
      };
      orderItems: Array<{
        branch: {
          id: string;
          branchName: string;
          fullName: string;
          deliveryAddress: string | null;
          latitude: number | null;
          longitude: number | null;
          contactPerson: string | null;
          phone: string | null;
        } | null;
      }>;
    };
  };
}

interface Route {
  id: string;
  routeName: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  isStandalone?: boolean;
  totalDistance?: number | null;
  estimatedDuration?: number | null;
  estimatedDurationWithTraffic?: number | null;
  stops: RouteStop[];
  driver: {
    id: string;
    name: string;
    phone: string;
  };
  vehicle: {
    id: string;
    plateNumber: string;
    model: string;
  };
  scheduledDate: string;
}

export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = params.routeId as string;

  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStop, setUpdatingStop] = useState<string | null>(null);
  const [showArrivalModal, setShowArrivalModal] = useState<string | null>(null);

  useEffect(() => {
    fetchRoute();
  }, [routeId]);

  const fetchRoute = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('driverToken');

      const response = await fetch(`/api/routes/${routeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch route');

      const data = await response.json();
      setRoute(data.route);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load route');
    } finally {
      setLoading(false);
    }
  };

  const confirmArrival = async (stopId: string) => {
    try {
      setUpdatingStop(stopId);

      // Get GPS coordinates
      let latitude: number | null = null;
      let longitude: number | null = null;
      let accuracy: number | null = null;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });

          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          accuracy = position.coords.accuracy;
        } catch (gpsError) {
          console.warn('GPS capture failed:', gpsError);
          // Continue without GPS
        }
      }

      const token = localStorage.getItem('driverToken');
      const response = await fetch(`/api/routes/${routeId}/stops/${stopId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'ARRIVED',
          notes: JSON.stringify({
            arrivalGPS: {
              latitude,
              longitude,
              accuracy,
              timestamp: new Date().toISOString(),
            },
          }),
        }),
      });

      if (!response.ok) throw new Error('Failed to update stop status');

      setShowArrivalModal(null);
      await fetchRoute(); // Refresh route data
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm arrival');
    } finally {
      setUpdatingStop(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-50 border-gray-200 text-gray-600';
      case 'EN_ROUTE':
        return 'bg-blue-50 border-blue-300 text-blue-700';
      case 'ARRIVED':
        return 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-300 text-indigo-700';
      case 'COMPLETED':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'FAILED':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'SKIPPED':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⚪';
      case 'EN_ROUTE':
        return '🔵';
      case 'ARRIVED':
        return '🟣';
      case 'COMPLETED':
        return '🟢';
      case 'FAILED':
        return '🔴';
      case 'SKIPPED':
        return '🟠';
      default:
        return '⚪';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'ОЖИДАЕТ';
      case 'EN_ROUTE':
        return 'В ПУТИ';
      case 'ARRIVED':
        return 'ПРИБЫЛ';
      case 'COMPLETED':
        return 'ЗАВЕРШЕНО';
      case 'FAILED':
        return 'НЕ УДАЛОСЬ';
      case 'SKIPPED':
        return 'ПРОПУЩЕНО';
      default:
        return status;
    }
  };

  const isStopAccessible = (stop: RouteStop, index: number) => {
    // First stop always accessible
    if (stop.stopNumber === 1) return true;

    // Completed/failed stops viewable
    if (['COMPLETED', 'FAILED', 'SKIPPED'].includes(stop.status)) return true;

    // Current stop accessible (EN_ROUTE or ARRIVED)
    if (['ARRIVED', 'EN_ROUTE'].includes(stop.status)) return true;

    // Check if previous stop is completed
    if (index > 0 && route) {
      const prevStop = route.stops[index - 1];
      return ['COMPLETED', 'FAILED', 'SKIPPED'].includes(prevStop.status);
    }

    return false;
  };

  const getFirstBranch = (stop: RouteStop) => {
    return stop.delivery.order.orderItems.find(item => item.branch)?.branch || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Загрузка маршрута...</p>
        </div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold text-sm sm:text-base">Ошибка: {error || 'Маршрут не найден'}</p>
          <Link
            href="/driver/routes"
            className="mt-2 inline-block px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm sm:text-base"
          >
            Вернуться к маршрутам
          </Link>
        </div>
      </div>
    );
  }

  const completedStops = route.stops.filter((s) => s.status === 'COMPLETED').length;
  const totalStops = route.stops.length;
  const currentStop = route.stops.find((s) => ['EN_ROUTE', 'ARRIVED'].includes(s.status));

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow sticky top-0 z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                🗺️ {route.routeName}
              </h1>
              {route.isStandalone && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                  Разовая доставка
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm sm:text-base mt-1">
              {route.status === 'PLANNED' && '📋 ЗАПЛАНИРОВАНО'}
              {route.status === 'IN_PROGRESS' && '🚗 ВЫПОЛНЯЕТСЯ'}
              {route.status === 'COMPLETED' && '✅ ЗАВЕРШЕНО'}
              {route.status === 'CANCELLED' && '❌ ОТМЕНЕНО'}
              <span className="ml-2">• {totalStops} {totalStops === 1 ? 'остановка' : 'остановок'}</span>
            </p>
          </div>
          <Link
            href="/driver/routes"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            ← Назад
          </Link>
        </div>
        <p className="text-gray-700 text-sm sm:text-base">
          🚚 {route.vehicle.plateNumber} • {route.vehicle.model}
        </p>
      </div>

      {/* Progress Stats */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          📊 Прогресс
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">Завершено</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {completedStops}/{totalStops}
            </p>
          </div>
          {route.totalDistance && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Расстояние</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {route.totalDistance.toFixed(1)} км
              </p>
            </div>
          )}
          {route.estimatedDuration && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Время</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {route.estimatedDuration} мин
              </p>
            </div>
          )}
          {route.estimatedDurationWithTraffic && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">С пробками</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {route.estimatedDurationWithTraffic} мин
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all"
              style={{ width: `${(completedStops / totalStops) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stops List */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 px-1">
          📍 Остановки
        </h2>

        {route.stops.map((stop, index) => {
          const branch = getFirstBranch(stop);
          const accessible = isStopAccessible(stop, index);

          return (
            <div
              key={stop.id}
              className={`border rounded-lg p-4 sm:p-6 ${getStatusColor(stop.status)} ${
                !accessible ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl sm:text-3xl">{getStatusIcon(stop.status)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        ОСТАНОВКА {stop.stopNumber}
                      </h3>
                      <span className="px-2 py-1 bg-white/50 rounded text-xs font-semibold">
                        {getStatusText(stop.status)}
                      </span>
                    </div>
                    <p className="text-gray-900 font-semibold mt-1 text-sm sm:text-base">
                      {stop.delivery.order.customer.name}
                    </p>
                    <p className="text-gray-700 text-xs sm:text-sm mt-1">
                      Заказ #{stop.delivery.order.orderNumber}
                    </p>
                  </div>
                </div>
              </div>

              {branch && (
                <div className="bg-white/30 rounded-lg p-3 mb-3">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    {branch.fullName}
                  </p>
                  {branch.deliveryAddress && (
                    <p className="text-gray-700 text-xs sm:text-sm mt-1">
                      📍 {branch.deliveryAddress}
                    </p>
                  )}
                  {branch.phone && (
                    <p className="text-gray-700 text-xs sm:text-sm mt-1">📞 {branch.phone}</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {accessible && (
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  {stop.status === 'PENDING' && (
                    <button
                      onClick={() => setShowArrivalModal(stop.id)}
                      disabled={updatingStop === stop.id}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-sm sm:text-base disabled:opacity-50"
                    >
                      {updatingStop === stop.id ? 'Обработка...' : '🚗 Я прибыл'}
                    </button>
                  )}

                  {stop.status === 'EN_ROUTE' && (
                    <button
                      onClick={() => setShowArrivalModal(stop.id)}
                      disabled={updatingStop === stop.id}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-sm sm:text-base disabled:opacity-50"
                    >
                      {updatingStop === stop.id ? 'Обработка...' : '🚗 Я прибыл'}
                    </button>
                  )}

                  {stop.status === 'ARRIVED' && (
                    <Link
                      href={`/driver/delivery/${stop.deliveryId}`}
                      className="flex-1 px-4 py-2 bg-green-600 text-white text-center rounded-lg font-semibold hover:bg-green-700 transition text-sm sm:text-base"
                    >
                      ✅ Чек-лист доставки
                    </Link>
                  )}

                  {branch?.phone && ['PENDING', 'EN_ROUTE', 'ARRIVED'].includes(stop.status) && (
                    <a
                      href={`tel:${branch.phone}`}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg font-semibold hover:bg-blue-700 transition text-sm sm:text-base"
                    >
                      📱 Позвонить
                    </a>
                  )}
                </div>
              )}

              {!accessible && (
                <div className="bg-white/30 rounded-lg p-3 text-center">
                  <p className="text-gray-600 text-sm">
                    🔒 Доступно после завершения остановки {index}
                  </p>
                </div>
              )}

              {stop.completedAt && (
                <p className="text-xs text-gray-600 mt-2">
                  ✓ Завершено {new Date(stop.completedAt).toLocaleString('ru-RU')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Arrival Confirmation Modal */}
      {showArrivalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Подтвердить прибытие
            </h3>
            <p className="text-gray-600 mb-6">
              Вы прибыли на место доставки? Будут зафиксированы координаты GPS.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowArrivalModal(null)}
                disabled={updatingStop !== null}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={() => confirmArrival(showArrivalModal)}
                disabled={updatingStop !== null}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {updatingStop ? 'Обработка...' : 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
