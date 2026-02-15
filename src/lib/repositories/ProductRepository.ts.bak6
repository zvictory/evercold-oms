import { Prisma, Product } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import {
  BaseRepository,
  RepositoryError,
} from './BaseRepository'

/**
 * Product with pricing details
 */
export type ProductWithPricing = Product & {
  customerPrices: Array<{
    customerId: string
    customPrice: Prisma.Decimal
  }>
}

/**
 * Product inventory statistics
 */
export interface ProductStats {
  totalProducts: number
  totalInventoryValue: Prisma.Decimal
  averagePrice: Prisma.Decimal
  lowStockCount: number
  outOfStockCount: number
}

/**
 * Repository for Product operations
 */
export class ProductRepository extends BaseRepository<
  Product,
  Prisma.ProductDelegate,
  Prisma.ProductCreateInput,
  Prisma.ProductUpdateInput,
  Prisma.ProductWhereInput,
  Prisma.ProductWhereUniqueInput,
  Prisma.ProductInclude,
  Prisma.ProductSelect,
  Prisma.ProductOrderByWithRelationInput
> {
  protected modelName = 'Product'
  protected delegate: Prisma.ProductDelegate

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.delegate = prisma.product
  }

  protected getDelegate(): Prisma.ProductDelegate {
    return this.prisma.product
  }

  /**
   * Find product by SKU
   *
   * @param sku - Product SKU
   * @returns Product or null
   */
  async findBySku(sku: string): Promise<Product | null> {
    try {
      return await this.prisma.product.findFirst({
        where: { sku },
      })
    } catch (error) {
      throw this.handleError('findBySku', error)
    }
  }

  /**
   * Find product by barcode
   *
   * @param barcode - Product barcode
   * @returns Product or null
   */
  async findByBarcode(barcode: string): Promise<Product | null> {
    try {
      return await this.prisma.product.findFirst({
        where: { barcode },
      })
    } catch (error) {
      throw this.handleError('findByBarcode', error)
    }
  }

  /**
   * Find product by SAP code
   *
   * @param sapCode - SAP product code
   * @returns Product or null
   */
  async findBySapCode(sapCode: string): Promise<Product | null> {
    try {
      return await this.prisma.product.findFirst({
        where: { sapCode },
      })
    } catch (error) {
      throw this.handleError('findBySapCode', error)
    }
  }

  /**
   * Search products by name, SKU, or code
   *
   * @param query - Search query
   * @param limit - Max results
   * @returns Array of products
   */
  async search(query: string, limit?: number): Promise<Product[]> {
    try {
      return await this.prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { sapCode: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('search', error)
    }
  }

  /**
   * Find all active products
   *
   * @returns Array of active products
   */
  async findActive(): Promise<Product[]> {
    try {
      return await this.prisma.product.findMany({
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findActive', error)
    }
  }

  /**
   * Get product statistics
   *
   * @returns Product statistics
   */
  async getProductStats(): Promise<ProductStats> {
    try {
      const products = await this.prisma.product.findMany({
        select: {
          unitPrice: true,
        },
      })

      const totalProducts = products.length
      let totalInventoryValue = new Prisma.Decimal(0)

      for (const p of products) {
        const price = new Prisma.Decimal(p.unitPrice.toString())
        totalInventoryValue = totalInventoryValue.plus(price)
      }

      const averagePrice = totalProducts > 0
        ? new Prisma.Decimal(
            products.reduce((sum, p) => sum + parseFloat(p.unitPrice.toString()), 0) /
              totalProducts
          )
        : new Prisma.Decimal(0)

      return {
        totalProducts,
        totalInventoryValue,
        averagePrice,
        lowStockCount: 0,
        outOfStockCount: 0,
      }
    } catch (error) {
      throw this.handleError('getProductStats', error)
    }
  }

  /**
   * Calculate total amount for order items
   *
   * @param items - Array of product IDs and quantities
   * @returns Total amount
   */
  async calculateOrderAmount(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<Prisma.Decimal> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: items.map((i) => i.productId) },
        },
        select: {
          id: true,
          unitPrice: true,
        },
      })

      let total = new Prisma.Decimal(0)

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)
        if (product) {
          const amount = new Prisma.Decimal(product.unitPrice.toString()).times(
            new Prisma.Decimal(item.quantity)
          )
          total = total.plus(amount)
        }
      }

      return total
    } catch (error) {
      throw this.handleError('calculateOrderAmount', error)
    }
  }
}
