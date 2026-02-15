'use client';

import { useState, useEffect } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { LayerProps } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapMarker {
  id: string;
  longitude: number;
  latitude: number;
  label: string;
  color?: string;
  onClick?: () => void;
}

interface MapProps {
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  markers?: MapMarker[];
  route?: Array<[number, number]>; // Array of [lng, lat]
  height?: string;
  onMarkerClick?: (markerId: string) => void;
}

const routeLayerStyle: LayerProps = {
  id: 'route',
  type: 'line',
  paint: {
    'line-color': '#4F46E5',
    'line-width': 4,
    'line-opacity': 0.8,
  },
};

/**
 * Interactive delivery map component using MapLibre GL
 * Shows delivery locations, routes, and supports markers with click handlers
 */
export default function DeliveryMap({
  center = [69.2401, 41.2995], // Tashkent default
  zoom = 11,
  markers = [],
  route = [],
  height = '500px',
  onMarkerClick,
}: MapProps) {
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom,
  });

  // Update view when center prop changes
  useEffect(() => {
    setViewState({
      longitude: center[0],
      latitude: center[1],
      zoom,
    });
  }, [center, zoom]);

  const handleMarkerClick = (markerId: string) => {
    const marker = markers.find((m) => m.id === markerId);
    if (marker?.onClick) {
      marker.onClick();
    }
    if (onMarkerClick) {
      onMarkerClick(markerId);
    }
  };

  return (
    <div
      className="w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm"
      style={{ height }}
    >
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="https://demotiles.maplibre.org/style.json"
        attributionControl={{ compact: false }}
      >
        {/* Navigation controls (zoom in/out) */}
        <NavigationControl position="top-right" />

        {/* Render route line if provided */}
        {route.length > 1 && (
          <Source
            id="route-source"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: route,
              },
            }}
          >
            <Layer {...routeLayerStyle} />
          </Source>
        )}

        {/* Render markers */}
        {markers.map((marker, idx) => (
          <Marker
            key={marker.id}
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="bottom"
            onClick={() => handleMarkerClick(marker.id)}
          >
            <div className="relative cursor-pointer group">
              {/* Marker pin */}
              <div
                className={`
                  flex items-center justify-center
                  w-10 h-10 rounded-full
                  ${marker.color || 'bg-indigo-600'}
                  text-white font-bold text-sm
                  border-3 border-white shadow-lg
                  transform transition-transform
                  group-hover:scale-110
                `}
              >
                {idx + 1}
              </div>

              {/* Tooltip on hover */}
              <div className="
                absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                px-3 py-2 bg-gray-900 text-white text-xs rounded
                whitespace-nowrap opacity-0 group-hover:opacity-100
                transition-opacity pointer-events-none
                shadow-lg z-10
              ">
                {marker.label}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
