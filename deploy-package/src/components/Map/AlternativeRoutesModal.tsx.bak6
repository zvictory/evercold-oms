/**
 * Alternative Routes Modal
 * Suggests better routes when traffic conditions worsen
 * Displays time savings and traffic levels for comparison
 */

'use client';

import { useState } from 'react';
import { AlternativeRoute } from '@/lib/routeComparisonService';

interface AlternativeRoutesModalProps {
  isOpen: boolean;
  currentRoute: {
    duration: number;
    durationInTraffic: number;
    distance: number;
  };
  alternatives: AlternativeRoute[];
  trafficLevel: string;
  onSelectRoute: (route: AlternativeRoute) => Promise<void>;
  onClose: () => void;
}

export function AlternativeRoutesModal({
  isOpen,
  currentRoute,
  alternatives,
  trafficLevel,
  onSelectRoute,
  onClose,
}: AlternativeRoutesModalProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectRoute = async (route: AlternativeRoute) => {
    try {
      setIsLoading(true);
      setSelectedRouteId(route.id);
      await onSelectRoute(route);
      onClose();
    } catch (error) {
      console.error('Error selecting route:', error);
      setSelectedRouteId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrafficColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTrafficIcon = (level: string) => {
    switch (level) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🟠';
      case 'blocked':
        return '🔴';
      default:
        return '◯';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>⚠️</span> Heavy Traffic Detected
          </h2>
          <p className="text-red-100 text-sm mt-1">
            We found faster routes. Would you like to switch?
          </p>
        </div>

        {/* Current Route Info */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                Your Current Route
              </p>
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-900">
                  {formatDuration(currentRoute.durationInTraffic)}
                </p>
                <p className="text-xs text-gray-600">
                  {formatDistance(currentRoute.distance)}
                </p>
              </div>
            </div>
            <div
              className={`px-3 py-2 rounded border ${getTrafficColor(trafficLevel)} font-semibold text-sm`}
            >
              {getTrafficIcon(trafficLevel)} {trafficLevel.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Alternative Routes */}
        {alternatives.length > 0 ? (
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
              Faster Alternatives
            </p>

            <div className="space-y-3">
              {alternatives.map((route) => {
                const timeSavingsMinutes = Math.round(route.timeSavings / 60);
                const timeSavingsPercent = Math.round(
                  ((currentRoute.durationInTraffic - route.durationInTraffic) /
                    currentRoute.durationInTraffic) *
                    100
                );

                return (
                  <button
                    key={route.id}
                    onClick={() => handleSelectRoute(route)}
                    disabled={isLoading}
                    className={`w-full p-4 rounded-lg border-2 transition ${
                      selectedRouteId === route.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl font-bold text-gray-900">
                            {formatDuration(route.durationInTraffic)}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              timeSavingsMinutes > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {timeSavingsMinutes > 0 ? '✓ ' : ''}
                            Save {timeSavingsMinutes}m ({timeSavingsPercent}%)
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          Distance: {formatDistance(route.distance)}
                        </p>
                        <div
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getTrafficColor(
                            route.trafficLevel
                          )}`}
                        >
                          {getTrafficIcon(route.trafficLevel)} {route.trafficLevel.toUpperCase()}
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      <div className="flex items-center">
                        {selectedRouteId === route.id ? (
                          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-600 text-sm">No faster alternatives available at this time.</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Keep Current Route
          </button>
          {alternatives.length > 0 && selectedRouteId === null && (
            <button
              onClick={() => handleSelectRoute(alternatives[0])}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Loading...' : 'Use Recommended Route'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
