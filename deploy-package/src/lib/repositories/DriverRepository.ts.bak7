import { Prisma, Driver, DriverStatus, DriverLocationStatus } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import {
  BaseRepository,
  RepositoryError,
} from './BaseRepository'

/**
 * Driver with relations
 */
export type DriverWithRelations = Driver & {
  deliveries?: Array<{
    id: string
    status: string
  }>
  routes?: Array<{
    id: string
    routeName: string
  }>
  sessions?: Array<{
    id: string
    expiresAt: Date
  }>
}

/**
 * Driver statistics
 */
export interface DriverStats {
  driverId: string
  driverName: string
  totalDeliveries: number
  completedDeliveries: number
  failedDeliveries: number
  averageDeliveryTime: number
  currentStatus: DriverStatus
  currentLocationStatus: DriverLocationStatus
  lastLocationUpdate: Date | null
}

/**
 * Repository for Driver operations
 */
export class DriverRepository extends BaseRepository<
  Driver,
  Prisma.DriverDelegate,
  Prisma.DriverCreateInput,
  Prisma.DriverUpdateInput,
  Prisma.DriverWhereInput,
  Prisma.DriverWhereUniqueInput,
  Prisma.DriverInclude,
  Prisma.DriverSelect,
  Prisma.DriverOrderByWithRelationInput
> {
  protected modelName = 'Driver'
  protected delegate: Prisma.DriverDelegate

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.delegate = prisma.driver
  }

  protected getDelegate(): Prisma.DriverDelegate {
    return this.prisma.driver
  }

  /**
   * Find driver by phone
   *
   * @param phone - Driver phone number
   * @returns Driver or null
   */
  async findByPhone(phone: string): Promise<Driver | null> {
    try {
      return await this.prisma.driver.findFirst({
        where: { phone },
      })
    } catch (error) {
      throw this.handleError('findByPhone', error)
    }
  }

  /**
   * Find driver by license number
   *
   * @param licenseNumber - Driver license number
   * @returns Driver or null
   */
  async findByLicenseNumber(licenseNumber: string): Promise<Driver | null> {
    try {
      return await this.prisma.driver.findFirst({
        where: { licenseNumber },
      })
    } catch (error) {
      throw this.handleError('findByLicenseNumber', error)
    }
  }

  /**
   * Search drivers by name
   *
   * @param name - Driver name (partial match)
   * @param limit - Max results
   * @returns Array of drivers
   */
  async search(name: string, limit?: number): Promise<Driver[]> {
    try {
      return await this.prisma.driver.findMany({
        where: {
          name: {
            contains: name,
            mode: 'insensitive',
          },
        },
        take: limit,
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('search', error)
    }
  }

  /**
   * Find all active drivers
   *
   * @returns Array of active drivers
   */
  async findActive(): Promise<Driver[]> {
    try {
      return await this.prisma.driver.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findActive', error)
    }
  }

  /**
   * Find drivers by location status
   *
   * @param locationStatus - Location status
   * @returns Array of drivers
   */
  async findByLocationStatus(locationStatus: DriverLocationStatus): Promise<Driver[]> {
    try {
      return await this.prisma.driver.findMany({
        where: { locationStatus },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByLocationStatus', error)
    }
  }

  /**
   * Find drivers by status
   *
   * @param status - Driver status
   * @returns Array of drivers
   */
  async findByStatus(status: DriverStatus): Promise<Driver[]> {
    try {
      return await this.prisma.driver.findMany({
        where: { status },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByStatus', error)
    }
  }

  /**
   * Find drivers within proximity (simplified)
   *
   * @param latitude - Center latitude
   * @param longitude - Center longitude
   * @param radiusKm - Radius in kilometers
   * @returns Array of nearby drivers
   */
  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<Driver[]> {
    try {
      const earthRadiusKm = 6371
      const latOffset = (radiusKm / earthRadiusKm) * (180 / Math.PI)
      const lonOffset =
        (radiusKm / earthRadiusKm) *
        (180 / Math.PI) /
        Math.cos((latitude * Math.PI) / 180)

      return await this.prisma.driver.findMany({
        where: {
          AND: [
            { latitude: { gte: latitude - latOffset, lte: latitude + latOffset } },
            { longitude: { gte: longitude - lonOffset, lte: longitude + lonOffset } },
            { status: 'ACTIVE' },
          ],
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findNearby', error)
    }
  }

  /**
   * Get driver with deliveries
   *
   * @param driverId - Driver ID
   * @returns Driver with relations
   */
  async getDriverWithRelations(driverId: string): Promise<DriverWithRelations | null> {
    try {
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          deliveries: {
            select: {
              id: true,
              status: true,
            },
            take: 10,
          },
          routes: {
            select: {
              id: true,
              routeName: true,
            },
            take: 5,
          },
          sessions: {
            select: {
              id: true,
              expiresAt: true,
            },
            take: 5,
          },
        },
      })

      return driver as DriverWithRelations | null
    } catch (error) {
      throw this.handleError('getDriverWithRelations', error)
    }
  }

  /**
   * Update driver location
   *
   * @param driverId - Driver ID
   * @param latitude - New latitude
   * @param longitude - New longitude
   * @returns Updated driver
   */
  async updateLocation(
    driverId: string,
    latitude: number,
    longitude: number
  ): Promise<Driver> {
    try {
      return await this.prisma.driver.update({
        where: { id: driverId },
        data: {
          latitude,
          longitude,
          lastLocationUpdate: new Date(),
        },
      })
    } catch (error) {
      throw this.handleError('updateLocation', error)
    }
  }

  /**
   * Update driver status
   *
   * @param driverId - Driver ID
   * @param status - New status
   * @returns Updated driver
   */
  async updateStatus(driverId: string, status: DriverStatus): Promise<Driver> {
    try {
      return await this.prisma.driver.update({
        where: { id: driverId },
        data: { status },
      })
    } catch (error) {
      throw this.handleError('updateStatus', error)
    }
  }

  /**
   * Update driver location status
   *
   * @param driverId - Driver ID
   * @param locationStatus - New location status
   * @returns Updated driver
   */
  async updateLocationStatus(
    driverId: string,
    locationStatus: DriverLocationStatus
  ): Promise<Driver> {
    try {
      return await this.prisma.driver.update({
        where: { id: driverId },
        data: { locationStatus },
      })
    } catch (error) {
      throw this.handleError('updateLocationStatus', error)
    }
  }

  /**
   * Get driver statistics
   *
   * @param driverId - Driver ID
   * @returns Driver statistics
   */
  async getDriverStats(driverId: string): Promise<DriverStats> {
    try {
      const driver = await this.prisma.driver.findUniqueOrThrow({
        where: { id: driverId },
        include: {
          deliveries: {
            select: {
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      })

      const deliveries = driver.deliveries || []
      const totalDeliveries = deliveries.length
      const completedDeliveries = deliveries.filter(
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

      return {
        driverId,
        driverName: driver.name,
        totalDeliveries,
        completedDeliveries,
        failedDeliveries,
        averageDeliveryTime,
        currentStatus: driver.status,
        currentLocationStatus: driver.locationStatus,
        lastLocationUpdate: driver.lastLocationUpdate,
      }
    } catch (error) {
      throw this.handleError('getDriverStats', error)
    }
  }
}
