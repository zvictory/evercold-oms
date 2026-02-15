import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DeliveryStatus, OrderStatus, VehicleStatus } from '@prisma/client';
import { requireDriver, DriverAuthError, handleDriverAuthError } from '@/lib/driverAuth';

/**
 * POST /api/routes/{routeId}/start
 * Start a delivery route - updates all deliveries to IN_TRANSIT
 *
 * This is called when a driver starts their route.
 * It updates all deliveries in the route from PENDING to IN_TRANSIT.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    const session = await requireDriver(request);
    const { routeId } = await params;

    // Fetch route with all deliveries and stops
    const route = await prisma.deliveryRoute.findUnique({
      where: { id: routeId },
      include: {
        stops: {
          include: {
            delivery: {
              include: {
                order: true,
              },
            },
          },
        },
        driver: true,
        vehicle: true,
      },
    });

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    // Verify driver owns this route
    if (route.driverId !== session.driver.id) {
      return NextResponse.json(
        { error: 'Forbidden: Route belongs to another driver' },
        { status: 403 }
      );
    }

    // Check if route is already started
    if (route.status === 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Route already started' },
        { status: 400 }
      );
    }

    // Check if route is completed
    if (route.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Route already completed' },
        { status: 400 }
      );
    }

    // Use transaction to update all deliveries atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update route status to IN_PROGRESS
      const updatedRoute = await tx.deliveryRoute.update({
        where: { id: routeId },
        data: {
          status: 'IN_PROGRESS',
          actualStartTime: new Date(),
        },
      });

      // 2. Set only the first pending stop to EN_ROUTE (sequential unlocking)
      const firstPendingStop = await tx.routeStop.findFirst({
        where: { routeId, status: 'PENDING' },
        orderBy: { stopNumber: 'asc' },
      });
      if (firstPendingStop) {
        await tx.routeStop.update({
          where: { id: firstPendingStop.id },
          data: { status: 'EN_ROUTE' },
        });
      }

      // 3. Update all deliveries in this route to IN_TRANSIT
      const deliveryIds = route.stops
        .filter(stop => stop.delivery)
        .map(stop => stop.delivery.id);

      if (deliveryIds.length > 0) {
        await tx.delivery.updateMany({
          where: {
            id: { in: deliveryIds },
            status: DeliveryStatus.PENDING,
          },
          data: {
            status: DeliveryStatus.IN_TRANSIT,
            pickupTime: new Date(),
          },
        });

        // 4. Update corresponding orders to SHIPPED
        const orderIds = route.stops
          .filter(stop => stop.delivery)
          .map(stop => stop.delivery.orderId);

        if (orderIds.length > 0) {
          await tx.order.updateMany({
            where: {
              id: { in: orderIds },
            },
            data: {
              status: OrderStatus.SHIPPED,
            },
          });
        }
      }

      // 5. Update vehicle status to IN_USE
      if (route.vehicleId) {
        await tx.vehicle.update({
          where: { id: route.vehicleId },
          data: { status: VehicleStatus.IN_USE },
        });
      }

      return updatedRoute;
    });

    // Fetch updated route with all deliveries for response
    const updatedRouteWithDeliveries = await prisma.deliveryRoute.findUnique({
      where: { id: routeId },
      include: {
        stops: {
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

    return NextResponse.json({
      success: true,
      message: `Route started successfully. ${route.stops.length} deliveries updated to IN_TRANSIT.`,
      route: updatedRouteWithDeliveries,
      updatedCount: route.stops.length,
    });

  } catch (error) {
    if (error instanceof DriverAuthError) return handleDriverAuthError(error);
    console.error('Error starting route:', error);
    return NextResponse.json(
      { error: 'Failed to start route' },
      { status: 500 }
    );
  }
}
