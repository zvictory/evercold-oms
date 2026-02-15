import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDriver, DriverAuthError, handleDriverAuthError } from '@/lib/driverAuth';

/**
 * PATCH /api/routes/[routeId]/stops/[stopId]
 * Update a specific stop's status during route execution
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string; stopId: string }> }
) {
  try {
    const session = await requireDriver(request);
    const { routeId, stopId } = await params;
    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    // Verify stop belongs to the route
    const existingStop = await prisma.routeStop.findUnique({
      where: { id: stopId },
      include: {
        route: true,
        delivery: true,
      },
    });

    if (!existingStop) {
      return NextResponse.json(
        { error: 'Stop not found' },
        { status: 404 }
      );
    }

    if (existingStop.routeId !== routeId) {
      return NextResponse.json(
        { error: 'Stop does not belong to this route' },
        { status: 400 }
      );
    }

    // Verify driver owns this route
    if (existingStop.route.driverId !== session.driver.id) {
      return NextResponse.json(
        { error: 'Forbidden: Stop belongs to another driver\'s route' },
        { status: 403 }
      );
    }

    // Verify route is in progress
    if (existingStop.route.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Route must be IN_PROGRESS to update stops' },
        { status: 400 }
      );
    }

    // Enforce sequential stop ordering — cannot arrive at a stop until all previous are terminal
    if (status === 'ARRIVED' || status === 'EN_ROUTE') {
      const previousStops = await prisma.routeStop.findMany({
        where: {
          routeId,
          stopNumber: { lt: existingStop.stopNumber },
        },
      });
      const allPreviousDone = previousStops.every(s =>
        ['COMPLETED', 'FAILED', 'SKIPPED'].includes(s.status)
      );
      if (!allPreviousDone) {
        return NextResponse.json(
          { error: 'Previous stops must be completed before advancing' },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const updateData: any = {
      status,
      ...(notes !== undefined && { notes }),
    };

    // Set timestamps based on status changes
    if (status === 'ARRIVED' && !existingStop.actualArrival) {
      updateData.actualArrival = now;
    }

    if (status === 'COMPLETED' && !existingStop.completedAt) {
      updateData.completedAt = now;

      // Also update the delivery status
      await prisma.delivery.update({
        where: { id: existingStop.deliveryId },
        data: {
          status: 'DELIVERED',
          deliveryTime: now,
        },
      });

      // Update order items delivery status
      await prisma.orderItem.updateMany({
        where: {
          orderId: existingStop.delivery.orderId,
        },
        data: {
          deliveryStatus: 'DELIVERED',
          deliveryDate: now,
        },
      });
    }

    if (status === 'FAILED') {
      updateData.completedAt = now;

      // Update delivery status to FAILED
      await prisma.delivery.update({
        where: { id: existingStop.deliveryId },
        data: {
          status: 'FAILED',
        },
      });
    }

    // Update the stop
    const stop = await prisma.routeStop.update({
      where: { id: stopId },
      data: updateData,
      include: {
        delivery: {
          include: {
            order: true,
          },
        },
      },
    });

    // If this stop was completed, set the next pending stop to EN_ROUTE
    if (status === 'COMPLETED' || status === 'FAILED' || status === 'SKIPPED') {
      const nextStop = await prisma.routeStop.findFirst({
        where: {
          routeId,
          status: 'PENDING',
          stopNumber: {
            gt: existingStop.stopNumber,
          },
        },
        orderBy: {
          stopNumber: 'asc',
        },
      });

      if (nextStop) {
        await prisma.routeStop.update({
          where: { id: nextStop.id },
          data: { status: 'EN_ROUTE' },
        });
      }
    }

    return NextResponse.json({
      success: true,
      stop,
      message: `Stop status updated to ${status}`,
    });
  } catch (error) {
    if (error instanceof DriverAuthError) return handleDriverAuthError(error);
    console.error('Error updating stop:', error);
    return NextResponse.json(
      { error: 'Failed to update stop', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/routes/[routeId]/stops/[stopId]
 * Get details of a specific stop
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string; stopId: string }> }
) {
  try {
    const session = await requireDriver(request);
    const { stopId } = await params;

    const stop = await prisma.routeStop.findUnique({
      where: { id: stopId },
      include: {
        route: {
          include: {
            driver: true,
            vehicle: true,
          },
        },
        delivery: {
          include: {
            order: {
              include: {
                customer: true,
                orderItems: {
                  include: {
                    branch: true,
                    product: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!stop) {
      return NextResponse.json(
        { error: 'Stop not found' },
        { status: 404 }
      );
    }

    // Verify driver owns this route
    if (stop.route.driverId !== session.driver.id) {
      return NextResponse.json(
        { error: 'Forbidden: Stop belongs to another driver\'s route' },
        { status: 403 }
      );
    }

    return NextResponse.json({ stop });
  } catch (error) {
    if (error instanceof DriverAuthError) return handleDriverAuthError(error);
    console.error('Error fetching stop:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stop' },
      { status: 500 }
    );
  }
}
