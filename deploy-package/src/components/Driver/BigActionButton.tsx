'use client';

import { useState, useCallback, useMemo } from 'react';
import { useI18n } from '@/locales/client';
import { resolveDisplayBranch } from '@/lib/utils';
import { Loader2, CheckCircle2 } from 'lucide-react';

type ButtonState =
  | 'EMPTY'
  | 'START_ROUTE'
  | 'NAVIGATE'
  | 'MARK_ARRIVED'
  | 'START_DELIVERY'
  | 'ROUTE_COMPLETE'
  | 'SUCCESS';

interface RouteStop {
  id: string;
  stopNumber: number;
  status: string;
  deliveryId: string;
  delivery: {
    id: string;
    order: {
      orderNumber: string;
      customer: { name: string; address?: string; _count?: { branches: number } };
      orderItems: Array<{
        branch: {
          id: string;
          branchName: string;
          fullName: string;
          deliveryAddress: string | null;
          latitude: number | null;
          longitude: number | null;
        } | null;
      }>;
    };
  };
}

interface Route {
  id: string;
  routeName: string;
  status: string;
  stops: RouteStop[];
  vehicle: {
    plateNumber: string;
    model: string;
  };
}

interface BigActionButtonProps {
  activeRoute: Route | null;
  plannedRoute: Route | null;
  onRouteStarted?: () => void;
  onStartRoute?: () => void; // Added for verification flow
  onStopUpdated?: () => void;
  onRouteCompleted?: () => void;
  locale: string;
}

const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'SKIPPED'];

function deriveButtonState(
  activeRoute: Route | null,
  plannedRoute: Route | null
): ButtonState {
  if (!activeRoute && !plannedRoute) return 'EMPTY';
  if (plannedRoute && !activeRoute) return 'START_ROUTE';
  if (!activeRoute) return 'EMPTY';

  const nextStop = activeRoute.stops
    .sort((a, b) => a.stopNumber - b.stopNumber)
    .find((s) => !TERMINAL_STATUSES.includes(s.status));

  if (!nextStop) return 'ROUTE_COMPLETE';
  if (nextStop.status === 'ARRIVED') return 'START_DELIVERY';
  if (nextStop.status === 'EN_ROUTE') return 'MARK_ARRIVED';
  return 'NAVIGATE';
}

function getDriverToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('driverToken');
}

export function BigActionButton({
  activeRoute,
  plannedRoute,
  onRouteStarted,
  onStartRoute,
  onStopUpdated,
  onRouteCompleted,
  locale,
}: BigActionButtonProps) {
  const t = useI18n();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const buttonState = useMemo(() => {
    if (isSuccess) return 'SUCCESS';
    return deriveButtonState(activeRoute, plannedRoute);
  }, [activeRoute, plannedRoute, isSuccess]);

  const nextStop = useMemo(() => {
    if (!activeRoute) return null;
    return activeRoute.stops
      .sort((a, b) => a.stopNumber - b.stopNumber)
      .find((s) => !TERMINAL_STATUSES.includes(s.status)) || null;
  }, [activeRoute]);

  const currentStopIndex = useMemo(() => {
    if (!activeRoute || !nextStop) return 0;
    return activeRoute.stops
      .sort((a, b) => a.stopNumber - b.stopNumber)
      .findIndex((s) => s.id === nextStop.id) + 1;
  }, [activeRoute, nextStop]);

  const totalStops = activeRoute?.stops.length || 0;

  const branchName = useMemo(() => {
    if (!nextStop) return '';
    const branch = nextStop.delivery?.order?.orderItems?.[0]?.branch;
    const customer = nextStop.delivery?.order?.customer;
    return resolveDisplayBranch(branch?.branchName, customer?.name, customer?._count?.branches) || '';
  }, [nextStop]);

  const handleStartRoute = useCallback(async () => {
    if (!plannedRoute) return;
    
    // If override provided (for verification flow), use it
    if (onStartRoute) {
      onStartRoute();
      return;
    }

    setLoading(true);
    try {
      const token = getDriverToken();
      const response = await fetch(`/api/routes/${plannedRoute.id}/start`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start route');
      }

      onRouteStarted?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start route');
    } finally {
      setLoading(false);
    }
  }, [plannedRoute, onRouteStarted, onStartRoute]);

  const handleNavigate = useCallback(() => {
    if (!nextStop) return;
    const branch = nextStop.delivery?.order?.orderItems?.[0]?.branch;

    if (branch?.latitude && branch?.longitude) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const yandexUrl = `https://yandex.com/maps/?pt=${branch.longitude},${branch.latitude}&z=16`;
      const googleUrl = `https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`;
      window.open(isMobile ? yandexUrl : googleUrl, '_blank');
    } else if (branch?.deliveryAddress) {
      const encodedAddress = encodeURIComponent(branch.deliveryAddress);
      window.open(
        `https://yandex.com/maps/?text=${encodedAddress}`,
        '_blank'
      );
    }
  }, [nextStop]);

  const handleMarkArrived = useCallback(async () => {
    if (!activeRoute || !nextStop) return;
    setLoading(true);
    try {
      const token = getDriverToken();
      
      const isStandalone = activeRoute.id.startsWith('standalone-');
      const apiPath = isStandalone
        ? `/api/driver/deliveries/${activeRoute.id.replace('standalone-', '')}/arrive`
        : `/api/routes/${activeRoute.id}/stops/${nextStop.id}`;

      const response = await fetch(
        apiPath,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ 
            status: 'ARRIVED',
            notes: JSON.stringify({ arrivedAt: new Date().toISOString() })
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark arrival');
      }

      // Show success state for 1 second
      setLoading(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        setIsSuccess(false);
        onStopUpdated?.();
      }, 1000);
    } catch (err) {
      setLoading(false);
      alert(err instanceof Error ? err.message : 'Failed to mark arrival');
    }
  }, [activeRoute, nextStop, onStopUpdated]);

  const handleStartDelivery = useCallback(() => {
    if (!nextStop) return;
    window.location.href = `/${locale}/driver/delivery/${nextStop.deliveryId}`;
  }, [nextStop, locale]);

  const handleRouteComplete = useCallback(async () => {
    onRouteCompleted?.();
  }, [onRouteCompleted]);

  const config = useMemo(() => {
    switch (buttonState) {
      case 'SUCCESS':
        return {
          label: t('Driver.bigButton.arrived'),
          color: 'bg-emerald-600 text-white',
          disabled: true,
          action: () => {},
          subtitle: null,
          icon: <CheckCircle2 className="h-6 w-6" />,
        };
      case 'EMPTY':
        return {
          label: t('Driver.bigButton.noRoutes'),
          color: 'bg-slate-200 text-slate-500',
          disabled: true,
          action: () => {},
          subtitle: null,
          icon: null,
        };
      case 'START_ROUTE':
        return {
          label: t('Driver.bigButton.startRoute'),
          color: 'bg-sky-600 hover:bg-sky-700 text-white',
          disabled: false,
          action: handleStartRoute,
          subtitle: plannedRoute?.routeName || null,
          icon: null,
        };
      case 'NAVIGATE':
        return {
          label: t('Driver.bigButton.navigate', {
            branch: branchName
          }),
          color: 'bg-blue-600 hover:bg-blue-700 text-white',
          disabled: false,
          action: handleNavigate,
          subtitle: t('Driver.bigButton.stopOf', {
            current: String(currentStopIndex),
            total: String(totalStops)
          }),
          icon: null,
        };
      case 'MARK_ARRIVED':
        return {
          label: t('Driver.bigButton.arrived'),
          color: 'bg-amber-600 hover:bg-amber-700 text-white',
          disabled: false,
          action: handleMarkArrived,
          subtitle: branchName || null,
          icon: null,
        };
      case 'START_DELIVERY':
        return {
          label: t('Driver.bigButton.startDelivery'),
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          disabled: false,
          action: handleStartDelivery,
          subtitle: branchName || null,
          icon: null,
        };
      case 'ROUTE_COMPLETE':
        return {
          label: t('Driver.bigButton.routeComplete'),
          color: 'bg-emerald-700 hover:bg-emerald-800 text-white',
          disabled: false,
          action: handleRouteComplete,
          subtitle: activeRoute?.routeName || null,
          icon: null,
        };
    }
  }, [
    buttonState,
    t,
    branchName,
    currentStopIndex,
    totalStops,
    plannedRoute,
    activeRoute,
    handleStartRoute,
    handleNavigate,
    handleMarkArrived,
    handleStartDelivery,
    handleRouteComplete,
  ]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
      <div className="bg-white px-4 pb-4 pt-1">
        <button
          onClick={config.action}
          disabled={config.disabled || loading}
          className={`w-full h-14 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 flex flex-col items-center justify-center ${config.color} ${
            config.disabled && buttonState !== 'SUCCESS' ? 'cursor-not-allowed opacity-60' : 'active:scale-[0.98]'
          }`}
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <div className="flex items-center gap-2">
                {config.icon}
                <span className="leading-tight">{config.label}</span>
              </div>
              {config.subtitle && (
                <span className="text-xs font-medium opacity-80 leading-tight">
                  {config.subtitle}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
