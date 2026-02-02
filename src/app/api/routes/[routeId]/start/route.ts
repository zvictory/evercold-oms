import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/routes/[routeId]/start
 * Start a delivery route - marks route as IN_PROGRESS and sets actualStartTime
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    const { routeId } = await params;

    // Verify route exists and is in PLANNED status
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

    if (existingRoute.status !== 'PLANNED') {
      return NextResponse.json(
        { error: `Route is already ${existingRoute.status}` },
        { status: 400 }
      );
    }

    // Update route status to IN_PROGRESS and set start time
    const route = await prisma.deliveryRoute.update({
      where: { id: routeId },
      data: {
        status: 'IN_PROGRESS',
        actualStartTime: new Date(),
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

    // Update all associated deliveries to IN_TRANSIT status
    await prisma.delivery.updateMany({
      where: {
        id: {
          in: route.stops.map((stop) => stop.deliveryId),
        },
      },
      data: {
        status: 'IN_TRANSIT',
        pickupTime: new Date(),
      },
    });

    // Optionally set the first stop to EN_ROUTE
    if (route.stops.length > 0) {
      await prisma.routeStop.update({
        where: { id: route.stops[0].id },
        data: { status: 'EN_ROUTE' },
      });
    }

    return NextResponse.json({
      success: true,
      route,
      message: 'Route started successfully',
    });
  } catch (error) {
    console.error('Error starting route:', error);
    return NextResponse.json(
      { error: 'Failed to start route', details: (error as Error).message },
      { status: 500 }
    );
  }
}
