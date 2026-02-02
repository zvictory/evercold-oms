import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const vehicles = await prisma.vehicle.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        driver: true,
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
      orderBy: { plateNumber: 'asc' },
    })

    return NextResponse.json({ vehicles })
  } catch (error: any) {
    console.error('Fetch vehicles error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: body.plateNumber,
        model: body.model,
        type: body.type || 'VAN',
        capacity: body.capacity ? parseFloat(body.capacity) : null,
        status: body.status || 'AVAILABLE',
        driverId: body.driverId || null,
        notes: body.notes,
      },
    })

    return NextResponse.json(vehicle)
  } catch (error: any) {
    console.error('Create vehicle error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create vehicle' },
      { status: 500 }
    )
  }
}
