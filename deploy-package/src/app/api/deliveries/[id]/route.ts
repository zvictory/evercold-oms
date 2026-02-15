import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, OrderStatus, DeliveryStatus, DriverStatus, VehicleStatus } from '@prisma/client';
import { requireDriver, DriverAuthError, handleDriverAuthError } from '@/lib/driverAuth';
import { requireManagerOrAdmin, AuthError, handleAuthError } from '@/lib/auth';

/**
 * GET /api/deliveries/[id]
 * Get delivery details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Allow either driver or admin/manager
    let driverSession: Awaited<ReturnType<typeof requireDriver>> | null = null;
    try {
      driverSession = await requireDriver(request);
    } catch {
      try {
        await requireManagerOrAdmin(request);
      } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { id } = await params;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: { include: { _count: { select: { branches: true } } } },
            orderItems: {
              include: {
                product: true,
                branch: true,
              },
            },
          },
        },
        driver: true,
        vehicle: true,
        checklist: {
          include: {
            photos_rel: true,
          },
        },
        deliveryItems: true,
        routeStop: true,
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // If driver auth, verify ownership
    if (driverSession && delivery.driverId !== driverSession.driver.id) {
      return NextResponse.json(
        { error: 'Forbidden: Delivery belongs to another driver' },
        { status: 403 }
      );
    }

    return NextResponse.json(delivery);
  } catch (error) {
    console.error('Error fetching delivery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/deliveries/[id]
 * Update delivery status (admin endpoint)
 * Only allows status updates, not full data mutations
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManagerOrAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const { status, notes, deliveryTime } = body;

    // Validate status
    const validStatuses = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'PARTIALLY_DELIVERED', 'FAILED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const { id: deliveryId } = await params;
    // Fetch delivery with relations
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: true,
        routeStop: true,
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Use transaction for cascading updates
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update delivery status
      const updatedDelivery = await tx.delivery.update({
        where: { id },
        data: {
          status: status as DeliveryStatus,
          deliveryTime: deliveryTime ? new Date(deliveryTime) : undefined,
          notes: notes || undefined,
        },
      });

      // 2. Cascade to order status
      let orderStatus: OrderStatus;

      switch (status) {
        case DeliveryStatus.IN_TRANSIT:
          orderStatus = OrderStatus.SHIPPED;
          break;
        case DeliveryStatus.DELIVERED:
          orderStatus = OrderStatus.COMPLETED;
          break;
        case DeliveryStatus.PARTIALLY_DELIVERED:
          orderStatus = OrderStatus.PARTIAL;
          break;
        case DeliveryStatus.FAILED:
        case DeliveryStatus.CANCELLED:
          // Keep current order status for failed/cancelled deliveries
          orderStatus = delivery.order.status;
          break;
        default:
          orderStatus = delivery.order.status;
      }

      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: orderStatus },
      });

      // Update driver status if delivery is completed or failed
      if (delivery.driverId && (status === DeliveryStatus.DELIVERED || status === DeliveryStatus.PARTIALLY_DELIVERED || status === DeliveryStatus.FAILED || status === DeliveryStatus.CANCELLED)) {
        await tx.driver.update({
          where: { id: delivery.driverId },
          data: { status: DriverStatus.ACTIVE },
        });
      }

      // 3. Update RouteStop if part of a route
      if (delivery.routeStop && status === DeliveryStatus.FAILED) {
        await tx.routeStop.update({
          where: { id: delivery.routeStop.id },
          data: { status: 'FAILED' },
        });
      } else if (delivery.routeStop && (status === DeliveryStatus.DELIVERED || status === DeliveryStatus.PARTIALLY_DELIVERED)) {
        await tx.routeStop.update({
          where: { id: delivery.routeStop.id },
          data: { status: 'COMPLETED' },
        });
      }

      // 4. Update vehicle status if all deliveries complete
      if (status === DeliveryStatus.DELIVERED || status === DeliveryStatus.FAILED || status === DeliveryStatus.CANCELLED) {
        if (!delivery.routeStop) {
          // Standalone delivery
          if (delivery.vehicleId) {
            await tx.vehicle.update({
              where: { id: delivery.vehicleId },
              data: { status: VehicleStatus.AVAILABLE },
            });
          }
        } else {
          // Check if all route stops complete
          const route = await tx.deliveryRoute.findUnique({
            where: { id: delivery.routeStop.routeId },
            include: { stops: true },
          });

          if (route) {
            const allComplete = route.stops.every(
              (stop) => stop.status === 'COMPLETED' || stop.status === 'FAILED' || stop.status === 'SKIPPED'
            );

            if (allComplete) {
              await tx.vehicle.update({
                where: { id: delivery.vehicleId! },
                data: { status: VehicleStatus.AVAILABLE },
              });

              await tx.deliveryRoute.update({
                where: { id: route.id },
                data: { status: 'COMPLETED' },
              });
            }
          }
        }
      }

      return updatedDelivery;
    });

    return NextResponse.json({
      success: true,
      delivery: result,
    });
  } catch (error) {
    if (error instanceof AuthError) return handleAuthError(error);
    console.error('Error updating delivery:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update delivery' },
      { status: 500 }
    );
  }
}
