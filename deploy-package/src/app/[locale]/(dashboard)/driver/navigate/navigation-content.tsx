'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { navigationService, NavigationState } from '@/lib/navigationService';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useETAStream, ETAStreamMessage } from '@/hooks/useETAStream';
import { AlternativeRoutesModal } from '@/components/Map/AlternativeRoutesModal';
import { YandexCoordinates } from '@/types/yandex';

interface RouteInfo {
  destination: YandexCoordinates;
  deliveryId: string;
  branchName: string;
  address: string;
}

interface AlternativeRouteData {
  currentRoute: {
    duration: number;
    durationInTraffic: number;
    distance: number;
  };
  alternatives: Array<{
    id: string;
    duration: number;
    durationInTraffic: number;
    distance: number;
    timeSavings: number;
    trafficLevel: 'low' | 'medium' | 'high' | 'blocked';
    instructions: Array<{
      distance: number;
      duration: number;
      description: string;
    }>;
    routeGeometry: string;
  }>;
  trafficLevel: string;
}

export default function NavigationContent() {
  const searchParams = useSearchParams();
  const routeIdParam = searchParams.get('routeId');
  const stopIdParam = searchParams.get('stopId');

  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [navigationState, setNavigationState] = useState<NavigationState | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [liveETAs, setLiveETAs] = useState<ETAStreamMessage['etas']>(undefined);
  const [trafficAlert, setTrafficAlert] = useState<string | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<AlternativeRouteData | null>(null);
  const [isRerouting, setIsRerouting] = useState(false);

  const { location, isTracking, accuracy, error: locationError } = useLocationTracking({
    enableHighAccuracy: true,
    adaptivePulling: true,
    onError: (err) => setError(err),
  });

  // Connect to ETA stream
  const { isConnected: etaConnected, error: etaError } = useETAStream({
    routeId: routeIdParam || '',
    enabled: !!routeIdParam && isNavigating,
    onUpdate: (message: ETAStreamMessage) => {
      if (message.type === 'eta_update') {
        setLiveETAs(message.etas);
        if (message.notifications && message.notifications.length > 0) {
          setTrafficAlert(message.notifications[0]);
          // Auto-fetch alternatives when traffic alert received
          fetchAlternatives();
        }
      }
    },
    onError: (error: string) => {
      console.error('ETA stream error:', error);
    },
  });

  // Fetch alternative routes when traffic worsens
  const fetchAlternatives = useCallback(async () => {
    if (!routeIdParam) return;

    try {
      const response = await fetch(`/api/routes/${routeIdParam}/alternatives`);
      const data = await response.json();

      if (data.success && data.alternatives.length > 0) {
        setAlternatives(data);
        setShowAlternatives(true);
      }
    } catch (err) {
      console.error('Failed to fetch alternatives:', err);
    }
  }, [routeIdParam]);

  // Handle switching to alternative route
  const handleSelectAlternative = useCallback(
    async (route: AlternativeRouteData['alternatives'][0]) => {
      if (!routeIdParam || !location) return;

      try {
        setIsRerouting(true);
        const response = await fetch(`/api/routes/${routeIdParam}/reroute`, {
          method: 'POST',
        credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alternativeRouteId: route.id,
            currentLocation: location,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setShowAlternatives(false);
          setTrafficAlert(null);
          // Optionally show confirmation
          console.log('Route updated successfully');
        }
      } catch (err) {
        console.error('Error switching route:', err);
        setError('Failed to switch route');
      } finally {
        setIsRerouting(false);
      }
    },
    [routeIdParam, location]
  );

  // Fetch route and stop information
  useEffect(() => {
    const fetchRouteInfo = async () => {
      if (!stopIdParam) {
        setError('No stop ID provided');
        return;
      }

      try {
        const response = await fetch(`/api/routes/${routeIdParam}/stops/${stopIdParam}`);
        const data = await response.json();

        if (!data.stop) {
          setError('Stop not found');
          return;
        }

        const stop = data.stop;
        const delivery = stop.delivery;
        const order = delivery.order;

        setRouteInfo({
          destination: {
            latitude: delivery.order.orderItems[0]?.branch?.latitude || 0,
            longitude: delivery.order.orderItems[0]?.branch?.longitude || 0,
          },
          deliveryId: delivery.id,
          branchName: delivery.order.orderItems[0]?.branch?.branchName || 'Unknown',
          address: delivery.order.orderItems[0]?.branch?.deliveryAddress || 'No address provided',
        });
      } catch (err) {
        setError('Failed to load route information');
        console.error(err);
      }
    };

    fetchRouteInfo();
  }, [routeIdParam, stopIdParam]);

  // Initialize navigation
  useEffect(() => {
    const initNavigation = async () => {
      if (!routeInfo || !location) return;

      try {
        await navigationService.initializeNavigation(location, routeInfo.destination);
        setIsNavigating(true);
        setError(null);
      } catch (err) {
        setError('Failed to initialize navigation');
        console.error(err);
      }
    };

    initNavigation();
  }, [routeInfo, location]);

  // Update navigation state with current location
  useEffect(() => {
    if (!isNavigating || !location) return;

    try {
      const state = navigationService.updateNavigationState(location, 0);
      setNavigationState(state);
      setIsOffRoute(state.isOffRoute);

      // Log off-route warning
      if (state.isOffRoute && !isOffRoute) {
        console.warn('Driver off route!', {
          deviation: state.deviationDistance,
          needsRerouting: state.needsRerouting,
        });
      }
    } catch (err) {
      console.error('Error updating navigation state:', err);
    }
  }, [location, isNavigating, isOffRoute]);

  if (!isTracking) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-sm sm:text-base">Инициализация GPS...</p>
        </div>
      </div>
    );
  }

  if (!routeInfo || !navigationState) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-red-600 mb-2 text-sm sm:text-base">{error || 'Загрузка навигации...'}</p>
          {error && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm sm:text-base"
            >
              Повторить
            </button>
          )}
        </div>
      </div>
    );
  }

  const nextInstruction = navigationService.getNextInstructionText(navigationState);
  const remainingTime = navigationService.formatRemainingTime(navigationState.remainingDuration);
  const remainingDistance = navigationService.formatRemainingDistance(navigationState.remainingDistance);

  return (
    <>
      {/* Alternative Routes Modal */}
      {alternatives && (
        <AlternativeRoutesModal
          isOpen={showAlternatives}
          currentRoute={alternatives.currentRoute}
          alternatives={alternatives.alternatives}
          trafficLevel={alternatives.trafficLevel}
          onSelectRoute={handleSelectAlternative}
          onClose={() => setShowAlternatives(false)}
        />
      )}

      <div className="w-full h-screen bg-gray-900 text-white flex flex-col">
        {/* Traffic Alert Banner */}
        {trafficAlert && (
          <div className="bg-red-600 px-4 py-3 text-white text-sm font-semibold flex items-center justify-between">
            <span>{trafficAlert}</span>
            <button
              onClick={() => {
                setTrafficAlert(null);
                setShowAlternatives(false);
              }}
              className="text-white hover:text-red-100 transition"
            >
              ✕
            </button>
          </div>
        )}

        {/* ETA Connection Status */}
        {!etaConnected && isNavigating && (
          <div className="bg-yellow-600 px-3 sm:px-4 py-2 text-white text-xs sm:text-sm">
            Подключение к обновлениям...
          </div>
        )}

        {/* Header with Route Info */}
        <div className="bg-indigo-700 px-3 sm:px-4 py-2 sm:py-3 shadow-lg">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <h1 className="text-base sm:text-lg font-bold truncate pr-2">{routeInfo.branchName}</h1>
            <div className="text-xs bg-indigo-600 px-2 py-1 rounded whitespace-nowrap">
              {navigationState.progress.toFixed(0)}%
            </div>
          </div>
          <p className="text-xs text-indigo-200 truncate">{routeInfo.address}</p>
        </div>

        {/* Main Navigation Map Area (Placeholder) */}
        <div className="flex-1 bg-gray-800 relative flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <div className="text-4xl mb-2">📍</div>
              {location && (
                <>
                  <p className="text-gray-400 text-sm">
                    Current: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                  <p className="text-gray-500 text-xs">Accuracy: ±{(accuracy || 0).toFixed(0)}m</p>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${navigationState.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Current Instruction Card */}
        <div className={`px-3 sm:px-4 py-3 sm:py-4 ${isOffRoute ? 'bg-red-700' : 'bg-indigo-600'} shadow-lg`}>
          {isOffRoute ? (
            <div>
              <p className="text-xs sm:text-sm font-bold mb-2">⚠️ Вне маршрута</p>
              <p className="text-sm sm:text-base">
                Отклонение: {navigationService.formatRemainingDistance(navigationState.deviationDistance)}
              </p>
              {navigationState.needsRerouting && (
                <button className="mt-2 w-full py-2 bg-red-800 rounded-lg text-xs sm:text-sm font-bold hover:bg-red-900">
                  Построить новый маршрут
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase mb-2">Поворот</p>
              <p className="text-base sm:text-lg font-bold leading-tight">{nextInstruction}</p>
            </div>
          )}
        </div>

        {/* Bottom Info Panel */}
        <div className="bg-gray-800 px-3 sm:px-4 py-3 sm:py-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Расстояние</p>
              <p className="text-lg sm:text-2xl font-bold">{remainingDistance}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Время</p>
              <p className="text-lg sm:text-2xl font-bold">{remainingTime}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Остановок</p>
              <p className="text-lg sm:text-2xl font-bold">
                {Math.max(0, navigationService.getInstructions().length - navigationState.currentInstructionIndex)}
              </p>
            </div>
          </div>

          {/* Upcoming Instructions */}
          <div className="bg-gray-700 rounded-lg p-2 sm:p-3 mb-3">
            <p className="text-xs font-bold text-gray-300 mb-2">Предстоящие повороты</p>
            <div className="space-y-2">
              {navigationService
                .getUpcomingInstructions(navigationState.currentInstructionIndex + 1, 2)
                .map((instruction, idx) => (
                  <div key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="text-gray-500">→</span>
                    <span>{navigationService.formatRemainingDistance(instruction.distance)} - {instruction.description}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button className="flex-1 py-2 sm:py-3 bg-green-600 rounded-lg font-bold hover:bg-green-700 text-xs sm:text-sm">
              ✓ Прибыл
            </button>
            <button className="flex-1 py-2 sm:py-3 bg-gray-600 rounded-lg font-bold hover:bg-gray-700 text-xs sm:text-sm">
              📞 Поддержка
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
