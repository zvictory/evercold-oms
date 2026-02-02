import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const deliveries = await prisma.delivery.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        order: {
          include: {
            customer: {
              select: {
                name: true,
              },
            },
            orderItems: {
              include: {
                branch: {
                  select: {
                    id: true,
                    branchName: true,
                    fullName: true,
                    deliveryAddress: true,
                    latitude: true,
                    longitude: true,
                    contactPerson: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        driver: {
          select: {
            name: true,
          },
        },
        vehicle: {
          select: {
            plateNumber: true,
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    })

    return NextResponse.json({ deliveries })
  } catch (error: any) {
    console.error('Fetch deliveries error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deliveries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const delivery = await prisma.delivery.create({
      data: {
        orderId: body.orderId,
        driverId: body.driverId || null,
        vehicleId: body.vehicleId || null,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        status: body.status || 'PENDING',
        notes: body.notes,
      },
      include: {
        order: true,
        driver: true,
        vehicle: true,
      },
    })

    // Update vehicle status if assigned
    if (body.vehicleId) {
      await prisma.vehicle.update({
        where: { id: body.vehicleId },
        data: { status: 'IN_USE' },
      })
    }

    // Auto-create route if driver is assigned (prevents orphaned deliveries)
    if (body.driverId && body.vehicleId) {
      // Check if delivery already has a route via routeStop
      const existingStop = await prisma.routeStop.findUnique({
        where: { deliveryId: delivery.id },
      })

      if (!existingStop) {
        // Create single-delivery route
        await prisma.deliveryRoute.create({
          data: {
            routeName: `Доставка ${delivery.order.orderNumber}`,
            driverId: body.driverId,
            vehicleId: body.vehicleId,
            scheduledDate: body.scheduledDate
              ? new Date(body.scheduledDate)
              : new Date(),
            status: 'PLANNED',
            optimizationMethod: 'manual',
            stops: {
              create: {
                deliveryId: delivery.id,
                stopNumber: 1,
                status: 'PENDING',
              },
            },
          },
        })
      }
    }

    return NextResponse.json(delivery)
  } catch (error: any) {
    console.error('Create delivery error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create delivery' },
      { status: 500 }
    )
  }
}
