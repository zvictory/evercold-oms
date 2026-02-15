import { Prisma, Customer } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import {
  BaseRepository,
  type PaginationOptions,
  type PaginatedResult,
  RepositoryError,
} from './BaseRepository'

/**
 * Customer with all branches included
 */
export type CustomerWithBranches = Customer & {
  branches: Array<{
    id: string
    branchCode: string
    branchName: string
    deliveryAddress: string | null
  }>
}

/**
 * Customer statistics
 */
export interface CustomerStats {
  customerId: string
  customerName: string
  totalOrders: number
  totalOrderAmount: Prisma.Decimal
  averageOrderValue: Prisma.Decimal
  branchCount: number
  lastOrderDate: Date | null
}

/**
 * Customer search result
 */
export interface CustomerSearchResult {
  id: string
  customerCode: string | null
  name: string
  phone: string | null
  contactPerson: string | null
  branchCount: number
}

/**
 * Repository for Customer operations with domain-specific queries
 */
export class CustomerRepository extends BaseRepository<
  Customer,
  Prisma.CustomerDelegate,
  Prisma.CustomerCreateInput,
  Prisma.CustomerUpdateInput,
  Prisma.CustomerWhereInput,
  Prisma.CustomerWhereUniqueInput,
  Prisma.CustomerInclude,
  Prisma.CustomerSelect,
  Prisma.CustomerOrderByWithRelationInput
> {
  protected modelName = 'Customer'
  protected delegate: Prisma.CustomerDelegate

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.delegate = prisma.customer
  }

  protected getDelegate(): Prisma.CustomerDelegate {
    return this.prisma.customer
  }

  /**
   * Find customer by code
   *
   * @param code - Customer code
   * @returns Customer or null
   */
  async findByCode(code: string): Promise<Customer | null> {
    try {
      return await this.prisma.customer.findFirst({
        where: { customerCode: code },
      })
    } catch (error) {
      throw this.handleError('findByCode', error)
    }
  }

  /**
   * Find customers by name with partial matching
   *
   * @param name - Customer name (partial match)
   * @param limit - Max results
   * @returns Array of customers
   */
  async findByName(name: string, limit?: number): Promise<Customer[]> {
    try {
      return await this.prisma.customer.findMany({
        where: {
          name: {
            contains: name,
          },
        },
        take: limit,
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByName', error)
    }
  }

  /**
   * Find customer by INN (tax ID)
   *
   * @param inn - Customer INN
   * @returns Customer or null
   */
  async findByInn(inn: string): Promise<Customer | null> {
    try {
      return await this.prisma.customer.findFirst({
        where: { inn },
      })
    } catch (error) {
      throw this.handleError('findByInn', error)
    }
  }

  /**
   * Find all active customers
   *
   * @returns Array of active customers
   */
  async findActive(): Promise<Customer[]> {
    try {
      return await this.prisma.customer.findMany({
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findActive', error)
    }
  }

  /**
   * Find customers with specific branch
   *
   * @param branchId - Branch ID
   * @returns Array of customers
   */
  async findByBranch(branchId: string): Promise<Customer[]> {
    try {
      return await this.prisma.customer.findMany({
        where: {
          branches: {
            some: { id: branchId },
          },
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByBranch', error)
    }
  }

  /**
   * Get customer with all branches
   *
   * @param customerId - Customer ID
   * @returns Customer with branches or null
   */
  async findWithBranches(customerId: string): Promise<CustomerWithBranches | null> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          branches: {
            select: {
              id: true,
              branchCode: true,
              branchName: true,
              deliveryAddress: true,
            },
          },
        },
      })

      return customer as CustomerWithBranches | null
    } catch (error) {
      throw this.handleError('findWithBranches', error)
    }
  }

  /**
   * Search customers by code, name, or INN
   *
   * @param query - Search query
   * @param limit - Max results
   * @returns Array of search results
   */
  async search(query: string, limit?: number): Promise<CustomerSearchResult[]> {
    try {
      const customers = await this.prisma.customer.findMany({
        where: {
          OR: [
            { customerCode: { contains: query } },
            { name: { contains: query } },
            { inn: { contains: query } },
          ],
        },
        select: {
          id: true,
          customerCode: true,
          name: true,
          phone: true,
          contactPerson: true,
          _count: { select: { branches: true } },
        },
        take: limit,
        orderBy: { name: 'asc' },
      })

      return customers.map((c) => ({
        id: c.id,
        customerCode: c.customerCode,
        name: c.name,
        phone: c.phone,
        contactPerson: c.contactPerson,
        branchCount: c._count.branches,
      }))
    } catch (error) {
      throw this.handleError('search', error)
    }
  }

  /**
   * Get customer statistics
   *
   * @param customerId - Customer ID
   * @returns Customer statistics
   */
  async getCustomerStats(customerId: string): Promise<CustomerStats> {
    try {
      const customer = await this.prisma.customer.findUniqueOrThrow({
        where: { id: customerId },
        include: {
          orders: {
            select: {
              totalAmount: true,
              orderDate: true,
            },
          },
          branches: {
            select: { id: true },
          },
        },
      })

      const totalOrders = customer.orders.length
      const totalOrderAmount = customer.orders.reduce((sum, order) => {
        return sum.plus(order.totalAmount)
      }, new Prisma.Decimal(0))
      const averageOrderValue = totalOrders > 0
        ? new Prisma.Decimal(totalOrderAmount.toNumber() / totalOrders)
        : new Prisma.Decimal(0)
      const lastOrderDate = customer.orders.length > 0
        ? new Date(Math.max(...customer.orders.map((o) => o.orderDate.getTime())))
        : null

      return {
        customerId,
        customerName: customer.name,
        totalOrders,
        totalOrderAmount,
        averageOrderValue,
        branchCount: customer.branches.length,
        lastOrderDate,
      }
    } catch (error) {
      throw this.handleError('getCustomerStats', error)
    }
  }

  /**
   * Find customers assigned to account manager
   *
   * @param managerId - Account manager ID
   * @returns Array of customers
   */
  async findByAccountManager(managerId: string): Promise<Customer[]> {
    try {
      return await this.prisma.customer.findMany({
        where: { accountManager: managerId } as any,
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByAccountManager', error)
    }
  }

  /**
   * Update customer credit status
   *
   * @param customerId - Customer ID
   * @param creditLimit - New credit limit
   * @param currentDebt - Current debt amount
   * @returns Updated customer
   */
  async updateCreditStatus(
    customerId: string,
    creditLimit: number | Prisma.Decimal,
    currentDebt: number | Prisma.Decimal
  ): Promise<Customer> {
    try {
      const limitDecimal = typeof creditLimit === 'number'
        ? new Prisma.Decimal(creditLimit)
        : creditLimit

      const debtDecimal = typeof currentDebt === 'number'
        ? new Prisma.Decimal(currentDebt)
        : currentDebt

      return await this.prisma.customer.update({
        where: { id: customerId },
        data: {
          creditLimit: limitDecimal,
          currentDebt: debtDecimal,
        } as any,
      })
    } catch (error) {
      throw this.handleError('updateCreditStatus', error)
    }
  }
}
