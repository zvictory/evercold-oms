import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPin } from '@/lib/driverAuth'
import { requireUser, requireManagerOrAdmin, handleAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // All authenticated users can view drivers
    await requireUser(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const driversData = await prisma.driver.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { name: 'asc' }
    })

    // Transform data for response
    const drivers = driversData.map((driver) => ({
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      status: driver.status,
      notes: driver.notes,
      performance: {
        totalDeliveries: 0,
        onTimeDeliveries: 0,
        onTimePercentage: 0,
      },
    }))

    return NextResponse.json({ drivers })
  } catch (error: any) {
    console.error('Fetch drivers error:', error)
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  // Only ADMIN and MANAGER can create drivers
  await requireManagerOrAdmin(request)
  try {
    const body = await request.json()

    // Hash PIN if provided
    let hashedPin = null
    if (body.phonePin && body.phonePin.trim()) {
      hashedPin = await hashPin(body.phonePin)
    }

    // Auto-generate phone if not provided (must be unique)
    const phone = body.phone && body.phone.trim()
      ? body.phone
      : `+99800${Date.now().toString().slice(-7)}` // Generate unique phone

    // Auto-generate license number if not provided (must be unique)
    const licenseNumber = body.licenseNumber && body.licenseNumber.trim()
      ? body.licenseNumber
      : `PENDING-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}` // Generate unique license

    const driver = await prisma.driver.create({
      data: {
        name: body.name,
        phone,
        email: body.email || null,
        licenseNumber,
        licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : null,
        status: body.status || 'ACTIVE',
        notes: body.notes || null,
        phonePin: hashedPin,
      }
    })

    return NextResponse.json(driver)
  } catch (error: any) {
    console.error('Create driver error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create driver' },
      { status: 500 }
    )
  }
}
