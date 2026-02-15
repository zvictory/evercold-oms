'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n, useCurrentLocale } from '@/locales/client';
import { BigActionButton } from '@/components/Driver/BigActionButton';
import { ActiveStopCard } from '@/components/Driver/ActiveStopCard';
import { RouteTimeline } from '@/components/Driver/RouteTimeline';
import { SortableStopList } from '@/components/Driver/SortableStopList';
import { StopDetailDrawer } from '@/components/Driver/StopDetailDrawer';
import { PreTripVerification } from '@/components/Driver/PreTripVerification';
import { confirmLoading } from '@/app/actions/driver/confirm-loading';

// Types
interface RouteStop {
  id: string;
  stopNumber: number;
  status: string;
  deliveryId: string;
  delivery: {
    id: string;
    orderId: string;
    status: string;
    order: {
      orderNumber: string;
      customer: { name: string; address?: string; phone?: string };
      orderItems: Array<{
        productName: string;
        quantity: number;
        sapCode?: string;
        product: { name: string };
        branch?: {
          branchName?: string;
          phone?: string;
          latitude?: number;
          longitude?: number;
          deliveryAddress?: string;
        };
      }>;
    };
  };
}

interface ActiveRoute {
  id: string;
  routeName: string;
  status: string;
  stops: RouteStop[];
  vehicle: {
    id: string;
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
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);

  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);

  // PreTripVerification State
  const [showVerification, setShowVerification] = useState(false);

  // Initial Data Load
  const refreshDashboard = async () => {
    try {
      const driverInfo = localStorage.getItem('driverInfo');
      if (!driverInfo) {
        router.push(`/${locale}/driver-login`);
        return;
      }

      const driverData = JSON.parse(driverInfo);
      setDriver(driverData);

      const token = localStorage.getItem('driverToken');
      const res = await fetch(`/api/driver/deliveries?driverId=${driverData.id}`, {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();

        const active = data.routes?.find((r: any) => r.status === 'IN_PROGRESS');

        // Find standalone routes (virtual ones created by API)
        const standaloneRoutes = data.routes?.filter((r: any) => r.isStandalone && r.status === 'PLANNED') || [];

        // Find regular planned routes
        const regularPlanned = data.routes?.filter((r: any) => !r.isStandalone && r.status === 'PLANNED') || [];

        let planned = null;

        if (regularPlanned.length > 0) {
          planned = regularPlanned[0];
        } else if (standaloneRoutes.length > 0) {
          // MERGE standalone routes into one "Ad-hoc" route
          const mergedStops = standaloneRoutes.flatMap((r: any, index: number) => ({
            ...r.stops[0],
            stopNumber: index + 1,
            id: r.stops[0].id
          }));

          planned = {
            id: 'ad-hoc-merged',
            routeName: `My Deliveries (${standaloneRoutes.length})`,
            status: 'PLANNED',
            stops: mergedStops,
            vehicle: standaloneRoutes[0].vehicle,
            isAdHoc: true,
            originalRoutes: standaloneRoutes
          };
        }

        setActiveRoute(active || planned || null);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDashboard();
  }, [router]);

  // Handler: Confirm Loading (Start Route)
  const handleStartRoute = async () => {
    if (!activeRoute || !driver) return;

    try {
      setProcessingAction(true);

      let result;

      if ((activeRoute as any).isAdHoc) {
        const deliveryIds = activeRoute.stops.map(s => s.deliveryId);
        const { startAdHocRoute } = await import('@/app/actions/driver/start-ad-hoc-route');

        result = await startAdHocRoute({
          deliveryIds,
          driverId: driver.id,
          vehicleId: activeRoute.vehicle?.id
        });
      } else {
        result = await confirmLoading({ routeId: activeRoute.id });
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to start route');
      }

      setShowVerification(false);
      await refreshDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start route');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handler: Route Complete
  const handleRouteComplete = async () => {
    if (!activeRoute) return;
    try {
      const token = localStorage.getItem('driverToken');
      const response = await fetch(`/api/routes/${activeRoute.id}/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete route');
      }

      await refreshDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to complete route');
    }
  };

  // Helper: Open stop detail drawer
  const handleStopClick = (stop: any) => {
    setSelectedStop(stop as RouteStop);
    setDrawerOpen(true);
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-200 border-t-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">{t('Driver.dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  // Condition A: PLANNED Route
  if (activeRoute && activeRoute.status === 'PLANNED') {
    // Sub-view: PreTripVerification
    if (showVerification) {
      return (
        <PreTripVerification
          route={activeRoute}
          onConfirm={handleStartRoute}
          onCancel={() => setShowVerification(false)}
          loading={processingAction}
        />
      );
    }

    // Main PLANNED view: Sortable list + BigActionButton
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white p-4 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">{activeRoute.routeName}</h1>
          <p className="text-sm text-slate-500">{t('Driver.dashboard.dragToReorder')}</p>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <SortableStopList
            stops={activeRoute.stops.sort((a, b) => a.stopNumber - b.stopNumber)}
            routeId={activeRoute.id}
            onOrderChanged={refreshDashboard}
            onStopClick={handleStopClick}
          />
        </div>

        {/* BigActionButton for PLANNED state */}
        <BigActionButton
          plannedRoute={activeRoute as any}
          activeRoute={null}
          onStartRoute={() => setShowVerification(true)}
          onRouteStarted={refreshDashboard}
          locale={locale}
        />

        {/* Stop Detail Drawer */}
        <StopDetailDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          stop={selectedStop}
        />
      </div>
    );
  }

  // Condition B & C: Active Route (IN_PROGRESS)
  if (activeRoute && activeRoute.status === 'IN_PROGRESS') {
    const nextStop = activeRoute.stops
      .sort((a, b) => a.stopNumber - b.stopNumber)
      .find(s => ['PENDING', 'EN_ROUTE', 'ARRIVED'].includes(s.status));

    const isRouteComplete = !nextStop;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {activeRoute.routeName}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-emerald-700 font-bold">
                  {t('Driver.dashboard.active')}
                </span>
              </div>
            </div>
            <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
              {activeRoute.vehicle.plateNumber}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 pb-32 space-y-6">
          {/* Active Task Card */}
          {!isRouteComplete && nextStop && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ActiveStopCard
                stop={nextStop}
                onNavigate={() => {
                  const branch = nextStop.delivery.order.orderItems[0]?.branch;
                  if (branch?.latitude && branch?.longitude) {
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                    const url = isMobile
                      ? `yandexmaps://maps.yandex.ru/?pt=${branch.longitude},${branch.latitude}&z=16&l=map`
                      : `https://yandex.com/maps/?pt=${branch.longitude},${branch.latitude}&z=16&l=map`;
                    window.open(url, '_blank');
                  }
                }}
                onCall={() => {
                  const phone = nextStop.delivery.order.orderItems[0]?.branch?.phone || nextStop.delivery.order.customer.phone;
                  if (phone) window.location.href = `tel:${phone}`;
                }}
              />
            </div>
          )}

          {/* Vertical Timeline */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <RouteTimeline
              stops={activeRoute.stops}
              currentStopId={nextStop?.id || ''}
              onStopClick={handleStopClick}
            />
          </div>

          {/* All Done State */}
          {isRouteComplete && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-8 rounded-2xl text-center shadow-sm">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold mb-2">{t('Driver.dashboard.allDeliveriesComplete')}</h2>
              <p className="text-emerald-700">{t('Driver.dashboard.allDeliveriesDone')}</p>
            </div>
          )}
        </main>

        {/* BigActionButton for IN_PROGRESS state */}
        <BigActionButton
          activeRoute={activeRoute as any}
          plannedRoute={null}
          onStopUpdated={refreshDashboard}
          onRouteCompleted={handleRouteComplete}
          locale={locale}
        />

        {/* Stop Detail Drawer */}
        <StopDetailDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          stop={selectedStop}
        />
      </div>
    );
  }

  // Default / Empty State
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-sm">
        <div className="text-5xl mb-4">👋</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          {t('Driver.dashboard.welcome')}, {driver?.name}
        </h1>
        <p className="text-slate-500 mb-6">
          {t('Driver.dashboard.noAssignedDeliveries')}
        </p>
        <button
          onClick={refreshDashboard}
          className="w-full py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 active:scale-95 transition-all"
        >
          {t('Driver.dashboard.retry')}
        </button>
      </div>
      <div className="mt-8 text-xs text-slate-400">
        {t('Driver.footer')}
      </div>
    </div>
  );
}
