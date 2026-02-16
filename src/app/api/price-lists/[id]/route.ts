import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireManagerOrAdmin } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManagerOrAdmin(request)
    const { id } = await params
    const body = await request.json()

    const entry = await prisma.priceListEntry.update({
      where: { id },
      data: {
        basePrice: body.basePrice,
        currency: body.currency,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      },
    })

    return NextResponse.json(entry)
  } catch (error: any) {
    console.error('Update price list entry error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update entry' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManagerOrAdmin(request)
    const { id } = await params

    await prisma.priceListEntry.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete price list entry error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete entry' },
      { status: 500 }
    )
  }
}
