import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        driver: true,
        deliveries: {
          include: {
            order: {
              include: {
                customer: true,
              },
            },
            driver: true,
          },
          orderBy: { scheduledDate: 'desc' },
          take: 20,
        },
      },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    return NextResponse.json(vehicle)
  } catch (error: any) {
    console.error('Fetch vehicle error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vehicle' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        plateNumber: body.plateNumber,
        model: body.model,
        type: body.type,
        capacity: body.capacity ? parseFloat(body.capacity) : null,
        status: body.status,
        driverId: body.driverId || null,
        notes: body.notes,
      },
    })

    return NextResponse.json(vehicle)
  } catch (error: any) {
    console.error('Update vehicle error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update vehicle' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.vehicle.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete vehicle error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete vehicle' },
      { status: 500 }
    )
  }
}
