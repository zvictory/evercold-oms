import { Prisma, DeliveryRoute } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import {
  BaseRepository,
  RepositoryError,
} from './BaseRepository'

/**
 * Route with all stops
 */
export type RouteWithStops = DeliveryRoute & {
  stops: Array<{
    id: string
    stopNumber: number
    status: string
  }>
  driver?: {
    name: string
  }
  vehicle?: {
    plateNumber: string
  }
}

/**
 * Route statistics
 */
export interface RouteStats {
  totalRoutes: number
  totalDistance: Prisma.Decimal
  averageDistance: Prisma.Decimal
  completedRoutes: number
  activeRoutes: number
}

/**
 * Repository for DeliveryRoute operations
 */
export class DeliveryRouteRepository extends BaseRepository<
  DeliveryRoute,
  Prisma.DeliveryRouteDelegate,
  Prisma.DeliveryRouteCreateInput,
  Prisma.DeliveryRouteUpdateInput,
  Prisma.DeliveryRouteWhereInput,
  Prisma.DeliveryRouteWhereUniqueInput,
  Prisma.DeliveryRouteInclude,
  Prisma.DeliveryRouteSelect,
  Prisma.DeliveryRouteOrderByWithRelationInput
> {
  protected modelName = 'DeliveryRoute'
  protected delegate: Prisma.DeliveryRouteDelegate

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.delegate = prisma.deliveryRoute
  }

  protected getDelegate(): Prisma.DeliveryRouteDelegate {
    return this.prisma.deliveryRoute
  }

  /**
   * Get driver routes
   *
   * @param driverId - Driver ID
   * @returns Array of routes
   */
  async findByDriver(driverId: string): Promise<DeliveryRoute[]> {
    try {
      return await this.prisma.deliveryRoute.findMany({
        where: { driverId },
        orderBy: { scheduledDate: 'desc' },
      })
    } catch (error) {
      throw this.handleError('findByDriver', error)
    }
  }

  /**
   * Get vehicle routes
   *
   * @param vehicleId - Vehicle ID
   * @returns Array of routes
   */
  async findByVehicle(vehicleId: string): Promise<DeliveryRoute[]> {
    try {
      return await this.prisma.deliveryRoute.findMany({
        where: { vehicleId },
        orderBy: { scheduledDate: 'desc' },
      })
    } catch (error) {
      throw this.handleError('findByVehicle', error)
    }
  }

  /**
   * Get routes for specific date
   *
   * @param date - Route date
   * @returns Array of routes
   */
  async findByDate(date: Date): Promise<DeliveryRoute[]> {
    try {
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      return await this.prisma.deliveryRoute.findMany({
        where: {
          scheduledDate: {
            gte: date,
            lt: nextDate,
          },
        },
        orderBy: { routeName: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByDate', error)
    }
  }

  /**
   * Get active routes
   *
   * @returns Array of active routes
   */
  async findActive(): Promise<RouteWithStops[]> {
    try {
      const routes = await this.prisma.deliveryRoute.findMany({
        include: {
          stops: {
            select: {
              id: true,
              stopNumber: true,
              status: true,
            },
          },
          driver: {
            select: { name: true },
          },
          vehicle: {
            select: { plateNumber: true },
          },
        },
        orderBy: { scheduledDate: 'desc' },
      })

      return routes as RouteWithStops[]
    } catch (error) {
      throw this.handleError('findActive', error)
    }
  }

  /**
   * Get completed routes
   *
   * @param dateFrom - Optional start date
   * @param dateTo - Optional end date
   * @returns Array of completed routes
   */
  async findCompleted(dateFrom?: Date, dateTo?: Date): Promise<DeliveryRoute[]> {
    try {
      const where: Prisma.DeliveryRouteWhereInput = {}

      if (dateFrom || dateTo) {
        where.scheduledDate = {}
        if (dateFrom) where.scheduledDate.gte = dateFrom
        if (dateTo) {
          const endDate = new Date(dateTo)
          endDate.setDate(endDate.getDate() + 1)
          where.scheduledDate.lt = endDate
        }
      }

      return await this.prisma.deliveryRoute.findMany({
        where,
        orderBy: { scheduledDate: 'desc' },
      })
    } catch (error) {
      throw this.handleError('findCompleted', error)
    }
  }

  /**
   * Get optimized routes (routes with optimizationMethod set to 'haversine')
   *
   * @returns Array of optimized routes
   */
  async findOptimized(): Promise<DeliveryRoute[]> {
    try {
      return await this.prisma.deliveryRoute.findMany({
        where: {
          optimizationMethod: 'haversine',
        },
        orderBy: { scheduledDate: 'desc' },
      })
    } catch (error) {
      throw this.handleError('findOptimized', error)
    }
  }

  /**
   * Get route with all stops
   *
   * @param routeId - Route ID
   * @returns Route with stops or null
   */
  async getRouteDetails(routeId: string): Promise<RouteWithStops | null> {
    try {
      const route = await this.prisma.deliveryRoute.findUnique({
        where: { id: routeId },
        include: {
          stops: {
            select: {
              id: true,
              stopNumber: true,
              status: true,
            },
            orderBy: { stopNumber: 'asc' },
          },
          driver: {
            select: { name: true },
          },
          vehicle: {
            select: { plateNumber: true },
          },
        },
      })

      return route as RouteWithStops | null
    } catch (error) {
      throw this.handleError('getRouteDetails', error)
    }
  }

  /**
   * Update route status
   *
   * @param routeId - Route ID
   * @param status - New status
   * @returns Updated route
   */
  async updateRouteStatus(
    routeId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  ): Promise<DeliveryRoute> {
    try {
      return await this.prisma.deliveryRoute.update({
        where: { id: routeId },
        data: { notes: `Status: ${status}` },
      })
    } catch (error) {
      throw this.handleError('updateRouteStatus', error)
    }
  }

  /**
   * Calculate total route distance
   *
   * @param routeId - Route ID
   * @returns Total distance in km
   */
  async calculateRouteTotalDistance(routeId: string): Promise<Prisma.Decimal> {
    try {
      const route = await this.prisma.deliveryRoute.findUniqueOrThrow({
        where: { id: routeId },
      })

      return route.totalDistance
        ? new Prisma.Decimal(route.totalDistance.toString())
        : new Prisma.Decimal(0)
    } catch (error) {
      throw this.handleError('calculateRouteTotalDistance', error)
    }
  }

  /**
   * Get route statistics for date range
   *
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @returns Route statistics
   */
  async getRouteStats(
    dateFrom: Date,
    dateTo: Date
  ): Promise<RouteStats> {
    try {
      const endDate = new Date(dateTo)
      endDate.setDate(endDate.getDate() + 1)

      const routes = await this.prisma.deliveryRoute.findMany({
        where: {
          scheduledDate: {
            gte: dateFrom,
            lt: endDate,
          },
        },
        select: {
          totalDistance: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      const totalRoutes = routes.length
      let totalDistance = new Prisma.Decimal(0)

      for (const route of routes) {
        if (route.totalDistance) {
          totalDistance = totalDistance.plus(
            new Prisma.Decimal(route.totalDistance.toString())
          )
        }
      }

      const averageDistance = totalRoutes > 0
        ? new Prisma.Decimal(
            totalDistance.toNumber() / totalRoutes
          )
        : new Prisma.Decimal(0)

      return {
        totalRoutes,
        totalDistance,
        averageDistance,
        completedRoutes: totalRoutes,
        activeRoutes: 0,
      }
    } catch (error) {
      throw this.handleError('getRouteStats', error)
    }
  }
}
