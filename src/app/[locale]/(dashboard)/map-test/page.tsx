'use client';

import { useState } from 'react';
import LeafletMap from '@/components/Map/LeafletMap';
import DirectionsPanel from '@/components/Map/DirectionsPanel';
import { getOptimizedRoute } from '@/utils/routeOptimization';
import Link from 'next/link';

export default function MapTestPage() {
  // Sample Tashkent delivery locations
  const markers = [
    {
      id: '1',
      name: 'Tashkent Center (Depot)',
      label: 'Tashkent Center (Depot)',
      latitude: 41.2995,
      longitude: 69.2401,
    },
    {
      id: '2',
      name: 'Chorsu Bazaar',
      label: 'Chorsu Bazaar',
      latitude: 41.3264,
      longitude: 69.2343,
    },
    {
      id: '3',
      name: 'Tashkent Airport',
      label: 'Tashkent Airport',
      latitude: 41.2668,
      longitude: 69.2819,
    },
    {
      id: '4',
      name: 'Amir Temur Square',
      label: 'Amir Temur Square',
      latitude: 41.3123,
      longitude: 69.2401,
    },
    {
      id: '5',
      name: 'Minor Mosque',
      label: 'Minor Mosque',
      latitude: 41.3264,
      longitude: 69.2785,
    },
  ];

  // Optimize the route using advanced algorithm
  const routeOptimization = getOptimizedRoute(markers, '1');
  const optimizedRoute = routeOptimization.route;

  // Convert optimized route to coordinates
  const route = optimizedRoute.map((id) => {
    const marker = markers.find((m) => m.id === id)!;
    return [marker.longitude, marker.latitude] as [number, number];
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/orders"
            className="text-indigo-600 hover:text-indigo-800 flex items-center mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Orders
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Delivery Route Map Test
          </h1>
          <p className="text-gray-600">
            Interactive map showing delivery locations in Tashkent with optimized route
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Sample Delivery Route
            </h2>
            <p className="text-sm text-gray-600">
              {markers.length} stops • Route optimized for minimum distance
            </p>
          </div>

          <LeafletMap
            center={[69.2401, 41.2995]}
            zoom={12}
            markers={markers}
            route={route}
            height="600px"
            onMarkerClick={(id) => console.log('Clicked marker:', id)}
          />

          {/* Turn-by-Turn Directions */}
          <div className="mt-6">
            <DirectionsPanel locations={markers} depotId="1" />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Delivery Stops</h3>
              <ul className="space-y-2">
                {markers.map((marker, idx) => (
                  <li key={marker.id} className="flex items-center text-sm">
                    <span
                      className={`
                        w-6 h-6 rounded-full flex items-center justify-center
                        text-white font-bold text-xs mr-3
                        ${idx === 0 ? 'bg-green-600' : 'bg-indigo-600'}
                      `}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-gray-700">{marker.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Route Information</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Total Stops:</dt>
                  <dd className="font-medium text-gray-900">{markers.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Map Library:</dt>
                  <dd className="font-medium text-gray-900">OpenStreetMap + Leaflet</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Features:</dt>
                  <dd className="font-medium text-gray-900">Interactive Routes</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">API Key Required:</dt>
                  <dd className="font-medium text-green-600">No ✅ (Free)</dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <dt className="text-gray-600 font-semibold">Route Distance:</dt>
                  <dd className="font-medium text-gray-900">
                    {routeOptimization.distance.toFixed(2)} km
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Optimization Savings:</dt>
                  <dd className="font-medium text-green-600">
                    {routeOptimization.savings.toFixed(1)}% 📉
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Algorithm:</dt>
                  <dd className="font-medium text-blue-600">2-Opt + Nearest Neighbor</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">✅ OpenStreetMap + Leaflet Active!</h3>
          <p className="text-sm text-green-800">
            The delivery map is now using OpenStreetMap (free, no API key required). Features include:
          </p>
          <ul className="mt-2 text-sm text-green-800 space-y-1 ml-4">
            <li>• Interactive markers with numbered stops</li>
            <li>• Route visualization between delivery points</li>
            <li>• Hover popups showing location names</li>
            <li>• Zoom and pan controls</li>
            <li>• Click handlers for marker interactions</li>
            <li>• Free, open-source mapping</li>
          </ul>
          <p className="mt-4 text-xs text-green-700">
            ✨ No API key, no rate limits, and fully customizable. Perfect for development and testing!
          </p>
        </div>
      </div>
    </div>
  );
}
