'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DeliveryCard } from '@/components/Driver/DeliveryCard';

interface ActiveRoute {
  id: string;
  routeName: string;
  status: string;
  stops: Array<{
    id: string;
    stopNumber: number;
    status: string;
    delivery: {
      id: string;
      order: {
        customer: { name: string; address: string };
      };
    };
  }>;
  vehicle: {
    plateNumber: string;
    model: string;
  };
}

export default function DriverDashboardPage() {
  const router = useRouter();
  const [driver, setDriver] = useState<any>(null);
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);
  const [pendingDeliveries, setPendingDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const driverInfo = localStorage.getItem('driverInfo');
        if (!driverInfo) {
          router.push('/driver/login');
          return;
        }

        const driverData = JSON.parse(driverInfo);
        setDriver(driverData);

        // Fetch deliveries (both routes and standalone deliveries)
        const token = localStorage.getItem('driverToken');
        const res = await fetch(`/api/driver/deliveries?driverId=${driverData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();

          // Split into active route and pending deliveries
          const activeRoute = data.routes?.find((r: any) => r.status === 'IN_PROGRESS');
          const pendingDeliveries = data.routes?.filter((r: any) =>
            r.status === 'PLANNED' ||
            (r.isStandalone && r.stops[0]?.delivery?.status === 'PENDING')
          );

          setActiveRoute(activeRoute || null);
          setPendingDeliveries(pendingDeliveries || []);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Загрузка...</p>
        </div>
      </div>
    );
  }

  const completedStops = activeRoute?.stops.filter(s => s.status === 'COMPLETED').length || 0;
  const totalStops = activeRoute?.stops.length || 0;
  const nextStop = activeRoute?.stops.find(s => s.status === 'PENDING');

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          👋 Добро пожаловать, {driver?.name}!
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Готовы начать доставки?</p>
      </div>

      {/* Active Route Card */}
      {activeRoute ? (
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            🗺️ Активный маршрут: {activeRoute.routeName}
          </h2>
          <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
            🚗 {activeRoute.vehicle.plateNumber} • {activeRoute.vehicle.model}
          </p>

          {/* Progress Bar */}
          <div className="mb-3 sm:mb-4">
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
              <span>{completedStops} из {totalStops} остановок завершено</span>
              <span>{Math.round((completedStops / totalStops) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
              <div
                className="bg-green-600 h-2 sm:h-3 rounded-full transition-all"
                style={{ width: `${(completedStops / totalStops) * 100}%` }}
              />
            </div>
          </div>

          {/* Next Stop */}
          {nextStop && completedStops < totalStops && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1">Следующая остановка:</p>
              <p className="text-blue-700 font-semibold text-sm sm:text-base">
                📍 Остановка {nextStop.stopNumber}: {nextStop.delivery.order.customer.name}
              </p>
              <p className="text-blue-600 text-xs sm:text-sm mt-1">
                {nextStop.delivery.order.customer.address}
              </p>
            </div>
          )}

          {/* Completion Message */}
          {completedStops === totalStops && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="text-green-700 font-semibold text-sm sm:text-base">
                🎉 Все доставки завершены! Отличная работа!
              </p>
            </div>
          )}

          <Link
            href={`/driver/routes`}
            className="block w-full py-3 bg-indigo-600 text-white text-center rounded-lg font-bold text-sm sm:text-base hover:bg-indigo-700 transition"
          >
            ▶️ Продолжить маршрут
          </Link>
        </div>
      ) : null}

      {/* Pending Deliveries Section */}
      {pendingDeliveries.length > 0 && (
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            📋 Мои назначенные доставки ({pendingDeliveries.length})
          </h2>

          <div className="space-y-3">
            {pendingDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                variant="compact"
                onStartDelivery={(deliveryId) => {
                  router.push(`/driver/routes/${deliveryId}`);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State - Enhanced */}
      {!activeRoute && pendingDeliveries.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">✅</div>
          <p className="text-gray-600 mb-2 text-sm sm:text-base">Все доставки выполнены!</p>
          <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4">
            У вас нет назначенных доставок
          </p>
          <Link
            href="/driver/routes"
            className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm sm:text-base hover:bg-indigo-700 transition"
          >
            Посмотреть все маршруты
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Link
          href="/driver/routes"
          className="bg-white rounded-lg p-4 sm:p-6 shadow text-center hover:bg-gray-50 transition"
        >
          <div className="text-2xl sm:text-3xl mb-2">📍</div>
          <p className="font-semibold text-gray-900 text-sm sm:text-base">Мои Маршруты</p>
        </Link>
        <Link
          href="/driver/navigate"
          className="bg-white rounded-lg p-4 sm:p-6 shadow text-center hover:bg-gray-50 transition"
        >
          <div className="text-2xl sm:text-3xl mb-2">🧭</div>
          <p className="font-semibold text-gray-900 text-sm sm:text-base">Навигация</p>
        </Link>
      </div>

      {/* Driver Info Card */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-indigo-900 mb-3">👤 Ваш Профиль</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-indigo-700">Имя:</span>
            <span className="font-semibold text-indigo-900">{driver?.name}</span>
          </div>
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-indigo-700">Телефон:</span>
            <span className="font-semibold text-indigo-900">{driver?.phone}</span>
          </div>
          {driver?.licenseNumber && (
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-indigo-700">Лицензия:</span>
              <span className="font-semibold text-indigo-900">{driver.licenseNumber}</span>
            </div>
          )}
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-indigo-700">Статус:</span>
            <span className={`font-semibold ${
              driver?.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {driver?.status === 'ACTIVE' ? 'АКТИВЕН' : driver?.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
