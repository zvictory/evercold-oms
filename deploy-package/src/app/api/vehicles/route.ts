import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireManagerOrAdmin, handleAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // All authenticated users can view vehicles
    await requireUser(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const vehiclesData = await prisma.vehicle.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { plateNumber: 'asc' }
    })

    // Transform data for response
    const vehicles = vehiclesData.map((vehicle) => ({
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      model: vehicle.model,
      type: vehicle.type,
      capacity: vehicle.capacity,
      status: vehicle.status,
      driverId: vehicle.driverId,
      notes: vehicle.notes,
      driver: null,
      currentLoad: {
        weight: 0,
        percentage: 0,
        itemCount: 0,
      },
    }))

    return NextResponse.json({ vehicles })
  } catch (error: any) {
    console.error('Fetch vehicles error:', error)
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only ADMIN and MANAGER can create vehicles
    await requireManagerOrAdmin(request)

    const body = await request.json()

    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: body.plateNumber,
        model: body.model,
        type: body.type || 'VAN',
        capacity: body.capacity ? parseFloat(body.capacity) : null,
        status: body.status || 'AVAILABLE',
        driverId: body.driverId || null,
        notes: body.notes || null,
      }
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
