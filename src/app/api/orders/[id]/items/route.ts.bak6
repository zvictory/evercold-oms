import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { items } = await request.json()

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items must be an array' }, { status: 400 })
    }

    // Update each order item
    await Promise.all(
      items.map((item) =>
        prisma.orderItem.update({
          where: { id: item.id },
          data: {
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            subtotal: item.subtotal,
            vatAmount: item.vatAmount,
            totalAmount: item.totalAmount,
          },
        })
      )
    )

    // Recalculate order totals
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: id },
    })

    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
    const vatAmount = orderItems.reduce((sum, item) => sum + item.vatAmount, 0)
    const totalAmount = orderItems.reduce((sum, item) => sum + item.totalAmount, 0)

    // Update order totals
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        subtotal,
        vatAmount,
        totalAmount,
      },
    })

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error: any) {
    console.error('Error updating order items:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update order items' },
      { status: 500 }
    )
  }
}
