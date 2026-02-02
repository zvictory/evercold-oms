import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/driver/deliveries
 * Unified endpoint for driver dashboard
 * Returns both regular routes AND standalone deliveries (deliveries with driver but no route)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const driverId = searchParams.get('driverId');

    if (!driverId) {
      return NextResponse.json(
        { error: 'driverId is required' },
        { status: 400 }
      );
    }

    // Fetch regular routes (existing functionality)
    const routes = await prisma.deliveryRoute.findMany({
      where: {
        driverId,
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
          },
        },
        stops: {
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
                  },
                },
              },
            },
          },
          orderBy: {
            stopNumber: 'asc',
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });

    // Fetch standalone deliveries (NEW: deliveries with driver but no RouteStop)
    const standaloneDeliveries = await prisma.delivery.findMany({
      where: {
        driverId,
        status: { in: ['PENDING', 'IN_TRANSIT'] },
        routeStop: null, // Key: no route association
      },
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
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });

    // Transform standalone deliveries into virtual "routes"
    const virtualRoutes = standaloneDeliveries.map((delivery) => ({
      id: `standalone-${delivery.id}`,
      routeName: `Доставка #${delivery.order.orderNumber}`,
      isStandalone: true,
      driverId: delivery.driverId,
      vehicleId: delivery.vehicleId,
      scheduledDate: delivery.scheduledDate,
      status: 'PLANNED',
      driver: delivery.driver,
      vehicle: delivery.vehicle,
      stops: [
        {
          id: `virtual-stop-${delivery.id}`,
          stopNumber: 1,
          deliveryId: delivery.id,
          status: 'PENDING',
          delivery,
        },
      ],
      totalDistance: null,
      estimatedDuration: null,
      actualStartTime: null,
      actualEndTime: null,
      notes: delivery.notes,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    }));

    // Combine and return
    const allRoutes = [...routes, ...virtualRoutes];

    return NextResponse.json({ routes: allRoutes });
  } catch (error) {
    console.error('Error fetching driver deliveries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver deliveries' },
      { status: 500 }
    );
  }
}
