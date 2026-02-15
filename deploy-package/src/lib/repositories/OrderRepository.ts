import { Prisma, Order, OrderStatus } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import {
  BaseRepository,
  type TransactionClient,
  type PaginationOptions,
  type PaginatedResult,
  RepositoryError,
} from './BaseRepository'

/**
 * Order with all relations included
 */
export type OrderWithRelations = Order & {
  customer: {
    id: string
    name: string
    phone: string | null
  }
  orderItems: Array<{
    id: string
    sapCode: string | null
    quantity: number
    unitPrice: Prisma.Decimal
  }>
}

/**
 * Simplified order for list views
 */
export interface OrderListItem {
  id: string
  orderNumber: string
  orderDate: Date
  status: OrderStatus
  totalAmount: Prisma.Decimal
  customer: {
    id: string
    name: string
  }
  itemCount: number
}

/**
 * Order statistics aggregation
 */
export interface OrderStatistics {
  totalOrders: number
  totalRevenue: Prisma.Decimal
  averageOrderValue: Prisma.Decimal
  statusBreakdown: Record<OrderStatus, number>
}

/**
 * Filter options for order queries
 */
export interface OrderFilters {
  status?: OrderStatus | OrderStatus[]
  customerId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
}

/**
 * Input for creating a new order
 */
export interface CreateOrderInput {
  orderNumber: string
  orderDate: Date
  status?: OrderStatus
  customerId: string
  totalAmount: number | Prisma.Decimal
}

/**
 * Repository for Order operations with domain-specific queries
 */
export class OrderRepository extends BaseRepository<
  Order,
  Prisma.OrderDelegate,
  Prisma.OrderCreateInput,
  Prisma.OrderUpdateInput,
  Prisma.OrderWhereInput,
  Prisma.OrderWhereUniqueInput,
  Prisma.OrderInclude,
  Prisma.OrderSelect,
  Prisma.OrderOrderByWithRelationInput
> {
  protected modelName = 'Order'
  protected delegate: Prisma.OrderDelegate

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.delegate = prisma.order
  }

  protected getDelegate(client?: TransactionClient): Prisma.OrderDelegate {
    return client ? (client as any).order : this.prisma.order
  }

  /**
   * Find order by ID with all relations
   *
   * @param id - Order ID
   * @returns Order with customer and items, or null
   */
  async findByIdWithRelations(id: string): Promise<OrderWithRelations | null> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          orderItems: {
            select: {
              id: true,
              sapCode: true,
              quantity: true,
              unitPrice: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })

      if (!order) return null

      return {
        ...order,
        orderItems: order.orderItems.map((item) => ({
          ...item,
          unitPrice: new Prisma.Decimal(item.unitPrice.toString()),
        })),
      } as OrderWithRelations
    } catch (error) {
      throw this.handleError('findByIdWithRelations', error)
    }
  }

  /**
   * Find order by order number
   *
   * @param orderNumber - Unique order number
   * @returns Order with relations, or null
   */
  async findByOrderNumber(orderNumber: string): Promise<OrderWithRelations | null> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { orderNumber },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          orderItems: {
            select: {
              id: true,
              sapCode: true,
              quantity: true,
              unitPrice: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })

      if (!order) return null

      return {
        ...order,
        orderItems: order.orderItems.map((item) => ({
          ...item,
          unitPrice: new Prisma.Decimal(item.unitPrice.toString()),
        })),
      } as OrderWithRelations
    } catch (error) {
      throw this.handleError('findByOrderNumber', error)
    }
  }

  /**
   * Find orders with filters and pagination
   *
   * @param filters - Filter criteria
   * @param pagination - Pagination options
   * @returns Paginated list of orders
   */
  async findWithFilters(
    filters: OrderFilters = {},
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<OrderListItem>> {
    try {
      const where = this.buildWhereClause(filters)
      const orderBy: Prisma.OrderOrderByWithRelationInput = {
        orderDate: 'desc',
      }

      const page = pagination?.page ?? 1
      const pageSize = pagination?.pageSize ?? 50
      const skip = (page - 1) * pageSize

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
          select: {
            id: true,
            orderNumber: true,
            orderDate: true,
            status: true,
            totalAmount: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                orderItems: true,
              },
            },
          },
        }),
        this.prisma.order.count({ where }),
      ])

      const data: OrderListItem[] = orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        status: order.status,
        totalAmount: new Prisma.Decimal(order.totalAmount.toString()),
        customer: order.customer,
        itemCount: order._count.orderItems,
      }))

      const totalPages = Math.ceil(total / pageSize)

      return {
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      throw this.handleError('findWithFilters', error)
    }
  }

  /**
   * Find orders by customer ID
   *
   * @param customerId - Customer ID
   * @param limit - Maximum number of orders to return
   * @returns Array of orders for the customer
   */
  async findByCustomer(
    customerId: string,
    limit?: number
  ): Promise<OrderWithRelations[]> {
    try {
      const orders = await this.prisma.order.findMany({
        where: { customerId },
        orderBy: { orderDate: 'desc' },
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          orderItems: {
            select: {
              id: true,
              sapCode: true,
              quantity: true,
              unitPrice: true,
            },
          },
        },
      })

      return orders.map((order) => ({
        ...order,
        orderItems: order.orderItems.map((item) => ({
          ...item,
          unitPrice: new Prisma.Decimal(item.unitPrice.toString()),
        })),
      })) as OrderWithRelations[]
    } catch (error) {
      throw this.handleError('findByCustomer', error)
    }
  }

  /**
   * Find orders by status
   *
   * @param status - Order status or array of statuses
   * @param limit - Maximum number of orders to return
   * @returns Array of orders with matching status
   */
  async findByStatus(
    status: OrderStatus | OrderStatus[],
    limit?: number
  ): Promise<OrderListItem[]> {
    try {
      const statusArray = Array.isArray(status) ? status : [status]

      const orders = await this.prisma.order.findMany({
        where: {
          status: { in: statusArray },
        },
        orderBy: { orderDate: 'desc' },
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          orderDate: true,
          status: true,
          totalAmount: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      })

      return orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        status: order.status,
        totalAmount: new Prisma.Decimal(order.totalAmount.toString()),
        customer: order.customer,
        itemCount: order._count.orderItems,
      }))
    } catch (error) {
      throw this.handleError('findByStatus', error)
    }
  }

  /**
   * Find orders by date range
   *
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @returns Array of orders in date range
   */
  async findByDateRange(
    dateFrom: Date,
    dateTo: Date
  ): Promise<OrderListItem[]> {
    try {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)

      const orders = await this.prisma.order.findMany({
        where: {
          orderDate: {
            gte: dateFrom,
            lte: endDate,
          },
        },
        orderBy: { orderDate: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          orderDate: true,
          status: true,
          totalAmount: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      })

      return orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        status: order.status,
        totalAmount: new Prisma.Decimal(order.totalAmount.toString()),
        customer: order.customer,
        itemCount: order._count.orderItems,
      }))
    } catch (error) {
      throw this.handleError('findByDateRange', error)
    }
  }

  /**
   * Create a new order
   *
   * @param input - Order creation data
   * @returns Created order with relations
   */
  async createOrder(input: CreateOrderInput): Promise<OrderWithRelations> {
    try {
      const totalAmount = typeof input.totalAmount === 'number'
        ? input.totalAmount
        : parseFloat(input.totalAmount.toString())

      const order = await this.prisma.order.create({
        data: {
          orderNumber: input.orderNumber,
          orderDate: input.orderDate,
          status: input.status ?? 'NEW',
          totalAmount,
          customerId: input.customerId,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          orderItems: {
            select: {
              id: true,
              sapCode: true,
              quantity: true,
              unitPrice: true,
            },
          },
        },
      })

      return {
        ...order,
        orderItems: order.orderItems.map((item) => ({
          ...item,
          unitPrice: new Prisma.Decimal(item.unitPrice.toString()),
        })),
      } as OrderWithRelations
    } catch (error) {
      throw this.handleError('createOrder', error)
    }
  }

  /**
   * Update order status
   *
   * @param id - Order ID
   * @param status - New order status
   * @returns Updated order
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    try {
      return await this.prisma.order.update({
        where: { id },
        data: { status },
      })
    } catch (error) {
      throw this.handleError('updateStatus', error)
    }
  }

  /**
   * Get order statistics for date range
   *
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @returns Aggregated order statistics
   */
  async getStatistics(
    dateFrom: Date,
    dateTo: Date
  ): Promise<OrderStatistics> {
    try {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)

      const where: Prisma.OrderWhereInput = {
        orderDate: {
          gte: dateFrom,
          lte: endDate,
        },
      }

      const [
        totalOrders,
        aggregations,
        statusCounts,
      ] = await Promise.all([
        this.prisma.order.count({ where }),
        this.prisma.order.aggregate({
          where,
          _sum: {
            totalAmount: true,
          },
        }),
        this.prisma.order.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
      ])

      const totalRevenueValue = aggregations._sum.totalAmount ?? new Prisma.Decimal(0)
      const totalRevenue = totalRevenueValue instanceof Prisma.Decimal
        ? totalRevenueValue
        : new Prisma.Decimal(totalRevenueValue)
      const averageOrderValue = totalOrders > 0
        ? new Prisma.Decimal(totalRevenue.toString()).toNumber() / totalOrders
        : 0

      const statusBreakdown: Record<OrderStatus, number> = {
        NEW: 0,
        CONFIRMED: 0,
        PICKING: 0,
        PACKING: 0,
        READY: 0,
        SHIPPED: 0,
        PARTIAL: 0,
        COMPLETED: 0,
        INVOICED: 0,
        PAID: 0,
        CANCELLED: 0,
      }

      for (const item of statusCounts) {
        statusBreakdown[item.status as OrderStatus] = item._count
      }

      return {
        totalOrders,
        totalRevenue: totalRevenue,
        averageOrderValue: new Prisma.Decimal(averageOrderValue),
        statusBreakdown,
      }
    } catch (error) {
      throw this.handleError('getStatistics', error)
    }
  }

  /**
   * Build Prisma where clause from filter options
   *
   * @param filters - Filter criteria
   * @returns Prisma where clause
   */
  private buildWhereClause(filters: OrderFilters): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {}

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status }
      } else {
        where.status = filters.status
      }
    }

    if (filters.customerId) {
      where.customerId = filters.customerId
    }

    if (filters.dateFrom || filters.dateTo) {
      where.orderDate = {}
      if (filters.dateFrom) {
        where.orderDate.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.orderDate.lte = endDate
      }
    }

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search } },
        { customer: { name: { contains: filters.search } } },
      ]
    }

    return where
  }
}
