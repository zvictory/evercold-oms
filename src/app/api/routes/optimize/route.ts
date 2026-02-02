import { NextRequest, NextResponse } from 'next/server';
import { RouteOptimizer, type Location } from '@/lib/routeOptimizer';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/routes/optimize
 * Optimizes delivery routes for multiple deliveries
 *
 * Request Body:
 * {
 *   deliveryIds: string[];          // IDs of deliveries to include in route
 *   driverId?: string;              // Optional driver assignment
 *   vehicleId?: string;             // Optional vehicle assignment
 *   scheduledDate?: string;         // ISO date string
 *   returnToDepot?: boolean;        // Whether to return to depot (default: true)
 *   saveRoute?: boolean;            // Whether to save the optimized route (default: false)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      deliveryIds,
      driverId,
      vehicleId,
      scheduledDate,
      returnToDepot = true,
      saveRoute = false,
    } = body;

    // Validate input
    if (!deliveryIds || !Array.isArray(deliveryIds) || deliveryIds.length === 0) {
      return NextResponse.json(
        { error: 'deliveryIds is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Fetch deliveries with their order and branch information
    const deliveries = await prisma.delivery.findMany({
      where: {
        id: { in: deliveryIds },
        status: { in: ['PENDING', 'IN_TRANSIT'] },
      },
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
    });

    if (deliveries.length === 0) {
      return NextResponse.json(
        { error: 'No valid deliveries found' },
        { status: 404 }
      );
    }

    // Build locations from order items with branch coordinates
    const locationMap = new Map<string, Location>();

    for (const delivery of deliveries) {
      for (const item of delivery.order.orderItems) {
        if (item.branch && item.branch.latitude && item.branch.longitude) {
          const branchId = item.branch.id;

          if (!locationMap.has(branchId)) {
            locationMap.set(branchId, {
              id: branchId,
              latitude: item.branch.latitude,
              longitude: item.branch.longitude,
              address: item.branch.deliveryAddress || item.branch.fullName,
              priority: 5, // Default priority
            });
          }
        }
      }
    }

    const locations = Array.from(locationMap.values());

    if (locations.length === 0) {
      return NextResponse.json(
        { error: 'No locations with coordinates found in deliveries' },
        { status: 400 }
      );
    }

    // Use warehouse/depot as starting point (Tashkent center as default)
    // TODO: Replace with actual warehouse location from settings/config
    const depot: Location = {
      id: 'depot',
      latitude: 41.2995,
      longitude: 69.2401,
      address: 'Warehouse - Tashkent Center',
    };

    // Optimize the route
    const optimizedRoute = RouteOptimizer.optimizeRouteBest(
      depot,
      locations,
      returnToDepot
    );

    // Optionally save the route to database
    let savedRoute = null;
    if (saveRoute) {
      if (!driverId || !vehicleId) {
        return NextResponse.json(
          { error: 'driverId and vehicleId are required when saveRoute is true' },
          { status: 400 }
        );
      }

      // Create the delivery route
      savedRoute = await prisma.deliveryRoute.create({
        data: {
          routeName: `Route ${new Date().toLocaleDateString()}`,
          driverId,
          vehicleId,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
          status: 'PLANNED',
          totalDistance: optimizedRoute.totalDistance,
          estimatedDuration: optimizedRoute.estimatedTime,
          stops: {
            create: optimizedRoute.sequence
              .filter((locationId) => locationId !== 'depot')
              .map((locationId, index) => {
                // Find delivery for this location
                const delivery = deliveries.find((d) =>
                  d.order.orderItems.some((item) => item.branchId === locationId)
                );

                if (!delivery) return null;

                const leg = optimizedRoute.legs[index];

                return {
                  deliveryId: delivery.id,
                  stopNumber: index + 1,
                  distanceFromPrev: leg?.distance || 0,
                  status: 'PENDING',
                };
              })
              .filter(Boolean) as any[],
          },
        },
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
    }

    return NextResponse.json({
      success: true,
      route: optimizedRoute,
      savedRoute,
      summary: {
        totalStops: locations.length,
        totalDistance: `${optimizedRoute.totalDistance.toFixed(1)} km`,
        estimatedTime: `${Math.floor(optimizedRoute.estimatedTime / 60)}h ${optimizedRoute.estimatedTime % 60}m`,
        sequence: optimizedRoute.sequence,
      },
    });
  } catch (error) {
    console.error('Route optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize route', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/routes/optimize?deliveryIds=id1,id2,id3
 * Preview route optimization without saving
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const deliveryIdsParam = searchParams.get('deliveryIds');

    if (!deliveryIdsParam) {
      return NextResponse.json(
        { error: 'deliveryIds query parameter is required' },
        { status: 400 }
      );
    }

    const deliveryIds = deliveryIdsParam.split(',');

    // Reuse POST logic with saveRoute=false
    return POST(
      new NextRequest(request.url, {
        method: 'POST',
        body: JSON.stringify({ deliveryIds, saveRoute: false }),
      })
    );
  } catch (error) {
    console.error('Route optimization preview error:', error);
    return NextResponse.json(
      { error: 'Failed to preview route optimization' },
      { status: 500 }
    );
  }
}
