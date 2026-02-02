import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        orderItems: {
          include: {
            branch: true,
            product: true,
          },
        },
        delivery: {
          include: {
            driver: true,
            vehicle: true,
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error: any) {
    console.error('Fetch orders error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
