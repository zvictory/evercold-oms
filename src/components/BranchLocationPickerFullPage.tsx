'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { GeocodingResponse } from '@/types/geocoding';

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import('./Map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

interface BranchLocationPickerFullPageProps {
  address: string;
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number | null, lng: number | null) => void;
}

export default function BranchLocationPickerFullPage({
  address,
  latitude,
  longitude,
  onLocationChange,
}: BranchLocationPickerFullPageProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [geocodedAddress, setGeocodedAddress] = useState<string | null>(null);

  // Map center: use coordinates if available, otherwise default to Tashkent
  const mapCenter: [number, number] = latitude !== null && longitude !== null
    ? [longitude, latitude]
    : [69.2401, 41.2995]; // Tashkent default

  const mapZoom = latitude !== null && longitude !== null ? 15 : 11;

  const handleResolveLocation = async () => {
    if (!address || address.trim().length === 0) {
      setGeocodeError('Please enter an address first');
      return;
    }

    setIsGeocoding(true);
    setGeocodeError(null);

    try {
      const response = await fetch('/api/geocoding/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address.trim(),
          city: 'Tashkent',
        }),
      });

      const data: GeocodingResponse = await response.json();

      if (data.success && data.result) {
        onLocationChange(data.result.latitude, data.result.longitude);
        setGeocodedAddress(data.result.formattedAddress);
        setGeocodeError(null);
      } else {
        setGeocodeError(data.error || 'Failed to geocode address');
        setGeocodedAddress(null);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodeError('Network error. Please try again.');
      setGeocodedAddress(null);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleMarkerDrag = (lat: number, lng: number) => {
    onLocationChange(lat, lng);
  };

  const handleMapClick = (lat: number, lng: number) => {
    onLocationChange(lat, lng);
  };

  const hasCoordinates = latitude !== null && longitude !== null;

  return (
    <div className="space-y-4">
      {/* Resolve Location Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleResolveLocation}
          disabled={isGeocoding || !address}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isGeocoding ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Resolving...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Resolve Location
            </>
          )}
        </button>

        {hasCoordinates && (
          <div className="flex items-center gap-2 text-green-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Located</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {geocodeError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">Geocoding Failed</p>
              <p>{geocodeError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Geocoded Address Display */}
      {geocodedAddress && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">Found address:</p>
              <p>{geocodedAddress}</p>
            </div>
          </div>
        </div>
      )}

      {/* Map - Always Visible */}
      <div className="border border-gray-300 rounded-lg overflow-hidden h-[600px]">
        <LeafletMap
          center={mapCenter}
          zoom={mapZoom}
          height="100%"
          draggableMarker={
            hasCoordinates
              ? {
                  latitude: latitude!,
                  longitude: longitude!,
                  onDragEnd: handleMarkerDrag,
                }
              : undefined
          }
          onClick={handleMapClick}
        />
      </div>

      {/* Coordinate Display - Read-only */}
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <div>
          <span className="font-medium">Latitude:</span>{' '}
          {latitude !== null ? latitude.toFixed(6) : 'Not set'}
        </div>
        <div>
          <span className="font-medium">Longitude:</span>{' '}
          {longitude !== null ? longitude.toFixed(6) : 'Not set'}
        </div>
      </div>

      {/* Usage Hints */}
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg space-y-1">
        <p>💡 <strong>Click anywhere on the map</strong> to place the location pin.</p>
        <p>🖱️ <strong>Drag the red pin</strong> to adjust the exact location.</p>
        <p>📍 <strong>Use "Resolve Location"</strong> to automatically geocode the address above.</p>
      </div>
    </div>
  );
}
