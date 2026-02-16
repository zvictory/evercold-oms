import { NextRequest, NextResponse } from 'next/server'
import { calculateFinalPrice } from '@/lib/pricing'
import { requireUser, handleAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireUser(request)

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const customerId = searchParams.get('customerId')

    if (!productId || !customerId) {
      return NextResponse.json(
        { error: 'productId and customerId are required' },
        { status: 400 }
      )
    }

    const result = await calculateFinalPrice(productId, customerId)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Resolve price error:', error)

    if (error.name === 'NotFoundError' || error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Product or customer not found' },
        { status: 404 }
      )
    }

    return handleAuthError(error)
  }
}
