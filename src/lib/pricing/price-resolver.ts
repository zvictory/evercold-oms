import { prisma } from '@/lib/prisma'
import type { PriceResult, BatchPriceItem } from './types'

/**
 * Resolve the final price for a product + customer pair.
 *
 * Resolution chain:
 * 1. CustomerProductPrice (individual override) — highest priority
 * 2. PriceListEntry (customer's group, effective & not expired) — mid
 * 3. Product.unitPrice — fallback
 *
 * VAT logic:
 * - taxStatus === 'VAT_PAYER' → vatRate = product.vatRate (typically 12%)
 * - taxStatus === 'EXEMPT'    → vatRate = 0
 */
export async function calculateFinalPrice(
  productId: string,
  customerId: string
): Promise<PriceResult> {
  // Fetch customer (with group) and product in parallel
  const [customer, product] = await Promise.all([
    prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      select: {
        taxStatus: true,
        customerGroupId: true,
      },
    }),
    prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: {
        unitPrice: true,
        vatRate: true,
      },
    }),
  ])

  const vatRate = customer.taxStatus === 'VAT_PAYER' ? product.vatRate : 0

  // 1. Check individual customer override
  const override = await prisma.customerProductPrice.findUnique({
    where: {
      customerId_productId: { customerId, productId },
    },
    select: { unitPrice: true },
  })

  if (override) {
    return buildResult(override.unitPrice, vatRate, 'CUSTOMER_OVERRIDE')
  }

  // 2. Check group price list
  if (customer.customerGroupId) {
    const now = new Date()
    const groupPrice = await prisma.priceListEntry.findFirst({
      where: {
        customerGroupId: customer.customerGroupId,
        productId,
        effectiveDate: { lte: now },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { effectiveDate: 'desc' },
      select: { basePrice: true, currency: true },
    })

    if (groupPrice) {
      return buildResult(groupPrice.basePrice, vatRate, 'GROUP_PRICE_LIST', groupPrice.currency)
    }
  }

  // 3. Fall back to product base price
  return buildResult(product.unitPrice, vatRate, 'PRODUCT_BASE')
}

/**
 * Batch-resolve prices for multiple items belonging to the same customer.
 * More efficient than calling calculateFinalPrice() in a loop because it
 * loads customer data once and batches the override query.
 */
export async function calculateBatchPrices(
  items: BatchPriceItem[],
  customerId: string
): Promise<Map<string, PriceResult>> {
  const productIds = [...new Set(items.map((i) => i.productId))]

  // Load customer + all products + all overrides in parallel
  const [customer, products, overrides, groupPrices] = await Promise.all([
    prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      select: { taxStatus: true, customerGroupId: true },
    }),
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, unitPrice: true, vatRate: true },
    }),
    prisma.customerProductPrice.findMany({
      where: { customerId, productId: { in: productIds } },
      select: { productId: true, unitPrice: true },
    }),
    // Pre-fetch — resolved below only if customer has a group
    Promise.resolve(null as Awaited<ReturnType<typeof fetchGroupPrices>> | null),
  ])

  // Fetch group prices if customer belongs to a group
  let groupPriceMap = new Map<string, { basePrice: number; currency: string }>()
  if (customer.customerGroupId) {
    const gp = await fetchGroupPrices(customer.customerGroupId, productIds)
    groupPriceMap = gp
  }

  // Build lookup maps
  const productMap = new Map(products.map((p) => [p.id, p]))
  const overrideMap = new Map(overrides.map((o) => [o.productId, o.unitPrice]))

  const results = new Map<string, PriceResult>()

  for (const pid of productIds) {
    const product = productMap.get(pid)
    if (!product) continue

    const vatRate = customer.taxStatus === 'VAT_PAYER' ? product.vatRate : 0

    // 1. Individual override
    const overridePrice = overrideMap.get(pid)
    if (overridePrice !== undefined) {
      results.set(pid, buildResult(overridePrice, vatRate, 'CUSTOMER_OVERRIDE'))
      continue
    }

    // 2. Group price list
    const groupEntry = groupPriceMap.get(pid)
    if (groupEntry) {
      results.set(pid, buildResult(groupEntry.basePrice, vatRate, 'GROUP_PRICE_LIST', groupEntry.currency))
      continue
    }

    // 3. Product base price
    results.set(pid, buildResult(product.unitPrice, vatRate, 'PRODUCT_BASE'))
  }

  return results
}

// ── Helpers ────────────────────────────────────────────────

function buildResult(
  netPrice: number,
  vatRate: number,
  priceSource: PriceResult['priceSource'],
  currency = 'UZS'
): PriceResult {
  const vatAmount = netPrice * (vatRate / 100)
  return {
    netPrice,
    vatRate,
    vatAmount,
    grossPrice: netPrice + vatAmount,
    priceSource,
    currency,
  }
}

async function fetchGroupPrices(
  customerGroupId: string,
  productIds: string[]
): Promise<Map<string, { basePrice: number; currency: string }>> {
  const now = new Date()

  const entries = await prisma.priceListEntry.findMany({
    where: {
      customerGroupId,
      productId: { in: productIds },
      effectiveDate: { lte: now },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    orderBy: { effectiveDate: 'desc' },
    select: { productId: true, basePrice: true, currency: true },
  })

  // Keep only the most recent entry per product (entries are ordered desc)
  const map = new Map<string, { basePrice: number; currency: string }>()
  for (const entry of entries) {
    if (!map.has(entry.productId)) {
      map.set(entry.productId, { basePrice: entry.basePrice, currency: entry.currency })
    }
  }
  return map
}
