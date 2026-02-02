import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPin, createSession, updateLastLogin } from '@/lib/driverAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, pin } = body;

    // Validate input
    if (!phone || !pin) {
      return NextResponse.json(
        { success: false, error: 'Телефон и ПИН обязательны' },
        { status: 400 }
      );
    }

    // Normalize phone number (remove spaces, ensure format)
    const normalizedPhone = phone.replace(/\s+/g, '');

    // Find driver by phone
    const driver = await prisma.driver.findFirst({
      where: { phone: normalizedPhone },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        phonePin: true,
        licenseNumber: true,
        licenseExpiry: true,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Неверный номер или ПИН' },
        { status: 401 }
      );
    }

    // Check if driver has a PIN set
    if (!driver.phonePin) {
      return NextResponse.json(
        {
          success: false,
          error: 'ПИН не установлен. Обратитесь к диспетчеру'
        },
        { status: 401 }
      );
    }

    // Check if driver is active
    if (driver.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: `Аккаунт ${driver.status === 'INACTIVE' ? 'неактивен' : driver.status}. Обратитесь к диспетчеру`
        },
        { status: 403 }
      );
    }

    // Verify PIN
    const isPinValid = await verifyPin(pin, driver.phonePin);

    if (!isPinValid) {
      return NextResponse.json(
        { success: false, error: 'Неверный номер или ПИН' },
        { status: 401 }
      );
    }

    // Create session (24 hours)
    const token = await createSession(driver.id, 24);

    // Update last login timestamp
    await updateLastLogin(driver.id);

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Remove sensitive data
    const { phonePin, ...driverData } = driver;

    return NextResponse.json({
      success: true,
      driver: driverData,
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Driver login error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка входа. Попробуйте снова.' },
      { status: 500 }
    );
  }
}
