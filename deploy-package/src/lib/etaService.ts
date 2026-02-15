/**
 * ETA Service
 * Handles real-time ETA calculations and updates based on current traffic
 */

import { yandexRoutingService } from './yandexRoutingService';
import { YandexCoordinates } from '@/types/yandex';
import { prisma } from '@/lib/prisma';

export interface ETAUpdate {
  stopId: string;
  originalETA: Date;
  currentETA: Date;
  delayMinutes: number;
  confidence: 'high' | 'medium' | 'low';
  reasonForDelay?: string;
  trafficLevel: 'low' | 'medium' | 'high' | 'blocked';
}

export class ETAService {
  private delayThresholdMinutes = 15; // Alert if delay > 15 min
  private delayNotificationThreshold = 30; // Notify if delay > 30 min

  /**
   * Calculate live ETAs for remaining stops on a route
   */
  async calculateLiveETAs(
    routeId: string,
    currentLocation: YandexCoordinates,
    currentStopId: string
  ): Promise<ETAUpdate[]> {
    try {
      // Fetch route and remaining stops
      const route = await prisma.deliveryRoute.findUnique({
        where: { id: routeId },
        include: {
          stops: {
            include: {
              delivery: {
                include: {
                  order: {
                    include: {
                      orderItems: {
                        include: {
                          branch: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { stopNumber: 'asc' },
          },
        },
      });

      if (!route) {
        throw new Error(`Route ${routeId} not found`);
      }

      // Find current stop index
      const currentStopIndex = route.stops.findIndex((s) => s.id === currentStopId);
      if (currentStopIndex === -1) {
        throw new Error(`Stop ${currentStopId} not found in route`);
      }

      const etaUpdates: ETAUpdate[] = [];
      let currentPos = currentLocation;

      // Calculate ETA for each remaining stop
      for (let i = currentStopIndex; i < route.stops.length; i++) {
        const stop = route.stops[i];
        const branch = stop.delivery.order.orderItems[0]?.branch;

        if (!branch?.latitude || !branch?.longitude) {
          console.warn(`Stop ${stop.id} has no coordinates`);
          continue;
        }

        const destination: YandexCoordinates = {
          latitude: branch.latitude,
          longitude: branch.longitude,
        };

        // Get route with traffic data
        const routeData = await yandexRoutingService.getRoute(currentPos, destination, true);

        if (!routeData) {
          console.warn(`Failed to fetch route to stop ${stop.id}`);
          continue;
        }

        // Calculate new ETA
        const now = new Date();
        const durationWithTraffic = routeData.durationInTraffic / 60; // Convert to minutes
        const currentETA = new Date(now.getTime() + durationWithTraffic * 60 * 1000);

        // Get original ETA
        const originalETA = stop.estimatedArrival || stop.originalETA || new Date();

        // Calculate delay
        const delayMs = currentETA.getTime() - originalETA.getTime();
        const delayMinutes = Math.round(delayMs / 60000);

        // Determine confidence based on how fresh the traffic data is
        const confidence = this.calculateConfidence(delayMinutes);

        const update: ETAUpdate = {
          stopId: stop.id,
          originalETA,
          currentETA,
          delayMinutes,
          confidence,
          reasonForDelay: delayMinutes > this.delayThresholdMinutes ? 'traffic' : undefined,
          trafficLevel: routeData.trafficLevel,
        };

        etaUpdates.push(update);

        // Move to next position
        currentPos = destination;
      }

      return etaUpdates;
    } catch (error) {
      console.error('Error calculating live ETAs:', error);
      throw error;
    }
  }

  /**
   * Update stop ETAs in the database
   */
  async updateStopETAs(etas: ETAUpdate[]): Promise<void> {
    try {
      for (const eta of etas) {
        await prisma.routeStop.update({
          where: { id: eta.stopId },
          data: {
            liveETA: eta.currentETA,
            originalETA: eta.originalETA,
          },
        });
      }
    } catch (error) {
      console.error('Error updating stop ETAs:', error);
      throw error;
    }
  }

  /**
   * Check for significant delays and notify
   */
  async notifyDelays(routeId: string, delays: ETAUpdate[]): Promise<string[]> {
    const notifications: string[] = [];

    for (const delay of delays) {
      if (delay.delayMinutes > this.delayNotificationThreshold) {
        // Get stop details for notification
        const stop = await prisma.routeStop.findUnique({
          where: { id: delay.stopId },
          include: {
            delivery: {
              include: {
                order: {
                  include: {
                    customer: true,
                    orderItems: {
                      include: {
                        branch: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (stop) {
          const branchName = stop.delivery.order.orderItems[0]?.branch?.branchName || 'Unknown';
          const message = `⚠️ Route ${routeId}: Delayed arrival at ${branchName} by ${delay.delayMinutes} minutes due to ${delay.reasonForDelay || 'traffic'}`;

          notifications.push(message);

          // Log for dispatcher dashboard
          console.log(message);
        }
      }
    }

    return notifications;
  }

  /**
   * Calculate confidence level based on delay magnitude
   */
  private calculateConfidence(delayMinutes: number): 'high' | 'medium' | 'low' {
    if (delayMinutes < 5) return 'high';
    if (delayMinutes < 15) return 'medium';
    return 'low';
  }

  /**
   * Format ETA for display
   */
  formatETA(eta: Date): string {
    const hours = eta.getHours().toString().padStart(2, '0');
    const minutes = eta.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Get delay status badge
   */
  getDelayStatus(delayMinutes: number): 'on-time' | 'slightly-late' | 'late' | 'very-late' {
    if (delayMinutes <= 0) return 'on-time';
    if (delayMinutes < 10) return 'slightly-late';
    if (delayMinutes < 30) return 'late';
    return 'very-late';
  }
}

// Export singleton instance
export const etaService = new ETAService();
