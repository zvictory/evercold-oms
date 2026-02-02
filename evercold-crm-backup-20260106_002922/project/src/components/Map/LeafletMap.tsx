'use client';

import { useEffect, useRef, useState } from 'react';

interface MapMarker {
  id: string;
  longitude: number;
  latitude: number;
  label: string;
  color?: string;
  onClick?: () => void;
}

interface LeafletMapProps {
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  markers?: MapMarker[];
  route?: Array<[number, number]>; // Array of [lng, lat]
  height?: string;
  onMarkerClick?: (markerId: string) => void;
  showTraffic?: boolean;
}

/**
 * Leaflet Map component for displaying delivery routes and locations
 * Uses OpenStreetMap (free, no API key required)
 * Optimized for Tashkent, Uzbekistan
 */
export default function LeafletMap({
  center = [69.2401, 41.2995], // Tashkent default [lng, lat]
  zoom = 11,
  markers = [],
  route = [],
  height = '500px',
  onMarkerClick,
  showTraffic = false,
}: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || typeof window === 'undefined') return;

    // Dynamically import Leaflet only on client side
    const loadMap = async () => {
      const L = (await import('leaflet')).default;

      // Fix icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Create map instance
      mapInstance.current = L.map(mapContainer.current!).setView(
        [center[1], center[0]], // Leaflet uses [lat, lng]
        zoom
      );

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current);

      // Add route polyline if provided
      if (route && route.length > 0) {
        const routeLatLng = route.map((point) => [point[1], point[0]] as [number, number]); // Convert [lng, lat] to [lat, lng]

        // Add solid polyline for route
        L.polyline(routeLatLng, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapInstance.current);

        // Add directional arrows along the route
        const ArrowheadPolyline = L.Polyline.extend({
          options: {
            arrowheads: true,
          },
        });

        // Animate the route path with a secondary glow effect
        L.polyline(routeLatLng, {
          color: '#60a5fa',
          weight: 8,
          opacity: 0.2,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapInstance.current);

        // Fit bounds to show all route points
        const bounds = L.latLngBounds(routeLatLng);
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
      }

      // Add markers
      markers.forEach((marker) => {
        const markerLatLng = [marker.latitude, marker.longitude] as [number, number];

        // Determine marker color
        const markerColor = marker.color?.includes('green')
          ? '#16a34a'
          : marker.color?.includes('yellow')
          ? '#eab308'
          : '#4f46e5';

        const leafletMarker = L.circleMarker(markerLatLng, {
          radius: 8,
          fillColor: markerColor,
          color: 'white',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .bindPopup(`<b>${marker.label}</b>`)
          .addTo(mapInstance.current);

        // Add click handler
        leafletMarker.on('click', () => {
          onMarkerClick?.(marker.id);
          marker.onClick?.();
        });
      });

      setIsLoaded(true);
    };

    loadMap().catch((err) => console.error('Failed to load map:', err));

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off();
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [center, zoom, markers, route, onMarkerClick]);

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.min.css"
      />
      <div ref={mapContainer} style={{ height, width: '100%' }} className="relative">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading OpenStreetMap...</p>
            </div>
          </div>
        )}
      </div>

      {/* Map Info */}
      {markers.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-3">
          <p className="text-sm text-gray-600">
            📍 {markers.length} location{markers.length !== 1 ? 's' : ''} •{' '}
            {route.length > 0 && `✓ Route loaded`}
          </p>
        </div>
      )}
    </div>
  );
}
