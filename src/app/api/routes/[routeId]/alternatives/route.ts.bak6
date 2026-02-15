/**
 * GET /api/routes/[routeId]/alternatives
 * Fetches alternative routes when traffic is heavy
 * Suggests faster routes with time savings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { routeComparisonService } from '@/lib/routeComparisonService';
import { trafficMonitoringService } from '@/lib/trafficMonitoringService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    const { routeId } = await params;

    // Verify route exists
    const route = await prisma.deliveryRoute.findUnique({
      where: { id: routeId },
      select: {
        id: true,
        status: true,
        estimatedDuration: true,
        estimatedDurationWithTraffic: true,
        totalDistance: true,
        stops: {
          select: {
            id: true,
            status: true,
            stopNumber: true,
            delivery: {
              select: {
                order: {
                  select: {
                    orderItems: {
                      select: {
                        branch: {
                          select: {
                            latitude: true,
                            longitude: true,
                            branchName: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { stopNumber: 'asc' as const },
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

    // Get current stop (first non-completed)
    const currentStopIndex = route.stops.findIndex(
      (s) => !['COMPLETED', 'FAILED', 'SKIPPED'].includes(s.status)
    );

    if (currentStopIndex === -1) {
      return NextResponse.json(
        { error: 'All stops completed' },
        { status: 400 }
      );
    }

    const currentStop = route.stops[currentStopIndex];
    const currentBranch = currentStop.delivery.order.orderItems[0]?.branch;

    if (!currentBranch?.latitude || !currentBranch?.longitude) {
      return NextResponse.json(
        { error: 'Current stop has no coordinates' },
        { status: 400 }
      );
    }

    // Get next stop (if exists)
    const nextStop = route.stops[currentStopIndex + 1];
    let destination = currentBranch;

    if (nextStop) {
      destination = nextStop.delivery.order.orderItems[0]?.branch || currentBranch;
    }

    // Get destination coordinates
    const from = {
      latitude: currentBranch.latitude,
      longitude: currentBranch.longitude,
    };

    const to = {
      latitude: destination.latitude || 0,
      longitude: destination.longitude || 0,
    };

    // Current route info
    const currentRouteInfo = {
      duration: route.estimatedDuration || 0,
      durationInTraffic: route.estimatedDurationWithTraffic || route.estimatedDuration || 0,
      distance: route.totalDistance || 0,
    };

    // Get alternative routes
    const comparison = await routeComparisonService.getAlternativeRoutes(
      from,
      to,
      currentRouteInfo
    );

    // Get traffic history
    const trafficHistory = trafficMonitoringService.getTrafficHistory(routeId);
    const latestTraffic = trafficHistory[trafficHistory.length - 1];

    return NextResponse.json({
      success: true,
      currentStop: {
        id: currentStop.id,
        stopNumber: currentStop.stopNumber,
        branchName: currentBranch.branchName,
      },
      currentRoute: comparison.currentRoute,
      alternatives: comparison.alternatives,
      recommendedRoute: comparison.recommendedRoute,
      timeSavingsPercentage: comparison.timeSavingsPercentage,
      trafficLevel: latestTraffic?.overallTrafficLevel || 'unknown',
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching alternatives:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch alternatives',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
