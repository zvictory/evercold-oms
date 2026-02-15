import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireManagerOrAdmin, handleAuthError } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Only ADMIN and MANAGER can assign orders
    await requireManagerOrAdmin(request)

    const body = await request.json()
    const { orderIds, driverId, vehicleId, scheduledDate, notes } = body

    // Validation
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'orderIds array is required' },
        { status: 400 }
      )
    }

    if (!driverId || !vehicleId) {
      return NextResponse.json(
        { error: 'driverId and vehicleId are required' },
        { status: 400 }
      )
    }

    // Verify driver exists and is active
    const driver = await prisma.driver.findUnique({
      where: { id: driverId }
    })

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }

    if (driver.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Driver is not active' },
        { status: 400 }
      )
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    if (vehicle.status === 'MAINTENANCE' || vehicle.status === 'RETIRED') {
      return NextResponse.json(
        { error: 'Vehicle is not available (Maintenance or Retired)' },
        { status: 400 }
      )
    }

    // Verify all orders exist
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds }
      }
    })

    if (orders.length !== orderIds.length) {
      return NextResponse.json(
        { error: 'Some orders not found' },
        { status: 404 }
      )
    }

    // Create or update deliveries for each order
    const deliveries = await prisma.$transaction(async (tx) => {
      const results = []

      for (const orderId of orderIds) {
        // Check if delivery already exists
        const existingDelivery = await tx.delivery.findUnique({
          where: { orderId }
        })

        if (existingDelivery) {
          // Update existing delivery
          const updated = await tx.delivery.update({
            where: { orderId },
            data: {
              driverId,
              vehicleId,
              scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
              status: 'PENDING',
              notes: notes || undefined
            }
          })
          results.push(updated)
        } else {
          // Create new delivery
          const created = await tx.delivery.create({
            data: {
              orderId,
              driverId,
              vehicleId,
              scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
              status: 'PENDING',
              notes: notes || undefined
            }
          })
          results.push(created)
        }
      }

      return results
    })

    return NextResponse.json(
      {
        success: true,
        message: `Successfully assigned ${deliveries.length} orders to ${driver.name}`,
        deliveries: deliveries.length,
        driverName: driver.name,
        vehiclePlate: vehicle.plateNumber
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Bulk assign error:', error)

    // Provide more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Some orders are already assigned. Please refresh and try again.' },
        { status: 409 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'One or more records not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to assign orders to driver' },
      { status: 500 }
    )
  }
}
