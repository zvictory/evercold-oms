import { LRUCache } from 'lru-cache';
import type { GeocodingRequest, GeocodingResult } from '@/types/geocoding';

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

class NominatimGeocodingService {
  private cache: LRUCache<string, GeocodingResult>;
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // 1 req/sec for Nominatim compliance

  constructor() {
    this.cache = new LRUCache<string, GeocodingResult>({
      max: 500, // Cache up to 500 addresses
      ttl: 1000 * 60 * 60 * 24, // 24 hours TTL
    });
  }

  async geocodeAddress(request: GeocodingRequest): Promise<GeocodingResult | null> {
    // Generate cache key
    const cacheKey = this.getCacheKey(request);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('[Nominatim] Cache hit for:', request.address);
      return cached;
    }

    // Rate limit enforcement
    await this.throttle();

    try {
      // Build search query
      const searchQuery = request.city
        ? `${request.address}, ${request.city}`
        : request.address;

      // Tashkent bounding box for biased results
      const viewbox = '69.1,41.2,69.4,41.4'; // Tashkent approximate bounds

      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', searchQuery);
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('limit', '1');
      url.searchParams.set('viewbox', viewbox);
      url.searchParams.set('bounded', '1');

      console.log('[Nominatim] Geocoding:', searchQuery);

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Evercold-CRM/1.0 (contact@evercold.uz)',
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        console.error('[Nominatim] API error:', response.status, response.statusText);
        return null;
      }

      const data: NominatimResponse[] = await response.json();

      if (!data || data.length === 0) {
        console.log('[Nominatim] No results found for:', searchQuery);
        return null;
      }

      const result = data[0];
      const geocodingResult: GeocodingResult = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formattedAddress: this.formatAddress(result),
        displayName: result.display_name,
      };

      // Cache the result
      this.cache.set(cacheKey, geocodingResult);

      console.log('[Nominatim] Successfully geocoded:', searchQuery,
        `(${geocodingResult.latitude}, ${geocodingResult.longitude})`);

      return geocodingResult;
    } catch (error) {
      console.error('[Nominatim] Error geocoding address:', error);
      return null;
    }
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`[Nominatim] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  private getCacheKey(request: GeocodingRequest): string {
    const normalized = request.address.toLowerCase().trim();
    const city = request.city ? request.city.toLowerCase().trim() : '';
    return `geocode:${normalized}:${city}`;
  }

  private formatAddress(result: NominatimResponse): string {
    if (!result.address) {
      return result.display_name;
    }

    const parts: string[] = [];

    if (result.address.house_number) {
      parts.push(result.address.house_number);
    }
    if (result.address.road) {
      parts.push(result.address.road);
    }
    if (result.address.city) {
      parts.push(result.address.city);
    }
    if (result.address.country) {
      parts.push(result.address.country);
    }

    return parts.length > 0 ? parts.join(', ') : result.display_name;
  }

  clearCache(): void {
    this.cache.clear();
    console.log('[Nominatim] Cache cleared');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
    };
  }
}

// Singleton instance
const nominatimGeocodingService = new NominatimGeocodingService();

export default nominatimGeocodingService;
