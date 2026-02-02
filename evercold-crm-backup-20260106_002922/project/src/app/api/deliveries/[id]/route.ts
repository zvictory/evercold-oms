import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const oldDelivery = await prisma.delivery.findUnique({
      where: { id },
    })

    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        driverId: body.driverId !== undefined ? body.driverId : undefined,
        vehicleId: body.vehicleId !== undefined ? body.vehicleId : undefined,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
        pickupTime: body.pickupTime ? new Date(body.pickupTime) : undefined,
        deliveryTime: body.deliveryTime ? new Date(body.deliveryTime) : undefined,
        status: body.status,
        notes: body.notes,
      },
      include: {
        order: true,
        driver: true,
        vehicle: true,
      },
    })

    // Update vehicle statuses
    if (oldDelivery?.vehicleId && body.vehicleId !== oldDelivery.vehicleId) {
      await prisma.vehicle.update({
        where: { id: oldDelivery.vehicleId },
        data: { status: 'AVAILABLE' },
      })
    }

    if (body.vehicleId && body.vehicleId !== oldDelivery?.vehicleId) {
      await prisma.vehicle.update({
        where: { id: body.vehicleId },
        data: { status: 'IN_USE' },
      })
    }

    // If delivered/failed/cancelled, mark vehicle as available
    if ((body.status === 'DELIVERED' || body.status === 'FAILED' || body.status === 'CANCELLED') && delivery.vehicleId) {
      await prisma.vehicle.update({
        where: { id: delivery.vehicleId },
        data: { status: 'AVAILABLE' },
      })
    }

    // Auto-update order status based on delivery status
    if (body.status && oldDelivery) {
      let newOrderStatus: string | null = null

      if (body.status === 'IN_TRANSIT') {
        newOrderStatus = 'SHIPPED'
      } else if (body.status === 'DELIVERED') {
        newOrderStatus = 'COMPLETED'
      }

      if (newOrderStatus) {
        await prisma.order.update({
          where: { id: delivery.orderId },
          data: { status: newOrderStatus as any },
        })
      }
    }

    return NextResponse.json(delivery)
  } catch (error: any) {
    console.error('Update delivery error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update delivery' },
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

    const delivery = await prisma.delivery.findUnique({
      where: { id },
    })

    if (delivery?.vehicleId) {
      await prisma.vehicle.update({
        where: { id: delivery.vehicleId },
        data: { status: 'AVAILABLE' },
      })
    }

    await prisma.delivery.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete delivery error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete delivery' },
      { status: 500 }
    )
  }
}
