import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPin } from '@/lib/driverAuth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const drivers = await prisma.driver.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        vehicles: true,
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ drivers })
  } catch (error: any) {
    console.error('Fetch drivers error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch drivers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Hash PIN if provided
    let hashedPin = null
    if (body.phonePin && body.phonePin.trim()) {
      hashedPin = await hashPin(body.phonePin)
    }

    const driver = await prisma.driver.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        licenseNumber: body.licenseNumber,
        licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : null,
        status: body.status || 'ACTIVE',
        notes: body.notes,
        phonePin: hashedPin,
      },
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
