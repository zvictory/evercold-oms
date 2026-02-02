import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const count = await prisma.order.count()

    return NextResponse.json({
      success: true,
      orderCount: count,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 500 }
    )
  }
}
