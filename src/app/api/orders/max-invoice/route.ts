import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/orders/max-invoice
 * Returns the highest invoice number in the database
 * Used to suggest starting invoice number for new order imports
 */
export async function GET() {
  try {
    const maxOrder = await prisma.order.findFirst({
      where: {
        invoiceNumber: { not: null }
      },
      orderBy: {
        invoiceNumber: 'desc'
      },
      select: {
        invoiceNumber: true
      }
    })

    return NextResponse.json({
      maxInvoice: maxOrder?.invoiceNumber || 0
    })
  } catch (error: any) {
    console.error('Failed to fetch max invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch max invoice number' },
      { status: 500 }
    )
  }
}
