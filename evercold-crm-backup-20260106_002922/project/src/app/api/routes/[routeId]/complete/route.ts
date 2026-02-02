import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/routes/[routeId]/complete
 * Complete a delivery route - marks route as COMPLETED and sets actualEndTime
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    const { routeId } = await params;

    // Verify route exists and is in IN_PROGRESS status
    const existingRoute = await prisma.deliveryRoute.findUnique({
      where: { id: routeId },
      include: {
        stops: true,
      },
    });

    if (!existingRoute) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    if (existingRoute.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: `Route must be IN_PROGRESS to complete (current: ${existingRoute.status})` },
        { status: 400 }
      );
    }

    // Check if all stops are completed or have a final status
    const incompletestops = existingRoute.stops.filter(
      (stop) => !['COMPLETED', 'FAILED', 'SKIPPED'].includes(stop.status)
    );

    if (incompletestops.length > 0) {
      return NextResponse.json(
        {
          error: `${incompletestops.length} stops are still pending or in progress`,
          incompleteStops: incompletestops.map((s) => ({
            stopNumber: s.stopNumber,
            status: s.status,
          })),
        },
        { status: 400 }
      );
    }

    // Update route status to COMPLETED and set end time
    const route = await prisma.deliveryRoute.update({
      where: { id: routeId },
      data: {
        status: 'COMPLETED',
        actualEndTime: new Date(),
      },
      include: {
        driver: true,
        vehicle: true,
        stops: {
          orderBy: { stopNumber: 'asc' },
          include: {
            delivery: {
              include: {
                order: true,
              },
            },
          },
        },
      },
    });

    // Update all successfully completed deliveries
    const completedDeliveryIds = route.stops
      .filter((stop) => stop.status === 'COMPLETED')
      .map((stop) => stop.deliveryId);

    if (completedDeliveryIds.length > 0) {
      await prisma.delivery.updateMany({
        where: {
          id: { in: completedDeliveryIds },
        },
        data: {
          status: 'DELIVERED',
          deliveryTime: new Date(),
        },
      });

      // Also update order statuses
      await prisma.order.updateMany({
        where: {
          delivery: {
            id: { in: completedDeliveryIds },
          },
        },
        data: {
          status: 'COMPLETED',
        },
      });
    }

    // Update failed deliveries
    const failedDeliveryIds = route.stops
      .filter((stop) => stop.status === 'FAILED')
      .map((stop) => stop.deliveryId);

    if (failedDeliveryIds.length > 0) {
      await prisma.delivery.updateMany({
        where: {
          id: { in: failedDeliveryIds },
        },
        data: {
          status: 'FAILED',
        },
      });
    }

    return NextResponse.json({
      success: true,
      route,
      summary: {
        totalStops: route.stops.length,
        completed: route.stops.filter((s) => s.status === 'COMPLETED').length,
        failed: route.stops.filter((s) => s.status === 'FAILED').length,
        skipped: route.stops.filter((s) => s.status === 'SKIPPED').length,
      },
      message: 'Route completed successfully',
    });
  } catch (error) {
    console.error('Error completing route:', error);
    return NextResponse.json(
      { error: 'Failed to complete route', details: (error as Error).message },
      { status: 500 }
    );
  }
}
