import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderIds, driverId, vehicleId, scheduledDate, notes, createRoute } = body;

    // Validation
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'orderIds is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!driverId || !vehicleId) {
      return NextResponse.json(
        { error: 'driverId and vehicleId are required' },
        { status: 400 }
      );
    }

    // Fetch orders with validation
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        delivery: true,
        orderItems: {
          include: {
            branch: {
              select: {
                id: true,
                branchName: true,
                latitude: true,
                longitude: true,
                deliveryAddress: true,
              },
            },
          },
        },
      },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }

    // Validate driver and vehicle
    const [driver, vehicle] = await Promise.all([
      prisma.driver.findUnique({ where: { id: driverId } }),
      prisma.vehicle.findUnique({ where: { id: vehicleId } }),
    ]);

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    if (driver.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Driver ${driver.name} is not active (status: ${driver.status})` },
        { status: 400 }
      );
    }

    // Check for existing deliveries
    const ordersWithDelivery = orders.filter(o => o.delivery);
    if (ordersWithDelivery.length > 0) {
      const orderNumbers = ordersWithDelivery.map(o => o.orderNumber).join(', ');
      return NextResponse.json(
        { error: 'Some orders already have deliveries assigned', details: { orderNumbers } },
        { status: 400 }
      );
    }

    // Check invalid statuses
    const invalidOrders = orders.filter(o =>
      ['COMPLETED', 'CANCELLED', 'SHIPPED'].includes(o.status)
    );
    if (invalidOrders.length > 0) {
      const orderNumbers = invalidOrders.map(o => `${o.orderNumber} (${o.status})`).join(', ');
      return NextResponse.json(
        { error: 'Some orders have invalid status', details: { orderNumbers } },
        { status: 400 }
      );
    }

    // Create deliveries in transaction
    const createdDeliveries = await prisma.$transaction(async (tx) => {
      const deliveries = await Promise.all(
        orders.map((order) =>
          tx.delivery.create({
            data: {
              orderId: order.id,
              driverId,
              vehicleId,
              scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
              status: 'PENDING',
              notes,
            },
            include: {
              order: { select: { id: true, orderNumber: true } },
            },
          })
        )
      );

      // Update vehicle status
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'IN_USE' },
      });

      // Update order statuses to READY
      await tx.order.updateMany({
        where: {
          id: { in: orderIds },
          status: { in: ['NEW', 'CONFIRMED', 'PICKING', 'PACKING'] },
        },
        data: { status: 'READY' },
      });

      return deliveries;
    });

    // Optionally create optimized route
    let route = null;
    if (createRoute && createdDeliveries.length > 0) {
      try {
        const optimizationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/routes/optimize`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deliveryIds: createdDeliveries.map(d => d.id),
              driverId,
              vehicleId,
              scheduledDate,
              saveRoute: true,
            }),
          }
        );

        if (optimizationResponse.ok) {
          const optimizationData = await optimizationResponse.json();
          route = optimizationData.savedRoute;
        }
      } catch (err) {
        console.error('Route optimization failed:', err);
        // Continue without route - deliveries are still created
      }
    }

    return NextResponse.json({
      success: true,
      deliveries: createdDeliveries,
      route,
      summary: {
        totalDeliveries: createdDeliveries.length,
        driverName: driver.name,
        vehiclePlateNumber: vehicle.plateNumber,
        routeCreated: !!route,
      },
    });

  } catch (error: any) {
    console.error('Bulk assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to assign deliveries', details: error.message },
      { status: 500 }
    );
  }
}
