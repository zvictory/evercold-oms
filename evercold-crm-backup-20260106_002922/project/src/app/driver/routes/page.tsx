'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Route {
  id: string;
  routeName: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  isStandalone?: boolean; // NEW: flag for standalone deliveries
  totalDistance?: number;
  estimatedDuration?: number;
  estimatedDurationWithTraffic?: number;
  stops: Array<{
    id: string;
    stopNumber: number;
    status: string;
    deliveryId: string;
  }>;
  driver: {
    name: string;
  };
  vehicle: {
    plateNumber: string;
    model: string;
  };
}

export default function DriverRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'planned' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);

      // Get driver info from localStorage
      const driverInfo = localStorage.getItem('driverInfo');
      const token = localStorage.getItem('driverToken');

      if (!driverInfo || !token) {
        throw new Error('No driver session found');
      }

      const driver = JSON.parse(driverInfo);

      // Fetch routes filtered by current driver ID (includes standalone deliveries)
      const response = await fetch(`/api/driver/deliveries?driverId=${driver.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch routes');

      const data = await response.json();
      setRoutes(data.routes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return '📋';
      case 'IN_PROGRESS':
        return '🚗';
      case 'COMPLETED':
        return '✅';
      case 'CANCELLED':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-blue-50 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-amber-50 border-amber-200';
      case 'COMPLETED':
        return 'bg-green-50 border-green-200';
      case 'CANCELLED':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'text-blue-700';
      case 'IN_PROGRESS':
        return 'text-amber-700';
      case 'COMPLETED':
        return 'text-green-700';
      case 'CANCELLED':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  const filteredRoutes = routes.filter((route) => {
    if (filter === 'all') return true;
    return route.status === filter.replace('_', '');
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Загрузка маршрутов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold text-sm sm:text-base">Ошибка: {error}</p>
          <button
            onClick={fetchRoutes}
            className="mt-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm sm:text-base"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <span>🗺️</span> Мои Маршруты
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Управляйте маршрутами доставки с учетом пробок
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <p className="text-blue-600 text-xs sm:text-sm font-medium">Запланировано</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-900">
            {routes.filter((r) => r.status === 'PLANNED').length}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
          <p className="text-amber-600 text-xs sm:text-sm font-medium">Выполняется</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-900">
            {routes.filter((r) => r.status === 'IN_PROGRESS').length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <p className="text-green-600 text-xs sm:text-sm font-medium">Завершено</p>
          <p className="text-xl sm:text-2xl font-bold text-green-900">
            {routes.filter((r) => r.status === 'COMPLETED').length}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
          <p className="text-purple-600 text-xs sm:text-sm font-medium">Всего</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-900">{routes.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-wrap gap-2">
          {(['all', 'planned', 'in_progress', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-xs sm:text-sm ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f === 'all'
                ? '📋 Все'
                : f === 'planned'
                ? '📋 План'
                : f === 'in_progress'
                ? '🚗 В пути'
                : '✅ Готово'}
            </button>
          ))}
        </div>
      </div>

      {/* Routes List */}
      {filteredRoutes.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
          <p className="text-gray-600 text-sm sm:text-base">Маршруты не найдены</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredRoutes.map((route) => (
            <div
              key={route.id}
              className={`border rounded-lg p-4 sm:p-6 ${getStatusColor(route.status)} transition hover:shadow-lg`}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-start gap-2 sm:gap-3 flex-1">
                  <span className="text-xl sm:text-2xl">{getStatusIcon(route.status)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-xl font-bold text-gray-900">{route.routeName}</h3>
                      {route.isStandalone && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                          Разовая доставка
                        </span>
                      )}
                    </div>
                    <p className={`text-xs sm:text-sm font-semibold ${getStatusText(route.status)}`}>
                      {route.status === 'PLANNED' ? 'ЗАПЛАНИРОВАНО' :
                       route.status === 'IN_PROGRESS' ? 'ВЫПОЛНЯЕТСЯ' :
                       route.status === 'COMPLETED' ? 'ЗАВЕРШЕНО' :
                       route.status === 'CANCELLED' ? 'ОТМЕНЕНО' : route.status}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-gray-600">Транспорт</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">
                    {route.vehicle.plateNumber}
                  </p>
                  <p className="text-xs text-gray-600">{route.vehicle.model}</p>
                </div>
              </div>

              {/* Route Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4 bg-white/50 rounded-lg p-2 sm:p-3">
                <div>
                  <p className="text-xs text-gray-600">Расстояние</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">
                    {route.totalDistance?.toFixed(1) || '—'} км
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Время</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">
                    {route.estimatedDuration || '—'} мин
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">С пробками</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">
                    {route.estimatedDurationWithTraffic || '—'} мин
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Остановок</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">{route.stops.length}</p>
                </div>
              </div>

              {/* Stops List */}
              <div className="mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Доставки:</p>
                <div className="flex flex-wrap gap-2">
                  {route.stops.slice(0, 3).map((stop) => (
                    <span
                      key={stop.id}
                      className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700 border"
                    >
                      Ост. {stop.stopNumber}
                    </span>
                  ))}
                  {route.stops.length > 3 && (
                    <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-600">
                      +{route.stops.length - 3} ещё
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {route.status === 'IN_PROGRESS' && (
                  <>
                    <Link
                      href={`/driver/navigate?routeId=${route.id}&stopId=${route.stops[0]?.id}`}
                      className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-center text-sm sm:text-base"
                    >
                      🧭 Навигация
                    </Link>
                    <Link
                      href={`/driver/delivery/${route.stops[0]?.deliveryId}`}
                      className="flex-1 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-center text-sm sm:text-base"
                    >
                      ✅ Чек-лист
                    </Link>
                  </>
                )}
                {route.status === 'PLANNED' && (
                  <>
                    <button
                      onClick={() => {
                        /* Start route handler */
                      }}
                      className="flex-1 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-sm sm:text-base"
                    >
                      ▶️ Начать
                    </button>
                    <Link
                      href={`/routes/${route.id}`}
                      className="flex-1 px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition text-center text-sm sm:text-base"
                    >
                      📋 Детали
                    </Link>
                  </>
                )}
                {route.status === 'COMPLETED' && (
                  <Link
                    href={`/routes/${route.id}`}
                    className="flex-1 px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition text-center text-sm sm:text-base"
                  >
                    📋 Итоги
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 sm:mt-12 bg-indigo-50 border border-indigo-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-indigo-900 mb-3 sm:mb-4">📚 Как использовать приложение</h3>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <p className="font-semibold text-indigo-900 mb-1 text-sm sm:text-base">🗺️ Управление маршрутами</p>
            <p className="text-xs sm:text-sm text-indigo-800">Просматривайте маршруты, начинайте доставки и отслеживайте прогресс.</p>
          </div>
          <div>
            <p className="font-semibold text-indigo-900 mb-1 text-sm sm:text-base">🧭 Пошаговая навигация</p>
            <p className="text-xs sm:text-sm text-indigo-800">
              Получайте маршруты с учетом пробок. Меняйте маршрут при необходимости.
            </p>
          </div>
          <div>
            <p className="font-semibold text-indigo-900 mb-1 text-sm sm:text-base">✅ Подтверждение доставки</p>
            <p className="text-xs sm:text-sm text-indigo-800">
              Заполняйте чек-листы с фото, подписями и проверкой товаров.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
