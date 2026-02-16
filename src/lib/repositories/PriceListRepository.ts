import { Prisma, PriceListEntry } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import { BaseRepository } from './BaseRepository'

export type PriceListEntryWithProduct = PriceListEntry & {
  product: { id: string; name: string; unitPrice: number; sapCode: string | null }
}

export class PriceListRepository extends BaseRepository<
  PriceListEntry,
  Prisma.PriceListEntryDelegate,
  Prisma.PriceListEntryCreateInput,
  Prisma.PriceListEntryUpdateInput,
  Prisma.PriceListEntryWhereInput,
  Prisma.PriceListEntryWhereUniqueInput,
  Prisma.PriceListEntryInclude,
  Prisma.PriceListEntrySelect,
  Prisma.PriceListEntryOrderByWithRelationInput
> {
  protected modelName = 'PriceListEntry'
  protected delegate: Prisma.PriceListEntryDelegate

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.delegate = prisma.priceListEntry
  }

  protected getDelegate(): Prisma.PriceListEntryDelegate {
    return this.prisma.priceListEntry
  }

  /**
   * Get all active price entries for a customer group
   */
  async findByGroup(customerGroupId: string): Promise<PriceListEntryWithProduct[]> {
    const now = new Date()
    return this.prisma.priceListEntry.findMany({
      where: {
        customerGroupId,
        effectiveDate: { lte: now },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      include: {
        product: {
          select: { id: true, name: true, unitPrice: true, sapCode: true },
        },
      },
      orderBy: { product: { name: 'asc' } },
    }) as unknown as PriceListEntryWithProduct[]
  }

  /**
   * Get all price entries for a product across all groups
   */
  async findByProduct(productId: string) {
    const now = new Date()
    return this.prisma.priceListEntry.findMany({
      where: {
        productId,
        effectiveDate: { lte: now },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      include: {
        customerGroup: {
          select: { id: true, name: true },
        },
      },
      orderBy: { customerGroup: { sortOrder: 'asc' } },
    })
  }

  /**
   * Build a full price matrix: products × groups
   */
  async getMatrix() {
    const now = new Date()

    const [groups, products, entries] = await Promise.all([
      this.prisma.customerGroup.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true },
      }),
      this.prisma.product.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, unitPrice: true, sapCode: true },
      }),
      this.prisma.priceListEntry.findMany({
        where: {
          effectiveDate: { lte: now },
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
        orderBy: { effectiveDate: 'desc' },
        select: {
          customerGroupId: true,
          productId: true,
          basePrice: true,
        },
      }),
    ])

    // Build lookup: "groupId:productId" → basePrice (keep most recent)
    const priceMap = new Map<string, number>()
    for (const e of entries) {
      const key = `${e.customerGroupId}:${e.productId}`
      if (!priceMap.has(key)) {
        priceMap.set(key, e.basePrice)
      }
    }

    return { groups, products, priceMap }
  }

  /**
   * Upsert a price list entry for a group + product combination.
   * Uses the current timestamp as effectiveDate.
   */
  async upsertPrice(
    customerGroupId: string,
    productId: string,
    basePrice: number,
    currency = 'UZS'
  ): Promise<PriceListEntry> {
    const effectiveDate = new Date()

    // Try to find an existing active entry
    const existing = await this.prisma.priceListEntry.findFirst({
      where: {
        customerGroupId,
        productId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: effectiveDate } },
        ],
      },
    })

    if (existing) {
      return this.prisma.priceListEntry.update({
        where: { id: existing.id },
        data: { basePrice, currency },
      })
    }

    return this.prisma.priceListEntry.create({
      data: {
        customerGroupId,
        productId,
        basePrice,
        currency,
        effectiveDate,
      },
    })
  }

  /**
   * Bulk upsert prices for a group (used by the Price Matrix save-all action)
   */
  async bulkUpsert(
    prices: Array<{ customerGroupId: string; productId: string; basePrice: number }>
  ): Promise<number> {
    let count = 0
    for (const p of prices) {
      await this.upsertPrice(p.customerGroupId, p.productId, p.basePrice)
      count++
    }
    return count
  }
}
