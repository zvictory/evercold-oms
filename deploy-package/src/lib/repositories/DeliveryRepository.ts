import { Prisma, Delivery, DeliveryStatus } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import {
  BaseRepository,
  RepositoryError,
} from './BaseRepository'

/**
 * Delivery with relations
 */
export type DeliveryWithRelations = Delivery & {
  order: {
    orderNumber: string
    totalAmount: Prisma.Decimal
  }
  driver?: {
    name: string
  }
  vehicle?: {
    plateNumber: string
  }
  routeStop?: {
    id: string
    stopNumber: number
  }
}

/**
 * Delivery statistics
 */
export interface DeliveryStats {
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  averageDeliveryTime: number
  successRate: number
}

/**
 * Repository for Delivery operations
 */
export class DeliveryRepository extends BaseRepository<
  Delivery,
  Prisma.DeliveryDelegate,
  Prisma.DeliveryCreateInput,
  Prisma.DeliveryUpdateInput,
  Prisma.DeliveryWhereInput,
  Prisma.DeliveryWhereUniqueInput,
  Prisma.DeliveryInclude,
  Prisma.DeliverySelect,
  Prisma.DeliveryOrderByWithRelationInput
> {
  protected modelName = 'Delivery'
  protected delegate: Prisma.DeliveryDelegate

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.delegate = prisma.delivery
  }

  protected getDelegate(): Prisma.DeliveryDelegate {
    return this.prisma.delivery
  }

  /**
   * Get delivery for order
   *
   * @param orderId - Order ID
   * @returns Delivery or null
   */
  async findByOrderId(orderId: string): Promise<DeliveryWithRelations | null> {
    try {
      const delivery = await this.prisma.delivery.findFirst({
        where: { orderId },
        include: {
          order: {
            select: {
              orderNumber: true,
              totalAmount: true,
            },
          },
          driver: {
            select: { name: true },
          },
          vehicle: {
            select: { plateNumber: true },
          },
          routeStop: {
            select: {
              id: true,
              stopNumber: true,
            },
          },
        },
      })

      return delivery as DeliveryWithRelations | null
    } catch (error) {
      throw this.handleError('findByOrderId', error)
    }
  }

  /**
   * Get driver deliveries
   *
   * @param driverId - Driver ID
   * @param status - Optional status filter
   * @returns Array of deliveries
   */
  async findByDriver(
    driverId: string,
    status?: DeliveryStatus
  ): Promise<Delivery[]> {
    try {
      return await this.prisma.delivery.findMany({
        where: {
          driverId,
          ...(status && { status }),
        },
        orderBy: { scheduledDate: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByDriver', error)
    }
  }

  /**
   * Get deliveries on route
   *
   * @param routeId - Route ID
   * @returns Array of deliveries
   */
  async findByRoute(routeId: string): Promise<Delivery[]> {
    try {
      const routeStops = await this.prisma.routeStop.findMany({
        where: { routeId },
        select: { deliveryId: true },
      })

      const deliveryIds = routeStops.map(stop => stop.deliveryId)

      if (deliveryIds.length === 0) {
        return []
      }

      return await this.prisma.delivery.findMany({
        where: { id: { in: deliveryIds } },
        orderBy: { scheduledDate: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByRoute', error)
    }
  }

  /**
   * Find deliveries by status
   *
   * @param status - Delivery status or array of statuses
   * @param limit - Max results
   * @returns Array of deliveries
   */
  async findByStatus(
    status: DeliveryStatus | DeliveryStatus[],
    limit?: number
  ): Promise<Delivery[]> {
    try {
      const statusArray = Array.isArray(status) ? status : [status]
      return await this.prisma.delivery.findMany({
        where: { status: { in: statusArray } },
        orderBy: { scheduledDate: 'asc' },
        take: limit,
      })
    } catch (error) {
      throw this.handleError('findByStatus', error)
    }
  }

  /**
   * Find deliveries by date range
   *
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @returns Array of deliveries
   */
  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<Delivery[]> {
    try {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)

      return await this.prisma.delivery.findMany({
        where: {
          scheduledDate: {
            gte: dateFrom,
            lte: endDate,
          },
        },
        orderBy: { scheduledDate: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByDateRange', error)
    }
  }

  /**
   * Find pending deliveries (not assigned)
   *
   * @returns Array of pending deliveries
   */
  async findPending(): Promise<Delivery[]> {
    try {
      return await this.prisma.delivery.findMany({
        where: {
          status: 'PENDING',
          driverId: null,
        },
        orderBy: { scheduledDate: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findPending', error)
    }
  }

  /**
   * Find deliveries ready for delivery
   *
   * @returns Array of deliverable items
   */
  async findDeliverable(): Promise<Delivery[]> {
    try {
      return await this.prisma.delivery.findMany({
        where: {
          status: { in: ['PENDING', 'IN_TRANSIT'] },
          driverId: { not: null },
        },
        orderBy: { scheduledDate: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findDeliverable', error)
    }
  }

  /**
   * Assign delivery to driver
   *
   * @param deliveryId - Delivery ID
   * @param driverId - Driver ID
   * @param vehicleId - Optional vehicle ID
   * @returns Updated delivery
   */
  async assignToDriver(
    deliveryId: string,
    driverId: string,
    vehicleId?: string
  ): Promise<Delivery> {
    try {
      return await this.prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          driverId,
          vehicleId,
          status: 'IN_TRANSIT',
        },
      })
    } catch (error) {
      throw this.handleError('assignToDriver', error)
    }
  }

  /**
   * Update delivery status
   *
   * @param deliveryId - Delivery ID
   * @param status - New status
   * @returns Updated delivery
   */
  async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus
  ): Promise<Delivery> {
    try {
      return await this.prisma.delivery.update({
        where: { id: deliveryId },
        data: { status },
      })
    } catch (error) {
      throw this.handleError('updateDeliveryStatus', error)
    }
  }

  /**
   * Get delivery statistics for date range
   *
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @returns Delivery statistics
   */
  async getDeliveryStats(
    dateFrom: Date,
    dateTo: Date
  ): Promise<DeliveryStats> {
    try {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)

      const deliveries = await this.prisma.delivery.findMany({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: endDate,
          },
        },
        select: {
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      const totalDeliveries = deliveries.length
      const successfulDeliveries = deliveries.filter(
        (d) => d.status === 'DELIVERED'
      ).length
      const failedDeliveries = deliveries.filter(
        (d) => d.status === 'FAILED'
      ).length

      let totalTime = 0
      let countWithTime = 0
      for (const d of deliveries) {
        if (d.status === 'DELIVERED' || d.status === 'FAILED') {
          totalTime += d.updatedAt.getTime() - d.createdAt.getTime()
          countWithTime++
        }
      }

      const averageDeliveryTime = countWithTime > 0 ? totalTime / countWithTime : 0
      const successRate =
        totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0

      return {
        totalDeliveries,
        successfulDeliveries,
        failedDeliveries,
        averageDeliveryTime,
        successRate,
      }
    } catch (error) {
      throw this.handleError('getDeliveryStats', error)
    }
  }
}
