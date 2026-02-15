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

interface YandexMapProps {
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  markers?: MapMarker[];
  route?: Array<[number, number]>; // Array of [lng, lat]
  height?: string;
  onMarkerClick?: (markerId: string) => void;
  showTraffic?: boolean;
}

/**
 * Yandex Maps component for displaying delivery routes and locations
 * Optimized for Tashkent, Uzbekistan
 */
export default function YandexMap({
  center = [69.2401, 41.2995], // Tashkent default
  zoom = 11,
  markers = [],
  route = [],
  height = '500px',
  onMarkerClick,
  showTraffic = false,
}: YandexMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Yandex Maps API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '70ee7809-4152-4f7d-9c18-867ba98773f1';

    console.log('Loading Yandex Maps with API key:', apiKey ? apiKey.substring(0, 8) + '...' : 'NO KEY');

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=en_US`;
    script.async = true;
    script.onload = () => {
      console.log('Yandex Maps API loaded successfully');
      (window as any).ymaps3.ready(initMap);
    };
    script.onerror = () => {
      console.error('Failed to load Yandex Maps API');
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize map
  const initMap = () => {
    if (!mapContainer.current) return;

    const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapControls } =
      (window as any).ymaps3;

    map.current = new YMap(mapContainer.current, {
      location: {
        center: { lng: center[0], lat: center[1] },
        zoom: zoom,
      },
    });

    // Add default layers
    map.current.addChild(new YMapDefaultSchemeLayer());
    map.current.addChild(new YMapDefaultFeaturesLayer());

    // Add traffic layer if enabled
    if (showTraffic) {
      const { YMapDefaultFeaturesLayer } = (window as any).ymaps3;
      const trafficLayer = new YMapDefaultFeaturesLayer({
        customization: { 'traffic:enabled': true },
      });
      map.current.addChild(trafficLayer);
    }

    // Add controls
    map.current.addChild(
      new YMapControls({ position: 'right' }).addChild(
        new (window as any).ymaps3.YMapZoomControl({})
      )
    );

    // Add route if provided
    if (route && route.length > 0) {
      const { YMapGeoJsonSource } = (window as any).ymaps3;
      const routeGeoJson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: route,
            },
            properties: {},
          },
        ],
      };

      const source = new YMapGeoJsonSource({ data: routeGeoJson });
      map.current.addChild(source);
    }

    // Add markers
    addMarkers(markers);

    setIsLoaded(true);
  };

  // Add markers to map
  const addMarkers = (markerList: MapMarker[]) => {
    if (!map.current) return;

    const { YMapMarker } = (window as any).ymaps3;

    markerList.forEach((marker) => {
      const markerElement = document.createElement('div');
      markerElement.innerHTML = `
        <div class="flex flex-col items-center cursor-pointer" onclick="window.handleMarkerClick('${marker.id}')">
          <div class="relative">
            <svg class="w-8 h-8 ${marker.color || 'text-indigo-600'}" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/>
            </svg>
            <span class="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded">
              ${marker.label}
            </span>
          </div>
        </div>
      `;

      const ymarker = new YMapMarker(
        {
          coordinates: [marker.longitude, marker.latitude],
          draggable: false,
        },
        markerElement
      );

      map.current.addChild(ymarker);

      if (marker.onClick) {
        markerElement.addEventListener('click', () => {
          marker.onClick?.();
          onMarkerClick?.(marker.id);
        });
      }
    });
  };

  // Store marker click handler globally
  useEffect(() => {
    (window as any).handleMarkerClick = (markerId: string) => {
      onMarkerClick?.(markerId);
    };
  }, [onMarkerClick]);

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      <div ref={mapContainer} style={{ height, width: '100%' }} className="relative">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading Yandex Maps...</p>
              <p className="text-xs text-gray-500 mt-2">
                If the map doesn't load, please configure your Yandex API key
              </p>
              <a
                href="https://developer.tech.yandex.com/services/34"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:text-indigo-700 mt-2 block font-semibold"
              >
                Get API Key →
              </a>
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
