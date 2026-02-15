/**
 * Hook for tracking driver location with GPS
 * Optimized for battery life with adaptive polling
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { YandexCoordinates } from '@/types/yandex';

interface LocationTrackingOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  onLocationUpdate?: (location: YandexCoordinates) => void;
  onError?: (error: string) => void;
  adaptivePulling?: boolean; // Reduce frequency when stationary
  maxFrequency?: number; // milliseconds (minimum interval between updates)
}

export const useLocationTracking = (options: LocationTrackingOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 5000,
    onLocationUpdate,
    onError,
    adaptivePulling = true,
    maxFrequency = 5000, // 5 seconds minimum
  } = options;

  const [location, setLocation] = useState<YandexCoordinates | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const lastLocationRef = useRef<YandexCoordinates | null>(null);
  const isMovingRef = useRef(true);
  const updateIntervalRef = useRef(maxFrequency);

  // Calculate speed to detect if user is moving
  const calculateSpeed = useCallback(
    (
      newLocation: YandexCoordinates,
      previousLocation: YandexCoordinates | null,
      timeDelta: number
    ): number => {
      if (!previousLocation) return 0;

      const lat1 = previousLocation.latitude;
      const lon1 = previousLocation.longitude;
      const lat2 = newLocation.latitude;
      const lon2 = newLocation.longitude;

      const R = 6371000; // Earth radius in meters
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Speed in m/s
      return distance / (timeDelta / 1000);
    },
    []
  );

  // Adaptive frequency adjustment based on movement
  const updateFrequency = useCallback(() => {
    if (!adaptivePulling) return;

    if (isMovingRef.current) {
      // Moving: poll every 5 seconds
      updateIntervalRef.current = 5000;
    } else {
      // Stationary: poll every 30 seconds (save battery)
      updateIntervalRef.current = 30000;
    }
  }, [adaptivePulling]);

  // Handle location update
  const handleLocationUpdate = useCallback(
    (position: GeolocationPosition) => {
      const now = Date.now();

      // Throttle updates to prevent excessive processing
      if (now - lastUpdateRef.current < maxFrequency) {
        return;
      }

      lastUpdateRef.current = now;

      const newLocation: YandexCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Calculate speed
      const timeDelta = lastLocationRef.current ? now - (lastUpdateRef.current - maxFrequency) : 0;
      const speed = lastLocationRef.current
        ? calculateSpeed(newLocation, lastLocationRef.current, timeDelta)
        : 0;

      // Detect if moving (speed > 1 m/s = 3.6 km/h)
      isMovingRef.current = speed > 1;
      updateFrequency();

      setLocation(newLocation);
      setAccuracy(position.coords.accuracy);
      setError(null);
      lastLocationRef.current = newLocation;

      if (onLocationUpdate) {
        onLocationUpdate(newLocation);
      }
    },
    [calculateSpeed, maxFrequency, onLocationUpdate, updateFrequency]
  );

  // Handle errors
  const handleLocationError = useCallback(
    (error: GeolocationPositionError) => {
      let errorMessage = 'Failed to get location';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Please enable GPS.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location unavailable. Check GPS signal.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
      }

      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    },
    [onError]
  );

  // Start location tracking
  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      const msg = 'Geolocation not supported on this device';
      setError(msg);
      if (onError) onError(msg);
      return;
    }

    setIsTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );

    watchIdRef.current = watchId;
  }, [enableHighAccuracy, timeout, maximumAge, handleLocationUpdate, handleLocationError, onError]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Auto-start tracking on component mount
  useEffect(() => {
    startTracking();

    return () => {
      stopTracking();
    };
  }, [startTracking, stopTracking]);

  // Handle page visibility (pause tracking when app goes to background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App in background - reduce update frequency
        if (adaptivePulling) {
          updateIntervalRef.current = 60000; // 1 minute
        }
      } else {
        // App in foreground - resume normal frequency
        updateFrequency();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [adaptivePulling, updateFrequency]);

  return {
    location,
    isTracking,
    accuracy,
    error,
    startTracking,
    stopTracking,
    isMoving: isMovingRef.current,
    updateInterval: updateIntervalRef.current,
  };
};
