import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerCode: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sapCode: true,
                barcode: true,
                unit: true
              }
            },
            branch: {
              select: {
                id: true,
                branchName: true,
                branchCode: true,
                deliveryAddress: true,
                contactPerson: true,
                phone: true,
                operatingHours: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Transform to form structure
    const formData = {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      branchId: order.orderItems[0]?.branchId || '',
      orderDate: format(order.orderDate, 'yyyy-MM-dd'),
      notes: order.notes || '',
      status: order.status,
      items: order.orderItems.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.unitPrice,
        vatRate: item.vatRate,
        sapCode: item.sapCode || '',
        barcode: item.barcode || '',
        hasCustomPrice: false // Will be determined by client
      }))
    }

    return NextResponse.json(formData)
  } catch (error: any) {
    console.error('Get order error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
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

    // Validate required fields
    if (!body.customerId || !body.branchId || !body.items?.length) {
      return NextResponse.json(
        { error: 'Customer, branch, and items are required' },
        { status: 400 }
      )
    }

    // Use transaction for atomic update
    const updated = await prisma.$transaction(async (tx) => {
      // Delete existing order items
      await tx.orderItem.deleteMany({
        where: { orderId: id }
      })

      // Prepare new order items
      const items = body.items.map((item: any) => {
        const subtotal = item.quantity * item.price
        const vatAmount = subtotal * (item.vatRate / 100)
        const totalAmount = subtotal + vatAmount

        return {
          orderId: id,
          branchId: body.branchId,
          productId: item.productId,
          productName: item.productName || '',
          sapCode: item.sapCode || '',
          barcode: item.barcode || '',
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal,
          vatRate: item.vatRate,
          vatAmount,
          totalAmount
        }
      })

      // Create new order items
      await tx.orderItem.createMany({ data: items })

      // Calculate order totals
      const subtotal = items.reduce((sum: number, i: any) => sum + i.subtotal, 0)
      const vatAmount = items.reduce((sum: number, i: any) => sum + i.vatAmount, 0)
      const totalAmount = items.reduce((sum: number, i: any) => sum + i.totalAmount, 0)

      // Update order
      return await tx.order.update({
        where: { id },
        data: {
          customerId: body.customerId,
          orderDate: new Date(body.orderDate),
          notes: body.notes || '',
          subtotal,
          vatAmount,
          totalAmount
        },
        include: {
          customer: true,
          orderItems: {
            include: {
              branch: true,
              product: true
            }
          }
        }
      })
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Update order error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    )
  }
}
