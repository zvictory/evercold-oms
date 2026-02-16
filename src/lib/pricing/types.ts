/**
 * Price resolution types for the 3-tier pricing system.
 *
 * Resolution chain (highest priority first):
 * 1. CUSTOMER_OVERRIDE — CustomerProductPrice (individual customer override)
 * 2. GROUP_PRICE_LIST  — PriceListEntry (customer group price)
 * 3. PRODUCT_BASE      — Product.unitPrice (default catalog price)
 */

export type PriceSource = 'CUSTOMER_OVERRIDE' | 'GROUP_PRICE_LIST' | 'PRODUCT_BASE'

export interface PriceResult {
  /** Net price before VAT */
  netPrice: number
  /** VAT rate: 0 for EXEMPT, product.vatRate for VAT_PAYER */
  vatRate: number
  /** Calculated VAT amount */
  vatAmount: number
  /** Gross price including VAT */
  grossPrice: number
  /** Which tier supplied the price */
  priceSource: PriceSource
  /** Currency code */
  currency: string
}

export interface BatchPriceItem {
  productId: string
}
