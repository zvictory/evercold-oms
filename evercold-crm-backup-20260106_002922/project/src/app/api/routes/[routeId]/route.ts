import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/routes/[routeId]
 * Fetch a specific delivery route with all stops and details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
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
 * Update route details (name, notes, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    const { routeId } = await params;
    const body = await request.json();
    const { routeName, notes, status } = body;

    const route = await prisma.deliveryRoute.update({
      where: { id: routeId },
      data: {
        ...(routeName && { routeName }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ route });
  } catch (error) {
    console.error('Error updating route:', error);
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
    console.error('Error deleting route:', error);
    return NextResponse.json(
      { error: 'Failed to delete route' },
      { status: 500 }
    );
  }
}
