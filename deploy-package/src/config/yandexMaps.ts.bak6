/**
 * Yandex Maps Configuration
 */

export const YANDEX_CONFIG = {
  // API Keys
  apiKey: process.env.YANDEX_MAPS_API_KEY || '',

  // API Endpoints
  routesApiUrl: 'https://api.routing.yandex.net/v2/route',
  matrixApiUrl: 'https://api.routing.yandex.net/v2/matrix',

  // Cache Configuration
  cache: {
    maxSize: 500, // Maximum number of cached entries
    ttl: 1000 * 60 * 5, // 5 minutes for traffic data
    staticTtl: 1000 * 60 * 60 * 24, // 24 hours for static routes
  },

  // Rate Limiting
  rateLimit: {
    maxRequestsPerSecond: 5,
    maxRequestsPerDay: 25000, // Free tier limit
  },

  // Default Parameters
  routing: {
    mode: 'driving', // or 'walking'
    returnInstructions: true,
    returnGeoJson: true,
  },

  // Tashkent Depot Coordinates
  depot: {
    latitude: 41.2995,
    longitude: 69.2401,
    address: 'Warehouse - Tashkent Center',
  },

  // Deep Link Configuration
  deepLink: {
    scheme: 'yandexmaps://',
    host: 'maps.yandex.ru',
    fallbackTimeout: 2000, // milliseconds
  },

  // URL Templates
  urlTemplates: {
    deepLink: 'yandexmaps://maps.yandex.ru/?rtext={rtext}&rtt=auto',
    webUrl: 'https://yandex.com/maps/?rtext={rtext}&rtt=auto',
  },

  // Traffic Configuration
  traffic: {
    updateInterval: 60000, // Refresh every 60 seconds
    includeInRoute: true, // Include traffic in route calculations
  },

  // Map Tiles Configuration
  mapTiles: {
    style: 'https://api-maps.yandex.ru/v3/styler?apikey=' + (process.env.YANDEX_MAPS_API_KEY || ''),
    attribution: '© Yandex',
  },

  // ETA Configuration
  eta: {
    recalculationInterval: 1000 * 60 * 5, // 5 minutes
    delayThresholdMinutes: 15, // Alert if delay > 15 min
  },
};

export const YANDEX_MAPS_JS_API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '';
