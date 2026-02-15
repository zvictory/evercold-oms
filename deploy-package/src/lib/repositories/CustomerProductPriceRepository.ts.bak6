import { Prisma, CustomerProductPrice } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import {
  BaseRepository,
  RepositoryError,
} from './BaseRepository'

/**
 * Custom price with product details
 */
export type CustomPriceWithProduct = CustomerProductPrice & {
  product: {
    id: string
    name: string
    unitPrice: Prisma.Decimal
  }
}

/**
 * Price adjustment info
 */
export interface PriceAdjustment {
  productId: string
  productName: string
  defaultPrice: Prisma.Decimal
  customPrice: Prisma.Decimal
  discountPercentage: number
  discountAmount: Prisma.Decimal
}

/**
 * Repository for CustomerProductPrice operations
 */
export class CustomerProductPriceRepository extends BaseRepository<
  CustomerProductPrice,
  Prisma.CustomerProductPriceDelegate,
  Prisma.CustomerProductPriceCreateInput,
  Prisma.CustomerProductPriceUpdateInput,
  Prisma.CustomerProductPriceWhereInput,
  Prisma.CustomerProductPriceWhereUniqueInput,
  Prisma.CustomerProductPriceInclude,
  Prisma.CustomerProductPriceSelect,
  Prisma.CustomerProductPriceOrderByWithRelationInput
> {
  protected modelName = 'CustomerProductPrice'
  protected delegate: Prisma.CustomerProductPriceDelegate

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.delegate = prisma.customerProductPrice
  }

  protected getDelegate(): Prisma.CustomerProductPriceDelegate {
    return this.prisma.customerProductPrice
  }

  /**
   * Get custom price for specific product
   *
   * @param customerId - Customer ID
   * @param productId - Product ID
   * @returns Custom price or null
   */
  async findByCustomerAndProduct(
    customerId: string,
    productId: string
  ): Promise<CustomerProductPrice | null> {
    try {
      return await this.prisma.customerProductPrice.findUnique({
        where: {
          customerId_productId: { customerId, productId },
        },
      })
    } catch (error) {
      throw this.handleError('findByCustomerAndProduct', error)
    }
  }

  /**
   * Get all custom prices for customer
   *
   * @param customerId - Customer ID
   * @returns Array of custom prices with product info
   */
  async findByCustomer(customerId: string): Promise<CustomPriceWithProduct[]> {
    try {
      const prices = await this.prisma.customerProductPrice.findMany({
        where: { customerId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unitPrice: true,
            },
          },
        },
        orderBy: { product: { name: 'asc' } },
      })

      return prices.map((p) => ({
        ...p,
        product: {
          ...p.product,
          unitPrice: new Prisma.Decimal(p.product.unitPrice.toString()),
        },
      })) as CustomPriceWithProduct[]
    } catch (error) {
      throw this.handleError('findByCustomer', error)
    }
  }

  /**
   * Find all customers with custom price for product
   *
   * @param productId - Product ID
   * @returns Array of custom prices
   */
  async findByProduct(productId: string): Promise<CustomerProductPrice[]> {
    try {
      return await this.prisma.customerProductPrice.findMany({
        where: { productId },
        orderBy: { customer: { name: 'asc' } },
      })
    } catch (error) {
      throw this.handleError('findByProduct', error)
    }
  }

  /**
   * Check if custom price exists
   *
   * @param customerId - Customer ID
   * @param productId - Product ID
   * @returns True if custom price exists
   */
  async hasCustomPrice(
    customerId: string,
    productId: string
  ): Promise<boolean> {
    try {
      const price = await this.prisma.customerProductPrice.findUnique({
        where: {
          customerId_productId: { customerId, productId },
        },
      })

      return !!price
    } catch (error) {
      throw this.handleError('hasCustomPrice', error)
    }
  }

  /**
   * Get price for customer (custom or default)
   *
   * @param customerId - Customer ID
   * @param productId - Product ID
   * @param defaultPrice - Default price if no custom price
   * @returns Custom price or default
   */
  async getPriceForCustomer(
    customerId: string,
    productId: string,
    defaultPrice?: Prisma.Decimal
  ): Promise<Prisma.Decimal> {
    try {
      const customPrice = await this.findByCustomerAndProduct(
        customerId,
        productId
      )

      if (customPrice) {
        return new Prisma.Decimal((customPrice as any).customPrice.toString())
      }

      if (defaultPrice) {
        return defaultPrice
      }

      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { unitPrice: true },
      })

      if (!product) {
        throw new RepositoryError(
          'Product not found',
          'NOT_FOUND'
        )
      }

      return new Prisma.Decimal(product.unitPrice.toString())
    } catch (error) {
      throw this.handleError('getPriceForCustomer', error)
    }
  }

  /**
   * Set or update custom price
   *
   * @param customerId - Customer ID
   * @param productId - Product ID
   * @param customPrice - Custom price value
   * @returns Updated price record
   */
  async setCustomPrice(
    customerId: string,
    productId: string,
    customPrice: number | Prisma.Decimal
  ): Promise<CustomerProductPrice> {
    try {
      const priceNum = typeof customPrice === 'number'
        ? customPrice
        : parseFloat(customPrice.toString())

      const existing = await this.findByCustomerAndProduct(customerId, productId)

      if (existing) {
        return await this.prisma.customerProductPrice.update({
          where: {
            customerId_productId: { customerId, productId },
          },
          data: { customPrice: priceNum } as any,
        })
      } else {
        return await this.prisma.customerProductPrice.create({
          data: {
            customerId,
            productId,
            customPrice: priceNum,
          } as any,
        })
      }
    } catch (error) {
      throw this.handleError('setCustomPrice', error)
    }
  }

  /**
   * Bulk update prices for customer
   *
   * @param customerId - Customer ID
   * @param prices - Array of product prices
   * @returns Number of updated records
   */
  async bulkSetPrices(
    customerId: string,
    prices: Array<{ productId: string; customPrice: number }>
  ): Promise<number> {
    try {
      let count = 0

      for (const price of prices) {
        await this.setCustomPrice(
          customerId,
          price.productId,
          price.customPrice
        )
        count++
      }

      return count
    } catch (error) {
      throw this.handleError('bulkSetPrices', error)
    }
  }

  /**
   * Remove custom price (revert to default)
   *
   * @param customerId - Customer ID
   * @param productId - Product ID
   * @returns True if deleted
   */
  async removeCustomPrice(
    customerId: string,
    productId: string
  ): Promise<boolean> {
    try {
      const result = await this.prisma.customerProductPrice.delete({
        where: {
          customerId_productId: { customerId, productId },
        },
      })

      return !!result
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return false
        }
      }
      throw this.handleError('removeCustomPrice', error)
    }
  }

  /**
   * Calculate discount percentage
   *
   * @param customerId - Customer ID
   * @param productId - Product ID
   * @param defaultPrice - Default product price
   * @returns Discount percentage (0-100)
   */
  async getPriceAdjustmentPercentage(
    customerId: string,
    productId: string,
    defaultPrice: Prisma.Decimal
  ): Promise<number> {
    try {
      const customPrice = await this.getPriceForCustomer(
        customerId,
        productId,
        defaultPrice
      )

      const defaultNum = new Prisma.Decimal(defaultPrice.toString()).toNumber()
      const customNum = new Prisma.Decimal(customPrice.toString()).toNumber()

      if (defaultNum === 0) return 0

      return ((defaultNum - customNum) / defaultNum) * 100
    } catch (error) {
      throw this.handleError('getPriceAdjustmentPercentage', error)
    }
  }
}
