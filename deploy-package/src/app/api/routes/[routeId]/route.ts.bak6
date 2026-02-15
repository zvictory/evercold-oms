import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDriver, DriverAuthError, handleDriverAuthError } from '@/lib/driverAuth';
import { requireManagerOrAdmin, AuthError, handleAuthError } from '@/lib/auth';

/**
 * GET /api/routes/[routeId]
 * Fetch a specific delivery route with all stops and details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    // Allow either driver or admin/manager
    let driverSession: Awaited<ReturnType<typeof requireDriver>> | null = null;
    try {
      driverSession = await requireDriver(request);
    } catch {
      // Not a driver token — try admin auth
      try {
        await requireManagerOrAdmin(request);
      } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { routeId } = await params;

    // Handle standalone delivery virtual routes
    if (routeId.startsWith('standalone-')) {
      const deliveryId = routeId.replace('standalone-', '');

      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          order: {
            include: {
              customer: {
                select: {
                  name: true,
                  _count: { select: { branches: true } },
                },
              },
              orderItems: {
                include: {
                  branch: {
                    select: {
                      id: true,
                      branchName: true,
                      fullName: true,
                      deliveryAddress: true,
                      latitude: true,
                      longitude: true,
                      contactPerson: true,
                      phone: true,
                    },
                  },
                  product: {
                    select: {
                      id: true,
                      name: true,
                      unit: true,
                    },
                  },
                },
              },
            },
          },
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              model: true,
              type: true,
            },
          },
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      });

      if (!delivery) {
        return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
      }

      // Transform into virtual route format
      const virtualRoute = {
        id: routeId,
        routeName: `Доставка #${delivery.order.orderNumber}`,
        isStandalone: true,
        driverId: delivery.driverId,
        vehicleId: delivery.vehicleId,
        scheduledDate: delivery.scheduledDate,
        status: 'PLANNED' as const,
        driver: delivery.driver,
        vehicle: delivery.vehicle,
        stops: [
          {
            id: `virtual-stop-${delivery.id}`,
            routeId,
            deliveryId: delivery.id,
            stopNumber: 1,
            status: delivery.status === 'DELIVERED' ? ('COMPLETED' as const) : ('PENDING' as const),
            actualArrival: delivery.deliveryTime,
            completedAt: delivery.deliveryTime,
            notes: null,
            distanceFromPrev: null,
            estimatedArrival: null,
            estimatedDurationWithTraffic: null,
            turnByTurnInstructions: null,
            liveETA: null,
            originalETA: null,
            alternativeRoutes: null,
            createdAt: delivery.createdAt,
            updatedAt: delivery.updatedAt,
            delivery,
          },
        ],
        totalDistance: null,
        estimatedDuration: null,
        estimatedDurationWithTraffic: null,
        actualStartTime: null,
        actualEndTime: null,
        notes: delivery.notes,
        optimizationMethod: 'manual',
        trafficDataTimestamp: null,
        routeGeometry: null,
        trafficLevel: null,
        createdAt: delivery.createdAt,
        updatedAt: delivery.updatedAt,
      };

      return NextResponse.json({ route: virtualRoute });
    }

    const route = await prisma.deliveryRoute.findUnique({
      where: { id: routeId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
            type: true,
          },
        },
        stops: {
          orderBy: { stopNumber: 'asc' },
          include: {
            delivery: {
              include: {
                order: {
                  include: {
                    customer: {
                      select: {
                        name: true,
                        _count: { select: { branches: true } },
                      },
                    },
                    orderItems: {
                      include: {
                        branch: {
                          select: {
                            id: true,
                            branchName: true,
                            fullName: true,
                            deliveryAddress: true,
                            latitude: true,
                            longitude: true,
                            contactPerson: true,
                            phone: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    // If driver auth, verify ownership
    if (driverSession && route.driverId !== driverSession.driver.id) {
      return NextResponse.json(
        { error: 'Forbidden: Route belongs to another driver' },
        { status: 403 }
      );
    }

    return NextResponse.json({ route });
  } catch (error) {
    console.error('Error fetching route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/routes/[routeId]
 * Update route details (name, notes, status, etc.)
 * Handles route status changes with cascading stop updates
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    await requireManagerOrAdmin(request);
    const { routeId } = await params;
    const body = await request.json();
    const { routeName, notes, status, actualStartTime, actualEndTime, trafficLevel } = body;

    // Validate status if provided
    const validStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Use transaction to ensure consistent updates
    const route = await prisma.$transaction(async (tx) => {
      // Get the route with stops
      const existingRoute = await tx.deliveryRoute.findUnique({
        where: { id: routeId },
        include: { stops: true },
      });

      if (!existingRoute) {
        throw new Error('Route not found');
      }

      // Update route
      const updatedRoute = await tx.deliveryRoute.update({
        where: { id: routeId },
        data: {
          ...(routeName && { routeName }),
          ...(notes !== undefined && { notes }),
          ...(status && { status }),
          ...(actualStartTime && { actualStartTime: new Date(actualStartTime) }),
          ...(actualEndTime && { actualEndTime: new Date(actualEndTime) }),
          ...(trafficLevel && { trafficLevel }),
        },
      });

      // If route is being started, update first stop to EN_ROUTE
      if (status === 'IN_PROGRESS' && existingRoute.stops.length > 0) {
        const firstStop = existingRoute.stops[0];
        if (firstStop) {
          await tx.routeStop.update({
            where: { id: firstStop.id },
            data: { status: 'EN_ROUTE' },
          });
        }
      }

      // If route is being completed, mark incomplete stops as SKIPPED
      if (status === 'COMPLETED') {
        const incompleteStops = existingRoute.stops.filter(
          (stop) => !['COMPLETED', 'FAILED', 'SKIPPED'].includes(stop.status)
        );

        for (const stop of incompleteStops) {
          await tx.routeStop.update({
            where: { id: stop.id },
            data: { status: 'SKIPPED' },
          });
        }
      }

      return updatedRoute;
    });

    return NextResponse.json({ route });
  } catch (error) {
    if (error instanceof AuthError) return handleAuthError(error);
    console.error('Error updating route:', error);

    if (error instanceof Error && error.message === 'Route not found') {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update route' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/routes/[routeId]
 * Delete a route (only if PLANNED status)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    await requireManagerOrAdmin(request);
    const { routeId } = await params;

    // Check if route can be deleted
    const route = await prisma.deliveryRoute.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    if (route.status !== 'PLANNED') {
      return NextResponse.json(
        { error: 'Only planned routes can be deleted' },
        { status: 400 }
      );
    }

    await prisma.deliveryRoute.delete({
      where: { id: routeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return handleAuthError(error);
    console.error('Error deleting route:', error);
    return NextResponse.json(
      { error: 'Failed to delete route' },
      { status: 500 }
    );
  }
}
