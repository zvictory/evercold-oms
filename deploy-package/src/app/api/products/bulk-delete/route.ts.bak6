import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one product ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const { ids } = bulkDeleteSchema.parse(body)

    // Soft delete by setting isActive = false
    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} products deleted successfully`,
    })
  } catch (error: any) {
    console.error('Bulk delete products error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors?.[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete products' },
      { status: 500 }
    )
  }
}
