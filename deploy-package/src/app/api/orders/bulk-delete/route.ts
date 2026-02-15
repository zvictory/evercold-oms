import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderIds } = body

    // Validation
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs are required' },
        { status: 400 }
      )
    }

    // Use transaction for atomicity (all-or-nothing deletion)
    const result = await prisma.$transaction(async (tx) => {
      // Delete orders (OrderItems cascade automatically via schema)
      const deleteResult = await tx.order.deleteMany({
        where: { id: { in: orderIds } }
      })

      return {
        success: true,
        deletedCount: deleteResult.count
      }
    })

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete orders' },
      { status: 500 }
    )
  }
}
