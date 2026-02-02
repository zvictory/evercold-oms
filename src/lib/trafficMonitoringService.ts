/**
 * Traffic Monitoring Service
 * Monitors traffic conditions along active routes and alerts on changes
 */

import { yandexRoutingService } from './yandexRoutingService';
import { YandexCoordinates } from '@/types/yandex';

export interface TrafficIncident {
  timestamp: Date;
  location: YandexCoordinates;
  type: 'accident' | 'roadwork' | 'congestion' | 'weather';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedDistance: number; // meters
}

export interface TrafficSnapshot {
  timestamp: Date;
  routeId: string;
  overallTrafficLevel: 'low' | 'medium' | 'high' | 'blocked';
  averageDelayMinutes: number;
  incidents: TrafficIncident[];
  affectedSegments: Array<{
    fromStopNumber: number;
    toStopNumber: number;
    trafficLevel: string;
    delayMinutes: number;
  }>;
}

export class TrafficMonitoringService {
  private monitoringIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private trafficHistory: Map<string, TrafficSnapshot[]> = new Map();
  private delayThreshold = 15; // minutes
  private checkInterval = 5 * 60 * 1000; // 5 minutes

  /**
   * Start monitoring traffic for an active route
   */
  startMonitoring(
    routeId: string,
    stops: Array<{
      id: string;
      stopNumber: number;
      destination: YandexCoordinates;
    }>,
    currentLocation: YandexCoordinates,
    onTrafficUpdate?: (snapshot: TrafficSnapshot) => void
  ): void {
    // Clear existing interval if any
    this.stopMonitoring(routeId);

    // Initialize history
    if (!this.trafficHistory.has(routeId)) {
      this.trafficHistory.set(routeId, []);
    }

    // Start monitoring interval
    const intervalId = setInterval(async () => {
      try {
        const snapshot = await this.checkTraffic(routeId, stops, currentLocation);

        // Store in history
        const history = this.trafficHistory.get(routeId) || [];
        history.push(snapshot);
        // Keep last 24 snapshots (2 hours of 5-min checks)
        if (history.length > 24) history.shift();
        this.trafficHistory.set(routeId, history);

        if (onTrafficUpdate) {
          onTrafficUpdate(snapshot);
        }
      } catch (error) {
        console.error(`Error checking traffic for route ${routeId}:`, error);
      }
    }, this.checkInterval);

    this.monitoringIntervals.set(routeId, intervalId);
  }

  /**
   * Stop monitoring traffic for a route
   */
  stopMonitoring(routeId: string): void {
    const intervalId = this.monitoringIntervals.get(routeId);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(routeId);
    }
  }

  /**
   * Check current traffic conditions
   */
  private async checkTraffic(
    routeId: string,
    stops: Array<{
      id: string;
      stopNumber: number;
      destination: YandexCoordinates;
    }>,
    currentLocation: YandexCoordinates
  ): Promise<TrafficSnapshot> {
    const affectedSegments: TrafficSnapshot['affectedSegments'] = [];
    let totalDelayMinutes = 0;
    let trafficLevels: string[] = [];

    // Check traffic for each segment
    for (let i = 0; i < stops.length - 1; i++) {
      const fromStop = stops[i];
      const toStop = stops[i + 1];

      try {
        const route = await yandexRoutingService.getRoute(
          fromStop.destination,
          toStop.destination,
          true
        );

        if (route) {
          const baselineDuration = route.duration / 60; // minutes
          const actualDuration = route.durationInTraffic / 60; // minutes
          const delayMinutes = actualDuration - baselineDuration;

          affectedSegments.push({
            fromStopNumber: fromStop.stopNumber,
            toStopNumber: toStop.stopNumber,
            trafficLevel: route.trafficLevel,
            delayMinutes: Math.round(delayMinutes),
          });

          totalDelayMinutes += delayMinutes;
          trafficLevels.push(route.trafficLevel);
        }
      } catch (error) {
        console.warn(`Error checking segment ${i}:`, error);
      }
    }

    // Calculate overall traffic level
    const overallTrafficLevel = this.calculateOverallTrafficLevel(trafficLevels);

    const snapshot: TrafficSnapshot = {
      timestamp: new Date(),
      routeId,
      overallTrafficLevel,
      averageDelayMinutes: Math.round(totalDelayMinutes / Math.max(affectedSegments.length, 1)),
      incidents: this.detectIncidents(affectedSegments),
      affectedSegments,
    };

    return snapshot;
  }

  /**
   * Calculate overall traffic level from multiple segments
   */
  private calculateOverallTrafficLevel(
    levels: string[]
  ): 'low' | 'medium' | 'high' | 'blocked' {
    if (levels.length === 0) return 'low';

    const counts = {
      low: levels.filter((l) => l === 'low').length,
      medium: levels.filter((l) => l === 'medium').length,
      high: levels.filter((l) => l === 'high').length,
      blocked: levels.filter((l) => l === 'blocked').length,
    };

    if (counts.blocked > 0) return 'blocked';
    if (counts.high > 0) return 'high';
    if (counts.medium > 0) return 'medium';
    return 'low';
  }

  /**
   * Detect traffic incidents from segments
   */
  private detectIncidents(
    segments: TrafficSnapshot['affectedSegments']
  ): TrafficIncident[] {
    const incidents: TrafficIncident[] = [];

    for (const segment of segments) {
      if (segment.delayMinutes > this.delayThreshold) {
        incidents.push({
          timestamp: new Date(),
          location: {
            latitude: 0, // Would need actual coordinates
            longitude: 0,
          },
          type: 'congestion',
          severity: segment.delayMinutes > 30 ? 'high' : 'medium',
          description: `Traffic between stops ${segment.fromStopNumber}-${segment.toStopNumber}: ${segment.delayMinutes} min delay`,
          affectedDistance: 0,
        });
      }
    }

    return incidents;
  }

  /**
   * Get traffic history for a route
   */
  getTrafficHistory(routeId: string): TrafficSnapshot[] {
    return this.trafficHistory.get(routeId) || [];
  }

  /**
   * Detect significant traffic changes
   */
  detectTrafficChanges(
    previous: TrafficSnapshot | null,
    current: TrafficSnapshot
  ): {
    hasChanged: boolean;
    changeType: 'improved' | 'worsened' | 'stable';
    delayChange: number; // minutes
  } {
    if (!previous) {
      return {
        hasChanged: false,
        changeType: 'stable',
        delayChange: 0,
      };
    }

    const delayChange = current.averageDelayMinutes - previous.averageDelayMinutes;
    const hasChanged = Math.abs(delayChange) > 5; // 5 min threshold

    return {
      hasChanged,
      changeType: delayChange < -5 ? 'improved' : delayChange > 5 ? 'worsened' : 'stable',
      delayChange,
    };
  }

  /**
   * Get traffic alert message
   */
  getAlertMessage(snapshot: TrafficSnapshot): string | null {
    if (snapshot.incidents.length === 0) {
      return null;
    }

    const highSeverityIncidents = snapshot.incidents.filter((i) => i.severity === 'high');

    if (highSeverityIncidents.length > 0) {
      return `⚠️ Heavy traffic detected! Expected delay: ${snapshot.averageDelayMinutes} minutes`;
    }

    if (snapshot.incidents.length > 0) {
      return `Traffic on route: ${snapshot.averageDelayMinutes} minutes additional delay`;
    }

    return null;
  }

  /**
   * Clear all monitoring for a route
   */
  clearRoute(routeId: string): void {
    this.stopMonitoring(routeId);
    this.trafficHistory.delete(routeId);
  }
}

// Export singleton instance
export const trafficMonitoringService = new TrafficMonitoringService();
