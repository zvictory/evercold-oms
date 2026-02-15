/**
 * Yandex Navigator Multi-Stop Route Deep Link Integration
 * Builds URLs for launching Yandex Navigator/Maps with pre-loaded routes
 */

export interface NavigationStop {
  latitude: number;
  longitude: number;
  stopNumber: number;
  address?: string;
}

export interface NavigationOptions {
  currentLocation?: { latitude: number; longitude: number };
  useDepotAsStart?: boolean;
  includeTraffic?: boolean;
}

export interface NavigationUrls {
  deepLink: string;
  webUrl: string;
}

/**
 * Validates if coordinates are within valid geographic bounds
 */
export function validateCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  if (lat == null || lng == null) return false;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;

  // Check geographic bounds
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;

  return true;
}

/**
 * Detects if user is on a mobile device
 */
export function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Builds Yandex Maps multi-stop route URL
 * @param stops Array of navigation stops with coordinates
 * @param options Navigation options (depot start, traffic, etc.)
 * @returns Object with deep link and web URL, or null if no valid coordinates
 */
export function buildYandexMultiStopUrl(
  stops: NavigationStop[],
  options: NavigationOptions = { useDepotAsStart: true, includeTraffic: true }
): NavigationUrls | null {
  // Tashkent depot coordinates
  const DEPOT_COORDS = { latitude: 41.2995, longitude: 69.2401 };

  // Filter stops with valid coordinates
  const validStops = stops.filter(stop =>
    validateCoordinates(stop.latitude, stop.longitude)
  );

  if (validStops.length === 0) {
    return null;
  }

  // Build coordinate array
  const coordinates: string[] = [];

  // Add starting point
  if (options.currentLocation && validateCoordinates(options.currentLocation.latitude, options.currentLocation.longitude)) {
    coordinates.push(`${options.currentLocation.latitude},${options.currentLocation.longitude}`);
  } else if (options.useDepotAsStart) {
    coordinates.push(`${DEPOT_COORDS.latitude},${DEPOT_COORDS.longitude}`);
  }

  // Add all stops as waypoints
  validStops.forEach(stop => {
    coordinates.push(`${stop.latitude},${stop.longitude}`);
  });

  // Build rtext parameter (start~via1~via2~...~end)
  const rtext = coordinates.join('~');

  // Build URLs
  const params = new URLSearchParams({
    rtext: rtext,
    rtt: 'auto', // Traffic routing enabled
  });

  const deepLink = `yandexmaps://maps.yandex.ru/?${params.toString()}`;
  const webUrl = `https://yandex.com/maps/?${params.toString()}`;

  return { deepLink, webUrl };
}

/**
 * Opens Yandex Navigator using deep link with web fallback
 * @param deepLink Deep link URL (yandexmaps://)
 * @param webUrl Web URL fallback (https://)
 */
export function openYandexNavigation(deepLink: string, webUrl: string): void {
  const isMobile = isMobileDevice();

  if (!isMobile) {
    // Desktop: Always open web URL
    window.open(webUrl, '_blank');
    return;
  }

  // Mobile: Try deep link, fallback to web URL
  let appOpened = false;

  // Track if app opens via visibility change
  const visibilityHandler = () => {
    if (document.hidden) {
      appOpened = true;
    }
  };

  document.addEventListener('visibilitychange', visibilityHandler);

  // Try to open deep link
  window.location.href = deepLink;

  // Fallback timeout
  const timeout = setTimeout(() => {
    document.removeEventListener('visibilitychange', visibilityHandler);

    if (!appOpened) {
      // App didn't open, use web URL
      window.open(webUrl, '_blank');
    }
  }, 2000); // 2 second timeout

  // Cleanup listener after timeout
  setTimeout(() => {
    document.removeEventListener('visibilitychange', visibilityHandler);
  }, 3000);
}

/**
 * Gets current GPS position using Geolocation API
 * @returns Promise with position or null on error/timeout
 */
export function getCurrentPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      resolve(null);
    }, 10000); // 10 second timeout

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        resolve(position);
      },
      () => {
        clearTimeout(timeoutId);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}
