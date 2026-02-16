import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireManagerOrAdmin, handleAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireUser(request)

    const { searchParams } = new URL(request.url)
    const customerGroupId = searchParams.get('customerGroupId')
    const productId = searchParams.get('productId')

    const now = new Date()
    const where: any = {
      effectiveDate: { lte: now },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    }

    if (customerGroupId) where.customerGroupId = customerGroupId
    if (productId) where.productId = productId

    const entries = await prisma.priceListEntry.findMany({
      where,
      include: {
        customerGroup: {
          select: { id: true, name: true },
        },
        product: {
          select: { id: true, name: true, unitPrice: true, sapCode: true },
        },
      },
      orderBy: [
        { customerGroup: { sortOrder: 'asc' } },
        { product: { name: 'asc' } },
      ],
    })

    return NextResponse.json(entries)
  } catch (error: any) {
    console.error('Fetch price lists error:', error)
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireManagerOrAdmin(request)

    const body = await request.json()

    if (!body.customerGroupId || !body.productId || body.basePrice == null) {
      return NextResponse.json(
        { error: 'customerGroupId, productId, and basePrice are required' },
        { status: 400 }
      )
    }

    // Check if an active entry already exists → update it instead
    const now = new Date()
    const existing = await prisma.priceListEntry.findFirst({
      where: {
        customerGroupId: body.customerGroupId,
        productId: body.productId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
    })

    if (existing) {
      const updated = await prisma.priceListEntry.update({
        where: { id: existing.id },
        data: {
          basePrice: body.basePrice,
          currency: body.currency || 'UZS',
        },
      })
      return NextResponse.json(updated)
    }

    const entry = await prisma.priceListEntry.create({
      data: {
        customerGroupId: body.customerGroupId,
        productId: body.productId,
        basePrice: body.basePrice,
        currency: body.currency || 'UZS',
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : now,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error: any) {
    console.error('Create price list entry error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create price list entry' },
      { status: 500 }
    )
  }
}
