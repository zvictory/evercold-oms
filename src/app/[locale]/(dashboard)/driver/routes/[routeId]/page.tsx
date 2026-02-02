'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/locales/client';
import { YandexNavigationButton } from '@/components/Driver/YandexNavigationButton';

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
  const t = useI18n();
  const tCommon = t;
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
        credentials: 'include',
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
        credentials: 'include',
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
        return 'bg-slate-50 border-slate-200 text-slate-600';
      case 'EN_ROUTE':
        return 'bg-blue-50 border-blue-300 text-blue-700';
      case 'ARRIVED':
        return 'bg-sky-50 border-sky-400 ring-2 ring-sky-300 text-sky-700';
      case 'COMPLETED':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'FAILED':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'SKIPPED':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-600';
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
        return 'Driver.route.status.pending';
      case 'EN_ROUTE':
        return 'Driver.route.status.enRoute';
      case 'ARRIVED':
        return 'Driver.route.status.arrived';
      case 'COMPLETED':
        return 'Driver.route.status.completed';
      case 'FAILED':
        return 'Driver.route.status.failed';
      case 'SKIPPED':
        return 'Driver.route.status.skipped';
      default:
        return status;
    }
  };

  const getRouteStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'Driver.route.status.planned';
      case 'IN_PROGRESS':
        return 'Driver.route.status.inProgress';
      case 'COMPLETED':
        return 'Driver.route.status.completed';
      case 'CANCELLED':
        return 'Driver.route.status.cancelled';
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
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-sky-200 border-t-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm sm:text-base">{t('Driver.route.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold text-sm sm:text-base">{t('Driver.route.error')}: {error || t('Driver.route.notFound')}</p>
          <Link
            href="/driver/routes"
            className="mt-2 inline-block px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm sm:text-base shadow-sm"
          >
            {t('Driver.route.backToRoutes')}
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
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 sticky top-0 z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                🗺️ {route.routeName}
              </h1>
              {route.isStandalone && (
                <span className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold rounded">
                  {t('Driver.route.standaloneDelivery')}
                </span>
              )}
            </div>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              {route.status === 'PLANNED' && '📋 ' + (t as any)(getRouteStatusText('PLANNED'))}
              {route.status === 'IN_PROGRESS' && '🚗 ' + (t as any)(getRouteStatusText('IN_PROGRESS'))}
              {route.status === 'COMPLETED' && '✅ ' + (t as any)(getRouteStatusText('COMPLETED'))}
              {route.status === 'CANCELLED' && '❌ ' + (t as any)(getRouteStatusText('CANCELLED'))}
              <span className="ml-2">• {totalStops} {t('Driver.route.plurals.stop_other')}</span>
            </p>
          </div>
          <Link
            href="/driver/routes"
            className="text-sky-600 hover:text-sky-800 text-sm font-medium"
          >
            ← {t('Driver.route.back')}
          </Link>
        </div>
        <p className="text-slate-700 text-sm sm:text-base">
          🚚 {route.vehicle.plateNumber} • {route.vehicle.model}
        </p>
      </div>

      {/* Progress Stats */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
          📊 {t('Driver.route.progress')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-600">{t('Driver.route.completedStops')}</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">
              {completedStops}/{totalStops}
            </p>
          </div>
          {route.totalDistance && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-600">{t('Driver.route.distance')}</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {route.totalDistance.toFixed(1)} км
              </p>
            </div>
          )}
          {route.estimatedDuration && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-600">{t('Driver.route.time')}</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {route.estimatedDuration} мин
              </p>
            </div>
          )}
          {route.estimatedDurationWithTraffic && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-600">{t('Driver.route.timeWithTraffic')}</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {route.estimatedDurationWithTraffic} мин
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-emerald-600 h-3 rounded-full transition-all"
              style={{ width: `${(completedStops / totalStops) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Full Route Navigation */}
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg p-4 sm:p-6 border border-blue-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🧭</span>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">
            {t('Driver.route.fullRouteNavigation')}
          </h2>
        </div>

        <YandexNavigationButton stops={route.stops} variant="primary" />

        <p className="text-xs text-slate-600 mt-3 leading-relaxed">
          {t('Driver.route.fullRouteDescription')}
        </p>
      </div>

      {/* Stops List */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 px-1">
          📍 {t('Driver.route.stops')}
        </h2>

        {route.stops.map((stop, index) => {
          const branch = getFirstBranch(stop);
          const accessible = isStopAccessible(stop, index);

          return (
            <div
              key={stop.id}
              className={`border rounded-lg p-4 sm:p-6 ${getStatusColor(stop.status)} ${!accessible ? 'opacity-60' : ''
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl sm:text-3xl">{getStatusIcon(stop.status)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {t('Driver.route.stopNumber')} {stop.stopNumber}
                      </h3>
                      <span className="px-2 py-1 bg-white/50 rounded text-xs font-semibold">
                        {(t as any)(getStatusText(stop.status))}
                      </span>
                    </div>
                    <p className="text-slate-900 font-semibold mt-1 text-sm sm:text-base">
                      {stop.delivery.order.customer.name}
                    </p>
                    <p className="text-slate-700 text-xs sm:text-sm mt-1">
                      {t('Driver.route.orderNumber')} {stop.delivery.order.orderNumber}
                    </p>
                  </div>
                </div>
              </div>

              {branch && (
                <div className="bg-white/30 rounded-lg p-3 mb-3">
                  <p className="font-semibold text-slate-900 text-sm sm:text-base">
                    {branch.fullName}
                  </p>
                  {branch.deliveryAddress && (
                    <p className="text-slate-700 text-xs sm:text-sm mt-1">
                      📍 {branch.deliveryAddress}
                    </p>
                  )}
                  {branch.phone && (
                    <p className="text-slate-700 text-xs sm:text-sm mt-1">📞 {branch.phone}</p>
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
                      className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition text-sm sm:text-base disabled:opacity-50 shadow-sm"
                    >
                      {updatingStop === stop.id ? t('Driver.route.processing') : '🚗 ' + t('Driver.route.arrivedButton')}
                    </button>
                  )}

                  {stop.status === 'EN_ROUTE' && (
                    <button
                      onClick={() => setShowArrivalModal(stop.id)}
                      disabled={updatingStop === stop.id}
                      className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition text-sm sm:text-base disabled:opacity-50 shadow-sm"
                    >
                      {updatingStop === stop.id ? t('Driver.route.processing') : '🚗 ' + t('Driver.route.arrivedButton')}
                    </button>
                  )}

                  {stop.status === 'ARRIVED' && (
                    <Link
                      href={`/driver/delivery/${stop.deliveryId}`}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white text-center rounded-lg font-semibold hover:bg-emerald-700 transition text-sm sm:text-base shadow-sm"
                    >
                      ✅ {t('Driver.route.deliveryChecklist')}
                    </Link>
                  )}

                  {branch?.phone && ['PENDING', 'EN_ROUTE', 'ARRIVED'].includes(stop.status) && (
                    <a
                      href={`tel:${branch.phone}`}
                      className="flex-1 px-4 py-2 bg-sky-600 text-white text-center rounded-lg font-semibold hover:bg-sky-700 transition text-sm sm:text-base shadow-sm"
                    >
                      📱 {t('Driver.route.call')}
                    </a>
                  )}
                </div>
              )}

              {!accessible && (
                <div className="bg-white/30 rounded-lg p-3 text-center">
                  <p className="text-slate-600 text-sm">
                    🔒 {t('Driver.route.lockedUntil')} {index}
                  </p>
                </div>
              )}

              {stop.completedAt && (
                <p className="text-xs text-slate-600 mt-2">
                  ✓ {t('Driver.route.completedAt')} {new Date(stop.completedAt).toLocaleString('ru-RU')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Arrival Confirmation Modal */}
      {showArrivalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {t('Driver.route.confirmArrivalTitle')}
            </h3>
            <p className="text-slate-600 mb-6">
              {t('Driver.route.confirmArrivalMessage')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowArrivalModal(null)}
                disabled={updatingStop !== null}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition disabled:opacity-50"
              >
                {t('Common.cancel')}
              </button>
              <button
                onClick={() => confirmArrival(showArrivalModal)}
                disabled={updatingStop !== null}
                className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition disabled:opacity-50 shadow-sm"
              >
                {updatingStop ? t('Driver.route.processing') : t('Driver.route.confirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
