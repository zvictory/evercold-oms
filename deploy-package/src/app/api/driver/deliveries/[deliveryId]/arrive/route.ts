import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDriver, DriverAuthError, handleDriverAuthError } from '@/lib/driverAuth';

/**
 * PATCH /api/driver/deliveries/[deliveryId]/arrive
 * Marks a standalone delivery as arrived.
 * This is used for "Virtual Routes" where no real DeliveryRoute exists.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  try {
    const session = await requireDriver(request);
    const { deliveryId } = await params;

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    if (delivery.driverId !== session.driver.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update delivery status
    // Note: We don't have an ARRIVED status in the Delivery model typically,
    // so we might just store the arrival time in notes/metadata if needed,
    // or if the schema supports it, update the status.
    // Looking at the console error, the app expects the Stop to be "ARRIVED".
    // For standalone, the virtual route logic in dashboard will now show "Checklist".
    
    // We'll update the notes to record arrival time
    const existingNotes = delivery.notes ? JSON.parse(delivery.notes) : {};
    const updatedNotes = JSON.stringify({
      ...existingNotes,
      arrivedAt: new Date().toISOString(),
    });

    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        notes: updatedNotes,
        // If there's a specific status for being at the location but not yet delivered,
        // we'd set it here. For now, we rely on the client-side state mapping.
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof DriverAuthError) return handleDriverAuthError(error);
    console.error('Error marking standalone arrival:', error);
    return NextResponse.json({ error: 'Failed to mark arrival' }, { status: 500 });
  }
}
