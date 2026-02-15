import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveDisplayBranch } from '@/lib/utils'
import { requireUser, requireManagerOrAdmin, handleAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // All authenticated users can view orders
    await requireUser(request)
    const searchParams = request.nextUrl.searchParams

    // Parse filters from query params
    const status = searchParams.get('status')
    const branch = searchParams.get('branch')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build where clause for Prisma
    const where: any = {}

    // Filter by status
    if (status && status !== 'ALL') {
      where.status = status
    }

    // Filter by search (order number or customer name)
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customer: { name: { contains: search } } }
      ]
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.orderDate = {}
      if (dateFrom) {
        where.orderDate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.orderDate.lte = endDate
      }
    }

    // Fetch orders with related data
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: { name: true, _count: { select: { branches: true } } }
        },
        orderItems: {
          include: {
            branch: {
              select: { branchCode: true, branchName: true }
            },
            product: {
              select: { sapCode: true }
            }
          }
        },
        delivery: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            },
            vehicle: {
              select: {
                id: true,
                plateNumber: true,
                model: true
              }
            }
          }
        }
      },
      orderBy: { orderDate: 'desc' }
    })

    // Filter by branch in application (after data fetching)
    const filteredOrders = branch
      ? orders.filter(order => {
        const branchNames = order.orderItems.map(item => item.branch?.branchName || '').join(' ')
        const branchCodes = order.orderItems.map(item => item.branch?.branchCode || '').join(' ')
        return branchNames.toLowerCase().includes(branch.toLowerCase()) ||
          branchCodes.toLowerCase().includes(branch.toLowerCase())
      })
      : orders

    // Transform data for frontend
    const transformedOrders = filteredOrders.map((order) => {
      // Smart fallback: use orderItem.sapCode if available, otherwise fall back to product.sapCode
      const ice3kgCount = order.orderItems
        .filter(item => {
          const code = item.sapCode || item.product?.sapCode
          return code === '107000001-00001'
        })
        .reduce((sum, item) => sum + item.quantity, 0)

      const ice1kgCount = order.orderItems
        .filter(item => {
          const code = item.sapCode || item.product?.sapCode
          return code === '107000001-00006'
        })
        .reduce((sum, item) => sum + item.quantity, 0)

      const totalQuantity = order.orderItems.reduce((sum, item) => sum + item.quantity, 0)

      const rawBranch = order.orderItems[0]?.branch?.branchName || 'Несколько филиалов'
      const branchName = resolveDisplayBranch(rawBranch, order.customer?.name, order.customer?._count?.branches)
      const branchCode = order.orderItems[0]?.branch?.branchCode || 'Multiple'

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        branch: branchName,
        branchCode: branchCode,
        customer: order.customer?.name || 'N/A',
        weight: Math.round(totalQuantity),
        amount: order.totalAmount,
        status: order.status,
        date: order.orderDate.toISOString().split('T')[0],
        sourceType: order.sourceType,
        itemCount: order.orderItems.length,
        products: {
          ice3kg: ice3kgCount,
          ice1kg: ice1kgCount,
        },
        delivery: order.delivery ? {
          id: order.delivery.id,
          status: order.delivery.status,
          scheduledDate: order.delivery.scheduledDate,
          driver: order.delivery.driver ? {
            id: order.delivery.driver.id,
            name: order.delivery.driver.name,
            phone: order.delivery.driver.phone
          } : null,
          vehicle: order.delivery.vehicle ? {
            id: order.delivery.vehicle.id,
            plateNumber: order.delivery.vehicle.plateNumber,
            model: order.delivery.vehicle.model
          } : null
        } : null
      }
    })

    return NextResponse.json({
      orders: transformedOrders,
      total: transformedOrders.length,
    })
  } catch (error: any) {
    console.error('Orders API error:', error)
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only ADMIN and MANAGER can create orders
    await requireManagerOrAdmin(request)

    const body = await request.json()

    // Validate required fields
    if (!body.customerId || !body.items?.length) {
      return NextResponse.json(
        { error: 'Customer and items are required' },
        { status: 400 }
      )
    }

    // Get the last order number to generate the next one
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true }
    })

    const orderNumber = generateOrderNumber(lastOrder?.orderNumber)

    // Calculate totals for each item
    const items = body.items.map((item: any) => {
      const subtotal = item.quantity * item.price
      const vatAmount = subtotal * ((item.vatRate || 0) / 100)
      const totalAmount = subtotal + vatAmount

      return {
        branchId: item.branchId,
        productId: item.productId,
        productName: item.productName || '',
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal,
        vatRate: item.vatRate || 0,
        vatAmount,
        totalAmount,
        sapCode: item.sapCode || '',
        barcode: item.barcode || ''
      }
    })

    // Calculate order totals
    const subtotal = items.reduce((sum: number, i: any) => sum + i.subtotal, 0)
    const vatAmount = items.reduce((sum: number, i: any) => sum + i.vatAmount, 0)
    const totalAmount = items.reduce((sum: number, i: any) => sum + i.totalAmount, 0)

    // Create order with items using transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: body.customerId,
          orderDate: new Date(body.orderDate),
          sourceType: 'DETAILED',
          status: 'NEW',
          subtotal,
          vatAmount,
          totalAmount,
          notes: body.notes || '',
          orderItems: {
            create: items
          }
        },
        include: {
          orderItems: true
        }
      })

      return newOrder
    })

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

// Helper function to generate sequential order numbers
function generateOrderNumber(lastOrderNumber?: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`

  if (lastOrderNumber?.startsWith(`ORD-${dateStr}`)) {
    const lastSeq = parseInt(lastOrderNumber.split('-')[2])
    const nextSeq = (lastSeq + 1).toString().padStart(4, '0')
    return `ORD-${dateStr}-${nextSeq}`
  }

  return `ORD-${dateStr}-0001`
}
