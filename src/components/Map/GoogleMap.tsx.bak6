'use client';

import { GoogleMap, LoadScript, Marker, Polyline, TrafficLayer, InfoWindow } from '@react-google-maps/api';
import { useState } from 'react';

interface MapMarker {
  id: string;
  longitude: number;
  latitude: number;
  label: string;
  color?: string;
  onClick?: () => void;
}

interface GoogleMapProps {
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  markers?: MapMarker[];
  route?: Array<[number, number]>; // Array of [lng, lat]
  height?: string;
  onMarkerClick?: (markerId: string) => void;
  showTraffic?: boolean;
}

/**
 * Google Maps component for displaying delivery routes and locations
 * Optimized for Tashkent, Uzbekistan
 */
export default function GoogleMapComponent({
  center = [69.2401, 41.2995], // Tashkent default [lng, lat]
  zoom = 12,
  markers = [],
  route = [],
  height = '500px',
  onMarkerClick,
  showTraffic = true,
}: GoogleMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Convert [lng, lat] to Google Maps {lat, lng}
  const mapCenter = {
    lat: center[1],
    lng: center[0],
  };

  // Convert markers to Google Maps format
  const googleMarkers = markers.map((marker) => ({
    ...marker,
    position: {
      lat: marker.latitude,
      lng: marker.longitude,
    },
  }));

  // Convert route to Google Maps format
  const routePath = route.map((point) => ({
    lat: point[1],
    lng: point[0],
  }));

  const mapContainerStyle = {
    width: '100%',
    height,
  };

  const handleMarkerClick = (markerId: string) => {
    setSelectedMarker(markerId);
    onMarkerClick?.(markerId);
  };

  if (!apiKey) {
    return (
      <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        <div style={{ height, width: '100%' }} className="flex items-center justify-center bg-gray-100">
          <div className="text-center p-6">
            <div className="text-red-600 font-bold text-lg mb-2">⚠️ API Key Missing</div>
            <p className="text-gray-600 font-medium">Google Maps API key not configured</p>
            <p className="text-xs text-gray-500 mt-2">
              Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file
            </p>
            <a
              href="https://console.cloud.google.com/maps-api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 mt-2 block font-semibold"
            >
              Get Google Maps API Key →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      <LoadScript googleMapsApiKey={apiKey} libraries={['places', 'geometry']}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={zoom}
          options={{
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          {/* Traffic Layer */}
          {showTraffic && <TrafficLayer />}

          {/* Route Path */}
          {routePath.length > 0 && (
            <Polyline
              path={routePath}
              options={{
                strokeColor: '#1f2937',
                strokeOpacity: 0.7,
                strokeWeight: 3,
                geodesic: true,
              }}
            />
          )}

          {/* Markers */}
          {googleMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              title={marker.label}
              onClick={() => handleMarkerClick(marker.id)}
              icon={{
                path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
                fillColor: marker.color || '#4f46e5',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
                scale: 1.5,
              }}
            >
              {selectedMarker === marker.id && (
                <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                  <div className="p-2">
                    <h3 className="font-semibold text-sm">{marker.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          ))}
        </GoogleMap>
      </LoadScript>

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
