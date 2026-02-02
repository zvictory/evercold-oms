'use client';

import { useEffect, useState } from 'react';
import {
  getMultiStopNavigation,
  formatDistance,
  formatDuration,
  getTurnInstruction,
  NavigationRoute,
} from '@/utils/navigationRouting';

interface DirectionsPanelProps {
  locations: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  }>;
  depotId?: string;
}

/**
 * Directions panel showing turn-by-turn navigation
 * Displays complete delivery route with detailed instructions
 */
export default function DirectionsPanel({
  locations,
  depotId = '1',
}: DirectionsPanelProps) {
  const [navigation, setNavigation] = useState<NavigationRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRoute, setExpandedRoute] = useState<number | null>(null);

  useEffect(() => {
    const loadDirections = async () => {
      setLoading(true);

      const depotIndex = locations.findIndex((l) => l.id === depotId);
      const navRoute = await getMultiStopNavigation(
        locations.map((l) => ({
          id: l.id,
          name: l.name,
          lat: l.latitude,
          lng: l.longitude,
        })),
        depotIndex >= 0 ? depotIndex : 0
      );

      if (navRoute) {
        setNavigation(navRoute);
      }

      setLoading(false);
    };

    if (locations.length > 0) {
      loadDirections();
    }
  }, [locations, depotId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Loading directions...</span>
        </div>
      </div>
    );
  }

  if (!navigation) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Turn-by-turn directions loading... Using optimized route visualization instead.
        </p>
        <p className="text-xs text-yellow-700 mt-2">
          💡 The route is optimized and ready for navigation. Directions will appear shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <h3 className="font-bold text-lg">Turn-by-Turn Navigation</h3>
        <div className="flex justify-between items-center mt-2 text-sm">
          <span>📍 {navigation.waypoints.length - 1} Stops</span>
          <span>📏 {formatDistance(navigation.totalDistance)}</span>
          <span>⏱️ {formatDuration(navigation.totalDuration)}</span>
        </div>
      </div>

      {/* Routes */}
      <div className="divide-y">
        {navigation.routes.map((route, routeIndex) => (
          <div key={routeIndex} className="p-4">
            {/* Route Summary */}
            <button
              onClick={() =>
                setExpandedRoute(expandedRoute === routeIndex ? null : routeIndex)
              }
              className="w-full text-left flex items-center justify-between hover:bg-gray-50 p-2 rounded transition"
            >
              <div>
                <div className="font-semibold text-gray-900">
                  {routeIndex + 1}. {navigation.waypoints[routeIndex]?.name}
                  <span className="text-gray-600 font-normal ml-2">→</span>
                  {navigation.waypoints[routeIndex + 1]?.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDistance(route.distance)} • {formatDuration(route.duration)}
                </div>
              </div>
              <div className="text-blue-600">
                {expandedRoute === routeIndex ? '▼' : '▶'}
              </div>
            </button>

            {/* Expanded Instructions */}
            {expandedRoute === routeIndex && route.steps && (
              <div className="bg-gray-50 p-4 mt-2 space-y-2 max-h-96 overflow-y-auto">
                {route.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="flex items-start space-x-3 text-sm">
                    {/* Direction Icon */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {stepIndex + 1}
                    </div>

                    {/* Instruction */}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {getTurnInstruction(step)}
                      </p>
                      {step.name && step.name !== 'Unnamed road' && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Street: {step.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 p-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {navigation.waypoints.length - 1}
            </div>
            <div className="text-xs text-gray-600">Total Stops</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {formatDistance(navigation.totalDistance)}
            </div>
            <div className="text-xs text-gray-600">Total Distance</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {formatDuration(navigation.totalDuration)}
            </div>
            <div className="text-xs text-gray-600">Total Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
