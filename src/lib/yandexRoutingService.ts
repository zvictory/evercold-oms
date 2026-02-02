/**
 * Yandex Maps Routing Service
 * Handles all Yandex API calls for routes, matrix calculations, and traffic data
 */

import axios, { AxiosInstance } from 'axios';
import { LRUCache } from 'lru-cache';
import { YANDEX_CONFIG } from '@/config/yandexMaps';
import {
  YandexCoordinates,
  YandexRoutesResponse,
  YandexMatrixResponse,
  RouteResponse,
  MatrixResponse,
  TurnByTurnInstruction,
  MatrixElement,
} from '@/types/yandex';

export class YandexRoutingService {
  private axiosInstance: AxiosInstance;
  private cache: LRUCache<string, any>;
  private requestQueue: Array<() => void> = [];
  private isProcessing = false;
  private requestsThisMonth = 0;
  private lastMonthReset = new Date();

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
    });

    this.cache = new LRUCache({
      max: YANDEX_CONFIG.cache.maxSize,
      ttl: YANDEX_CONFIG.cache.ttl,
      updateAgeOnGet: true,
    });
  }

  /**
   * Get a single route from origin to destination with traffic data
   */
  async getRoute(
    origin: YandexCoordinates,
    destination: YandexCoordinates,
    includeTraffic = true
  ): Promise<RouteResponse | null> {
    try {
      const cacheKey = this.getCacheKey('route', origin, destination);
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const routeResponse = await this.callRoutesAPI(origin, destination);
      const route = this.parseRouteResponse(routeResponse, includeTraffic);

      this.cache.set(cacheKey, route);
      return route;
    } catch (error) {
      console.error('Error fetching route from Yandex:', error);
      return null;
    }
  }

  /**
   * Get distance/duration matrix for multiple origins and destinations
   * Used for route optimization
   */
  async getMatrix(
    origins: YandexCoordinates[],
    destinations: YandexCoordinates[]
  ): Promise<MatrixResponse | null> {
    try {
      const cacheKey = this.getCacheKey('matrix', origins, destinations);
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const matrixResponse = await this.callMatrixAPI(origins, destinations);
      const matrix = this.parseMatrixResponse(matrixResponse);

      this.cache.set(cacheKey, matrix);
      return matrix;
    } catch (error) {
      console.error('Error fetching matrix from Yandex:', error);
      return null;
    }
  }

  /**
   * Call Yandex Routes API
   */
  private async callRoutesAPI(
    origin: YandexCoordinates,
    destination: YandexCoordinates
  ): Promise<YandexRoutesResponse> {
    await this.throttleRequest();

    const response = await this.axiosInstance.get<YandexRoutesResponse>(
      YANDEX_CONFIG.routing.mode === 'driving'
        ? 'https://api.routing.yandex.net/v2/route'
        : YANDEX_CONFIG.routesApiUrl,
      {
        params: {
          apikey: YANDEX_CONFIG.apiKey,
          origin: `${origin.longitude},${origin.latitude}`,
          destination: `${destination.longitude},${destination.latitude}`,
          departure_time: 'now',
          lang: 'en',
        },
      }
    );

    this.recordAPIUsage('routes');
    return response.data;
  }

  /**
   * Call Yandex Matrix API
   */
  private async callMatrixAPI(
    origins: YandexCoordinates[],
    destinations: YandexCoordinates[]
  ): Promise<YandexMatrixResponse> {
    await this.throttleRequest();

    const originStr = origins.map((o) => `${o.longitude},${o.latitude}`).join(';');
    const destStr = destinations.map((d) => `${d.longitude},${d.latitude}`).join(';');

    const response = await this.axiosInstance.get<YandexMatrixResponse>(
      YANDEX_CONFIG.matrixApiUrl,
      {
        params: {
          apikey: YANDEX_CONFIG.apiKey,
          origins: originStr,
          destinations: destStr,
          departure_time: 'now',
          lang: 'en',
        },
      }
    );

    this.recordAPIUsage('matrix', origins.length * destinations.length);
    return response.data;
  }

  /**
   * Parse Yandex Routes API response
   */
  private parseRouteResponse(
    response: YandexRoutesResponse,
    includeTraffic: boolean
  ): RouteResponse | null {
    if (!response.routes || response.routes.length === 0) {
      return null;
    }

    const route = response.routes[0];
    const distanceKm = route.distance.value / 1000;
    const durationSeconds = route.duration.value;
    const durationInTrafficSeconds = route.duration_in_traffic?.value || durationSeconds;

    const instructions = this.parseInstructions(route.legs);
    const trafficLevel = this.calculateTrafficLevel(durationSeconds, durationInTrafficSeconds);

    return {
      distance: distanceKm,
      duration: durationSeconds,
      durationInTraffic: durationInTrafficSeconds,
      geometry: route.geometry,
      legs: route.legs.map((leg) => ({
        distance: leg.distance.value / 1000,
        duration: leg.duration.value,
        durationInTraffic: leg.duration?.value || leg.duration.value,
      })),
      instructions,
      trafficLevel,
    };
  }

  /**
   * Parse Yandex Matrix API response
   */
  private parseMatrixResponse(response: YandexMatrixResponse): MatrixResponse {
    const rows = response.rows.map((row) =>
      row.elements.map((element) => ({
        distance: element.distance.value,
        duration: element.duration.value,
        durationInTraffic: element.duration_in_traffic?.value || element.duration.value,
      }))
    );

    return { rows };
  }

  /**
   * Parse turn-by-turn instructions from route steps
   */
  private parseInstructions(legs: any[]): TurnByTurnInstruction[] {
    const instructions: TurnByTurnInstruction[] = [];
    let index = 0;

    for (const leg of legs) {
      for (const step of leg.steps || []) {
        instructions.push({
          index,
          distance: step.distance.value,
          duration: step.duration.value,
          action: this.parseManeuver(step.maneuver),
          street: step.name,
          description: this.formatInstruction(step),
          location: {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng,
          },
        });
        index++;
      }
    }

    return instructions;
  }

  /**
   * Parse maneuver type from step
   */
  private parseManeuver(
    maneuver: string
  ): TurnByTurnInstruction['action'] {
    if (maneuver.includes('turn-left')) return 'turn-left';
    if (maneuver.includes('turn-right')) return 'turn-right';
    if (maneuver.includes('roundabout')) return 'roundabout';
    if (maneuver.includes('arrive')) return 'arrive';
    return 'continue';
  }

  /**
   * Format instruction into readable text
   */
  private formatInstruction(step: any): string {
    const distanceM = step.distance.value;
    const distanceText = distanceM < 1000 ? `${Math.round(distanceM)}m` : `${(distanceM / 1000).toFixed(1)}km`;

    const maneuver = step.maneuver || 'continue';
    const street = step.name ? ` onto ${step.name}` : '';

    if (maneuver.includes('turn-left')) {
      return `In ${distanceText}, turn left${street}`;
    } else if (maneuver.includes('turn-right')) {
      return `In ${distanceText}, turn right${street}`;
    } else if (maneuver.includes('roundabout')) {
      return `In ${distanceText}, enter roundabout${street}`;
    } else if (maneuver.includes('arrive')) {
      return 'You have arrived';
    }

    return `Continue${street}`;
  }

  /**
   * Calculate traffic level based on duration difference
   */
  private calculateTrafficLevel(
    baseDuration: number,
    withTraffic: number
  ): 'low' | 'medium' | 'high' | 'blocked' {
    const delayPercent = ((withTraffic - baseDuration) / baseDuration) * 100;

    if (delayPercent < 10) return 'low';
    if (delayPercent < 30) return 'medium';
    if (delayPercent < 50) return 'high';
    return 'blocked';
  }

  /**
   * Generate cache key
   */
  private getCacheKey(
    type: string,
    origin: any,
    destination: any
  ): string {
    if (Array.isArray(origin)) {
      const originStr = origin.map((o) => `${o.latitude},${o.longitude}`).join('|');
      const destStr = (destination as YandexCoordinates[])
        .map((d) => `${d.latitude},${d.longitude}`)
        .join('|');
      return `${type}:${originStr}:${destStr}`;
    }

    return `${type}:${origin.latitude},${origin.longitude}:${(destination as YandexCoordinates).latitude},${(destination as YandexCoordinates).longitude}`;
  }

  /**
   * Throttle requests to respect rate limits
   */
  private async throttleRequest(): Promise<void> {
    return new Promise((resolve) => {
      this.requestQueue.push(resolve);
      this.processQueue();
    });
  }

  /**
   * Process queued requests respecting rate limits
   */
  private processQueue(): void {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const resolve = this.requestQueue.shift();

    if (resolve) {
      resolve();
      setTimeout(() => {
        this.isProcessing = false;
        this.processQueue();
      }, 1000 / YANDEX_CONFIG.rateLimit.maxRequestsPerSecond);
    }
  }

  /**
   * Record API usage for monitoring
   */
  private recordAPIUsage(method: 'routes' | 'matrix', count = 1): void {
    this.requestsThisMonth += count;

    // Reset monthly counter if it's a new month
    const now = new Date();
    if (now.getMonth() !== this.lastMonthReset.getMonth()) {
      this.requestsThisMonth = count;
      this.lastMonthReset = now;
    }

    // Log usage
    if (process.env.NODE_ENV === 'development') {
      console.log(`Yandex API: ${method} - Total this month: ${this.requestsThisMonth}`);
    }
  }

  /**
   * Get current API usage
   */
  getAPIUsage(): number {
    return this.requestsThisMonth;
  }

  /**
   * Check if we're approaching quota
   */
  isApproachingQuota(): boolean {
    return this.requestsThisMonth > YANDEX_CONFIG.rateLimit.maxRequestsPerDay * 0.8;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const yandexRoutingService = new YandexRoutingService();
