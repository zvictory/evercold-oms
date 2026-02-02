'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n, useCurrentLocale } from '@/locales/client';
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
  const t = useI18n();
  const router = useRouter();
  const locale = useCurrentLocale();
  const [driver, setDriver] = useState<any>(null);
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);
  const [pendingDeliveries, setPendingDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const driverInfo = localStorage.getItem('driverInfo');
        if (!driverInfo) {
          router.push(`/${locale}/driver/login`);
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
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-sky-200 border-t-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm sm:text-base">{t('Driver.dashboard.loading')}</p>
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
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          👋 {t('Driver.dashboard.welcome')}, {driver?.name}!
        </h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base">{t('Driver.dashboard.readyToStart')}</p>
      </div>

      {/* Active Route Card */}
      {activeRoute ? (
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
            🗺️ {t('Driver.dashboard.activeRoute')}: {activeRoute.routeName}
          </h2>
          <p className="text-slate-600 mb-3 sm:mb-4 text-sm sm:text-base">
            🚗 {activeRoute.vehicle.plateNumber} • {activeRoute.vehicle.model}
          </p>

          {/* Progress Bar */}
          <div className="mb-3 sm:mb-4">
            <div className="flex justify-between text-xs sm:text-sm text-slate-600 mb-2">
              <span>{t('Driver.dashboard.stopsCompleted')}: {completedStops} / {totalStops}</span>
              <span>{Math.round((completedStops / totalStops) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 sm:h-3">
              <div
                className="bg-emerald-600 h-2 sm:h-3 rounded-full transition-all"
                style={{ width: `${(completedStops / totalStops) * 100}%` }}
              />
            </div>
          </div>

          {/* Next Stop */}
          {nextStop && completedStops < totalStops && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1">{t('Driver.dashboard.nextStop')}:</p>
              <p className="text-blue-700 font-semibold text-sm sm:text-base">
                📍 {t('Driver.dashboard.stop')} {nextStop.stopNumber}: {nextStop.delivery.order.customer.name}
              </p>
              <p className="text-blue-600 text-xs sm:text-sm mt-1">
                {nextStop.delivery.order.customer.address}
              </p>
            </div>
          )}

          {/* Completion Message */}
          {completedStops === totalStops && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="text-emerald-700 font-semibold text-sm sm:text-base">
                🎉 {t('Driver.dashboard.allDeliveriesComplete')}
              </p>
            </div>
          )}

          <Link
            href={`/${locale}/driver/routes`}
            className="block w-full py-3 bg-sky-600 text-white text-center rounded-lg font-bold text-sm sm:text-base hover:bg-sky-700 transition shadow-sm"
          >
            ▶️ {t('Driver.dashboard.continueRoute')}
          </Link>
        </div>
      ) : null}

      {/* Pending Deliveries Section */}
      {pendingDeliveries.length > 0 && (
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
            📋 {t('Driver.dashboard.myAssignedDeliveries')} ({pendingDeliveries.length})
          </h2>

          <div className="space-y-3">
            {pendingDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                variant="compact"
                onStartDelivery={(deliveryId) => {
                  router.push(`/${locale}/driver/routes/${deliveryId}`);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State - Enhanced */}
      {!activeRoute && pendingDeliveries.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 sm:p-8 text-center">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">✅</div>
          <p className="text-slate-600 mb-2 text-sm sm:text-base">{t('Driver.dashboard.allDeliveriesDone')}</p>
          <p className="text-slate-500 text-xs sm:text-sm mb-3 sm:mb-4">
            {t('Driver.dashboard.noAssignedDeliveries')}
          </p>
          <Link
            href={`/${locale}/driver/routes`}
            className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-sky-600 text-white rounded-lg font-bold text-sm sm:text-base hover:bg-sky-700 transition shadow-sm"
          >
            {t('Driver.dashboard.viewAllRoutes')}
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Link
          href={`/${locale}/driver/tasks`}
          className="bg-white border-2 border-sky-200 rounded-xl p-4 hover:shadow-md transition text-center"
        >
          <div className="text-3xl mb-2">📋</div>
          <div className="font-semibold text-slate-900">{t('Driver.dashboard.myTasks')}</div>
          <div className="text-xs text-slate-600 mt-1">{t('Driver.dashboard.activeDeliveriesList')}</div>
        </Link>
        <Link
          href={`/${locale}/driver/routes`}
          className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 text-center hover:bg-slate-50 transition"
        >
          <div className="text-2xl sm:text-3xl mb-2">📍</div>
          <p className="font-semibold text-slate-900 text-sm sm:text-base">{t('Driver.myRoutes')}</p>
        </Link>
        <Link
          href={`/${locale}/driver/navigate`}
          className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 text-center hover:bg-slate-50 transition"
        >
          <div className="text-2xl sm:text-3xl mb-2">🧭</div>
          <p className="font-semibold text-slate-900 text-sm sm:text-base">{t('Driver.navigation')}</p>
        </Link>
      </div>

      {/* Driver Info Card */}
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-sky-900 mb-3">👤 {t('Driver.dashboard.yourProfile')}</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-sky-700">{t('Driver.dashboard.name')}:</span>
            <span className="font-semibold text-sky-900">{driver?.name}</span>
          </div>
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-sky-700">{t('Driver.dashboard.phone')}:</span>
            <span className="font-semibold text-sky-900">{driver?.phone}</span>
          </div>
          {driver?.licenseNumber && (
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-sky-700">{t('Driver.dashboard.license')}:</span>
              <span className="font-semibold text-sky-900">{driver.licenseNumber}</span>
            </div>
          )}
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-sky-700">{t('Driver.dashboard.status')}:</span>
            <span className={`font-semibold ${driver?.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-600'
              }`}>
              {driver?.status === 'ACTIVE' ? t('Driver.dashboard.active') : driver?.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
