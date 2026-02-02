import { Prisma, Vehicle, VehicleType, VehicleStatus } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import {
  BaseRepository,
  RepositoryError,
} from './BaseRepository'

/**
 * Vehicle with relations
 */
export type VehicleWithRelations = Vehicle & {
  driver?: {
    id: string
    name: string
  }
  deliveries?: Array<{
    id: string
    status: string
  }>
  routes?: Array<{
    id: string
    routeName: string
  }>
}

/**
 * Vehicle statistics
 */
export interface VehicleStats {
  vehicleId: string
  plateNumber: string
  totalDeliveries: number
  completedDeliveries: number
  failedDeliveries: number
  averageDeliveryTime: number
  currentStatus: VehicleStatus
  assignedDriver: string | null
}

/**
 * Repository for Vehicle operations
 */
export class VehicleRepository extends BaseRepository<
  Vehicle,
  Prisma.VehicleDelegate,
  Prisma.VehicleCreateInput,
  Prisma.VehicleUpdateInput,
  Prisma.VehicleWhereInput,
  Prisma.VehicleWhereUniqueInput,
  Prisma.VehicleInclude,
  Prisma.VehicleSelect,
  Prisma.VehicleOrderByWithRelationInput
> {
  protected modelName = 'Vehicle'
  protected delegate: Prisma.VehicleDelegate

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.delegate = prisma.vehicle
  }

  protected getDelegate(): Prisma.VehicleDelegate {
    return this.prisma.vehicle
  }

  /**
   * Find vehicle by plate number
   *
   * @param plateNumber - Vehicle plate number
   * @returns Vehicle or null
   */
  async findByPlateNumber(plateNumber: string): Promise<Vehicle | null> {
    try {
      return await this.prisma.vehicle.findFirst({
        where: { plateNumber },
      })
    } catch (error) {
      throw this.handleError('findByPlateNumber', error)
    }
  }

  /**
   * Find vehicles by type
   *
   * @param type - Vehicle type
   * @returns Array of vehicles
   */
  async findByType(type: VehicleType): Promise<Vehicle[]> {
    try {
      return await this.prisma.vehicle.findMany({
        where: { type },
        orderBy: { plateNumber: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByType', error)
    }
  }

  /**
   * Find vehicles by status
   *
   * @param status - Vehicle status
   * @returns Array of vehicles
   */
  async findByStatus(status: VehicleStatus): Promise<Vehicle[]> {
    try {
      return await this.prisma.vehicle.findMany({
        where: { status },
        orderBy: { plateNumber: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByStatus', error)
    }
  }

  /**
   * Find available vehicles
   *
   * @returns Array of available vehicles
   */
  async findAvailable(): Promise<Vehicle[]> {
    try {
      return await this.prisma.vehicle.findMany({
        where: { status: 'AVAILABLE' },
        orderBy: { plateNumber: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findAvailable', error)
    }
  }

  /**
   * Find vehicles assigned to driver
   *
   * @param driverId - Driver ID
   * @returns Array of vehicles
   */
  async findByDriver(driverId: string): Promise<Vehicle[]> {
    try {
      return await this.prisma.vehicle.findMany({
        where: { driverId },
        orderBy: { plateNumber: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByDriver', error)
    }
  }

  /**
   * Find unassigned vehicles
   *
   * @returns Array of unassigned vehicles
   */
  async findUnassigned(): Promise<Vehicle[]> {
    try {
      return await this.prisma.vehicle.findMany({
        where: { driverId: null },
        orderBy: { plateNumber: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findUnassigned', error)
    }
  }

  /**
   * Get vehicle with relations
   *
   * @param vehicleId - Vehicle ID
   * @returns Vehicle with relations
   */
  async getVehicleWithRelations(vehicleId: string): Promise<VehicleWithRelations | null> {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
            },
          },
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
        },
      })

      return vehicle as VehicleWithRelations | null
    } catch (error) {
      throw this.handleError('getVehicleWithRelations', error)
    }
  }

  /**
   * Assign vehicle to driver
   *
   * @param vehicleId - Vehicle ID
   * @param driverId - Driver ID
   * @returns Updated vehicle
   */
  async assignToDriver(vehicleId: string, driverId: string): Promise<Vehicle> {
    try {
      return await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { driverId },
      })
    } catch (error) {
      throw this.handleError('assignToDriver', error)
    }
  }

  /**
   * Unassign vehicle from driver
   *
   * @param vehicleId - Vehicle ID
   * @returns Updated vehicle
   */
  async unassignFromDriver(vehicleId: string): Promise<Vehicle> {
    try {
      return await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { driverId: null },
      })
    } catch (error) {
      throw this.handleError('unassignFromDriver', error)
    }
  }

  /**
   * Update vehicle status
   *
   * @param vehicleId - Vehicle ID
   * @param status - New status
   * @returns Updated vehicle
   */
  async updateStatus(vehicleId: string, status: VehicleStatus): Promise<Vehicle> {
    try {
      return await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status },
      })
    } catch (error) {
      throw this.handleError('updateStatus', error)
    }
  }

  /**
   * Get vehicle statistics
   *
   * @param vehicleId - Vehicle ID
   * @returns Vehicle statistics
   */
  async getVehicleStats(vehicleId: string): Promise<VehicleStats> {
    try {
      const vehicle = await this.prisma.vehicle.findUniqueOrThrow({
        where: { id: vehicleId },
        include: {
          driver: {
            select: { id: true, name: true },
          },
          deliveries: {
            select: {
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      })

      const deliveries = vehicle.deliveries || []
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
        vehicleId,
        plateNumber: vehicle.plateNumber,
        totalDeliveries,
        completedDeliveries,
        failedDeliveries,
        averageDeliveryTime,
        currentStatus: vehicle.status,
        assignedDriver: vehicle.driverId,
      }
    } catch (error) {
      throw this.handleError('getVehicleStats', error)
    }
  }
}
