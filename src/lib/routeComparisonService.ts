/**
 * Route Comparison Service
 * Handles fetching and comparing alternative routes
 */

import { yandexRoutingService } from './yandexRoutingService';
import { YandexCoordinates } from '@/types/yandex';

export interface AlternativeRoute {
  id: string;
  duration: number; // seconds
  durationInTraffic: number; // seconds (with traffic)
  distance: number; // meters
  timeSavings: number; // seconds vs current route
  trafficLevel: 'low' | 'medium' | 'high' | 'blocked';
  instructions: Array<{
    distance: number;
    duration: number;
    description: string;
  }>;
  routeGeometry: string;
}

export interface RouteComparison {
  currentRoute: {
    duration: number;
    durationInTraffic: number;
    distance: number;
  };
  alternatives: AlternativeRoute[];
  recommendedRoute: AlternativeRoute | null;
  timeSavingsPercentage: number;
}

export class RouteComparisonService {
  private alternativeCheckInterval = 10 * 60 * 1000; // 10 minutes
  private significantDelayThreshold = 15 * 60; // 15 minutes in seconds
  private minTimeSavingsSeconds = 3 * 60; // 3 minutes to consider as significant

  /**
   * Check for alternative routes when traveling from current location to destination
   */
  async getAlternativeRoutes(
    from: YandexCoordinates,
    to: YandexCoordinates,
    currentRoute: {
      duration: number;
      durationInTraffic: number;
      distance: number;
    }
  ): Promise<RouteComparison> {
    try {
      // Get current route with traffic
      const currentRouteData = await yandexRoutingService.getRoute(from, to, true);

      if (!currentRouteData) {
        throw new Error('Failed to fetch current route');
      }

      // In a real implementation, Yandex Routes API would return multiple alternatives
      // For now, we return the primary route as the current one
      const alternatives: AlternativeRoute[] = [];

      // If there's significant traffic, suggest alternatives
      if (currentRouteData.trafficLevel !== 'low') {
        // In production, you would fetch actual alternative routes from Yandex
        // For now, simulate an alternative
        const simulatedAlternative: AlternativeRoute = {
          id: 'alt_1',
          duration: currentRouteData.duration * 0.95,
          durationInTraffic: currentRouteData.durationInTraffic * 0.85,
          distance: currentRouteData.distance * 1.05,
          timeSavings: Math.round(currentRouteData.durationInTraffic * 0.15),
          trafficLevel: 'low',
          instructions: currentRouteData.instructions.slice(0, 3),
          routeGeometry: currentRouteData.geometry,
        };

        // Only suggest if time savings are significant
        if (simulatedAlternative.timeSavings >= this.minTimeSavingsSeconds) {
          alternatives.push(simulatedAlternative);
        }
      }

      // Recommend the best route
      let recommendedRoute: AlternativeRoute | null = null;
      if (alternatives.length > 0) {
        recommendedRoute = alternatives.reduce((best, current) =>
          current.durationInTraffic < best.durationInTraffic ? current : best
        );
      }

      const timeSavingsPercentage = recommendedRoute
        ? Math.round(
            ((currentRouteData.durationInTraffic - recommendedRoute.durationInTraffic) /
              currentRouteData.durationInTraffic) *
              100
          )
        : 0;

      return {
        currentRoute: {
          duration: currentRouteData.duration,
          durationInTraffic: currentRouteData.durationInTraffic,
          distance: currentRouteData.distance,
        },
        alternatives,
        recommendedRoute,
        timeSavingsPercentage,
      };
    } catch (error) {
      console.error('Error comparing routes:', error);
      throw error;
    }
  }

  /**
   * Check if a new alternative should be suggested to the driver
   */
  shouldSuggestAlternative(
    currentDuration: number,
    currentDurationWithTraffic: number,
    alternativeDuration: number
  ): boolean {
    // Suggest if traffic has increased significantly and alternative is much faster
    const delaySeconds = currentDurationWithTraffic - currentDuration;
    const timeSavings = currentDurationWithTraffic - alternativeDuration;

    return (
      delaySeconds > this.significantDelayThreshold &&
      timeSavings >= this.minTimeSavingsSeconds
    );
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  /**
   * Get traffic level badge
   */
  getTrafficBadge(trafficLevel: string): {
    color: string;
    text: string;
    icon: string;
  } {
    const badges: Record<
      string,
      { color: string; text: string; icon: string }
    > = {
      low: { color: 'bg-green-100 text-green-800', text: 'Light traffic', icon: '🟢' },
      medium: { color: 'bg-yellow-100 text-yellow-800', text: 'Moderate traffic', icon: '🟡' },
      high: { color: 'bg-orange-100 text-orange-800', text: 'Heavy traffic', icon: '🔴' },
      blocked: { color: 'bg-red-100 text-red-800', text: 'Blocked', icon: '🔴' },
    };

    return badges[trafficLevel] || badges.medium;
  }

  /**
   * Calculate ETA from duration
   */
  calculateETA(durationSeconds: number): Date {
    return new Date(Date.now() + durationSeconds * 1000);
  }
}

// Export singleton instance
export const routeComparisonService = new RouteComparisonService();
