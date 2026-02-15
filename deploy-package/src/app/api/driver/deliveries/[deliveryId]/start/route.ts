import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DeliveryStatus, OrderStatus } from '@prisma/client';
import { requireDriver, DriverAuthError, handleDriverAuthError } from '@/lib/driverAuth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  try {
    const session = await requireDriver(request);
    const { deliveryId } = await params;

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true }
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    if (delivery.driverId !== session.driver.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
        await tx.delivery.update({
            where: { id: deliveryId },
            data: { status: DeliveryStatus.IN_TRANSIT }
        });
        await tx.order.update({
            where: { id: delivery.orderId },
            data: { status: OrderStatus.SHIPPED }
        });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof DriverAuthError) return handleDriverAuthError(error);
    return NextResponse.json({ error: 'Failed to start delivery' }, { status: 500 });
  }
}
