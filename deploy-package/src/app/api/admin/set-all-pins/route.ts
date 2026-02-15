import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPin } from '@/lib/driverAuth';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || pin.length < 4 || pin.length > 6) {
      return NextResponse.json(
        { error: 'PIN must be 4-6 digits' },
        { status: 400 }
      );
    }

    // Get all drivers
    const drivers = await prisma.driver.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    if (drivers.length === 0) {
      return NextResponse.json(
        { error: 'No drivers found in database' },
        { status: 404 }
      );
    }

    // Hash the PIN
    const hashedPin = await hashPin(pin);

    // Update all drivers
    const updatePromises = drivers.map(driver =>
      prisma.driver.update({
        where: { id: driver.id },
        data: { phonePin: hashedPin },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Updated PIN for ${drivers.length} driver(s)`,
      drivers: drivers.map(d => ({
        name: d.name,
        phone: d.phone,
      })),
      pin: pin,
    });
  } catch (error: any) {
    console.error('Set all PINs error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set PINs' },
      { status: 500 }
    );
  }
}
