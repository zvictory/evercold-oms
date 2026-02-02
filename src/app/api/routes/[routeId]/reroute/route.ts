/**
 * POST /api/routes/[routeId]/reroute
 * Updates route when driver switches to alternative route
 * Recalculates remaining stops with new route
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { yandexRoutingService } from '@/lib/yandexRoutingService';

interface RerouteRequest {
  alternativeRouteId: string;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    const { routeId } = await params;
    const body: RerouteRequest = await request.json();

    // Validate input
    if (!body.currentLocation?.latitude || !body.currentLocation?.longitude) {
      return NextResponse.json(
        { error: 'Invalid current location' },
        { status: 400 }
      );
    }

    // Verify route exists
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
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    if (route.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Route is not active' },
        { status: 400 }
      );
    }

    // Get current stop index
    const currentStopIndex = route.stops.findIndex(
      (s) => !['COMPLETED', 'FAILED', 'SKIPPED'].includes(s.status)
    );

    if (currentStopIndex === -1) {
      return NextResponse.json(
        { error: 'All stops completed' },
        { status: 400 }
      );
    }

    // Recalculate ETAs for all remaining stops using new route
    let currentPos = body.currentLocation;
    let totalDurationWithTraffic = 0;
    const stopUpdates: Array<{
      stopId: string;
      liveETA: Date;
    }> = [];

    for (let i = currentStopIndex; i < route.stops.length; i++) {
      const stop = route.stops[i];
      const branch = stop.delivery.order.orderItems[0]?.branch;

      if (!branch?.latitude || !branch?.longitude) {
        continue;
      }

      const destination = {
        latitude: branch.latitude,
        longitude: branch.longitude,
      };

      try {
        // Get route from current position to this stop
        const routeData = await yandexRoutingService.getRoute(currentPos, destination, true);

        if (routeData) {
          const durationWithTraffic = routeData.durationInTraffic / 60; // Convert to minutes
          totalDurationWithTraffic += durationWithTraffic;

          const now = new Date();
          const newETA = new Date(now.getTime() + totalDurationWithTraffic * 60 * 1000);

          stopUpdates.push({
            stopId: stop.id,
            liveETA: newETA,
          });

          // Move to next position
          currentPos = destination;
        }
      } catch (error) {
        console.warn(`Failed to recalculate ETA for stop ${stop.id}:`, error);
      }
    }

    // Update all stops with new ETAs
    for (const update of stopUpdates) {
      await prisma.routeStop.update({
        where: { id: update.stopId },
        data: {
          liveETA: update.liveETA,
        },
      });
    }

    // Update route with new estimated duration
    await prisma.deliveryRoute.update({
      where: { id: routeId },
      data: {
        estimatedDurationWithTraffic: Math.round(totalDurationWithTraffic),
        trafficDataTimestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Route updated with alternative path',
      stopsUpdated: stopUpdates.length,
      newEstimatedDuration: Math.round(totalDurationWithTraffic),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error rerouting:', error);
    return NextResponse.json(
      {
        error: 'Failed to reroute',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
