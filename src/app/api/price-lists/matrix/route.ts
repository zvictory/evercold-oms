import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireManagerOrAdmin, handleAuthError } from '@/lib/auth'

/**
 * GET  — Returns the full Products × Groups price matrix
 * POST — Bulk-save price matrix edits
 */
export async function GET(request: NextRequest) {
  try {
    await requireUser(request)

    const now = new Date()

    const [groups, products, entries] = await Promise.all([
      prisma.customerGroup.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, unitPrice: true, sapCode: true },
      }),
      prisma.priceListEntry.findMany({
        where: {
          effectiveDate: { lte: now },
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
        orderBy: { effectiveDate: 'desc' },
        select: {
          id: true,
          customerGroupId: true,
          productId: true,
          basePrice: true,
        },
      }),
    ])

    // Build lookup: keep only the most recent entry per group+product
    const priceMap: Record<string, { id: string; basePrice: number }> = {}
    for (const e of entries) {
      const key = `${e.customerGroupId}:${e.productId}`
      if (!priceMap[key]) {
        priceMap[key] = { id: e.id, basePrice: e.basePrice }
      }
    }

    return NextResponse.json({ groups, products, priceMap })
  } catch (error: any) {
    console.error('Fetch price matrix error:', error)
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireManagerOrAdmin(request)

    const body = await request.json()
    const { prices } = body as {
      prices: Array<{ customerGroupId: string; productId: string; basePrice: number }>
    }

    if (!prices?.length) {
      return NextResponse.json({ error: 'No prices provided' }, { status: 400 })
    }

    let updated = 0
    const now = new Date()

    for (const p of prices) {
      // Find existing active entry
      const existing = await prisma.priceListEntry.findFirst({
        where: {
          customerGroupId: p.customerGroupId,
          productId: p.productId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
      })

      if (existing) {
        await prisma.priceListEntry.update({
          where: { id: existing.id },
          data: { basePrice: p.basePrice },
        })
      } else {
        await prisma.priceListEntry.create({
          data: {
            customerGroupId: p.customerGroupId,
            productId: p.productId,
            basePrice: p.basePrice,
            currency: 'UZS',
            effectiveDate: now,
          },
        })
      }
      updated++
    }

    return NextResponse.json({ success: true, updated })
  } catch (error: any) {
    console.error('Bulk save price matrix error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save prices' },
      { status: 500 }
    )
  }
}
