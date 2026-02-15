'use client';

import { useEffect, useState } from 'react';
import { FeatureGroup, Polyline, Popup } from 'react-leaflet';
import { getNavigationRoute, formatDistance, formatDuration } from '@/utils/navigationRouting';

interface RoutingLayerProps {
  from: [number, number];
  to: [number, number];
  label?: string;
  color?: string;
  onRouteLoaded?: (distance: number, duration: number) => void;
}

/**
 * Leaflet layer that displays turn-by-turn routing
 * Uses OSRM for professional navigation routing
 */
export default function RoutingLayer({
  from,
  to,
  label,
  color = '#3b82f6',
  onRouteLoaded,
}: RoutingLayerProps) {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoute = async () => {
      setLoading(true);
      setError(null);

      const route = await getNavigationRoute(from, to);

      if (route) {
        setRouteCoordinates(route.coordinates);
        setDistance(route.distance);
        setDuration(route.duration);
        onRouteLoaded?.(route.distance, route.duration);
      } else {
        setError('Could not load route. Using straight line instead.');
        // Fallback to straight line
        setRouteCoordinates([from, to]);
      }

      setLoading(false);
    };

    loadRoute();
  }, [from, to, onRouteLoaded]);

  if (!routeCoordinates || loading) {
    return null;
  }

  const midpoint = routeCoordinates[Math.floor(routeCoordinates.length / 2)];

  return (
    <FeatureGroup>
      <Polyline
        positions={routeCoordinates.map(([lng, lat]) => [lat, lng])}
        color={color}
        weight={3}
        opacity={0.8}
        dashArray={error ? '5, 5' : undefined}
      >
        <Popup>
          <div className="text-sm font-semibold">
            {label || 'Route'}
            <div className="text-xs text-gray-600 mt-1">
              📍 Distance: {formatDistance(distance)}
              <br />
              ⏱️ Duration: {formatDuration(duration)}
            </div>
            {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
          </div>
        </Popup>
      </Polyline>
    </FeatureGroup>
  );
}
