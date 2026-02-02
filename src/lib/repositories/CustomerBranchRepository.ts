import { Prisma, CustomerBranch } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import {
  BaseRepository,
  RepositoryError,
} from './BaseRepository'

/**
 * Branch with relations included
 */
export type BranchWithRelations = CustomerBranch & {
  customer: {
    id: string
    name: string
  }
  technicianAssignments: Array<{
    id: string
    technicianId: string
  }>
}

/**
 * Branch location for mapping
 */
export interface BranchLocation {
  id: string
  branchCode: string
  branchName: string
  latitude: number | null
  longitude: number | null
  deliveryAddress: string | null
}

/**
 * Branch service history
 */
export interface BranchServiceHistory {
  branchId: string
  branchName: string
  totalTickets: number
  openTickets: number
  resolvedTickets: number
}

/**
 * Repository for CustomerBranch operations
 */
export class CustomerBranchRepository extends BaseRepository<
  CustomerBranch,
  Prisma.CustomerBranchDelegate,
  Prisma.CustomerBranchCreateInput,
  Prisma.CustomerBranchUpdateInput,
  Prisma.CustomerBranchWhereInput,
  Prisma.CustomerBranchWhereUniqueInput,
  Prisma.CustomerBranchInclude,
  Prisma.CustomerBranchSelect,
  Prisma.CustomerBranchOrderByWithRelationInput
> {
  protected modelName = 'CustomerBranch'
  protected delegate: Prisma.CustomerBranchDelegate

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.delegate = prisma.customerBranch
  }

  protected getDelegate(): Prisma.CustomerBranchDelegate {
    return this.prisma.customerBranch
  }

  /**
   * Find branch by code
   *
   * @param code - Branch code
   * @param customerId - Optional customer ID for filtering
   * @returns Branch or null
   */
  async findByCode(
    code: string,
    customerId?: string
  ): Promise<CustomerBranch | null> {
    try {
      return await this.prisma.customerBranch.findFirst({
        where: {
          branchCode: code,
          ...(customerId && { customerId }),
        },
      })
    } catch (error) {
      throw this.handleError('findByCode', error)
    }
  }

  /**
   * Find all branches for customer
   *
   * @param customerId - Customer ID
   * @returns Array of branches
   */
  async findByCustomer(customerId: string): Promise<CustomerBranch[]> {
    try {
      return await this.prisma.customerBranch.findMany({
        where: { customerId },
        orderBy: { branchName: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByCustomer', error)
    }
  }

  /**
   * Find branches by name with partial matching
   *
   * @param name - Branch name
   * @param limit - Max results
   * @returns Array of branches
   */
  async findByName(name: string, limit?: number): Promise<CustomerBranch[]> {
    try {
      return await this.prisma.customerBranch.findMany({
        where: {
          branchName: {
            contains: name,
            mode: 'insensitive',
          },
        },
        take: limit,
        orderBy: { branchName: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByName', error)
    }
  }

  /**
   * Find active branches
   *
   * @param customerId - Optional customer ID for filtering
   * @returns Array of active branches
   */
  async findActive(customerId?: string): Promise<CustomerBranch[]> {
    try {
      return await this.prisma.customerBranch.findMany({
        where: {
          isActive: true,
          ...(customerId && { customerId }),
        },
        orderBy: { branchName: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findActive', error)
    }
  }

  /**
   * Find branches near coordinates (radius in km)
   *
   * @param latitude - Center latitude
   * @param longitude - Center longitude
   * @param radiusKm - Search radius in kilometers
   * @returns Array of branches within radius
   */
  async findByCoordinates(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<BranchLocation[]> {
    try {
      const branches = await this.prisma.customerBranch.findMany({
        where: {
          latitude: { not: null },
          longitude: { not: null },
        },
        select: {
          id: true,
          branchCode: true,
          branchName: true,
          latitude: true,
          longitude: true,
          deliveryAddress: true,
        },
      })

      const earthRadiusKm = 6371
      const toRad = (deg: number) => deg * (Math.PI / 180)

      return branches.filter((branch) => {
        if (!branch.latitude || !branch.longitude) return false

        const dLat = toRad(Number(branch.latitude) - latitude)
        const dLng = toRad(Number(branch.longitude) - longitude)
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(latitude)) *
            Math.cos(toRad(Number(branch.latitude))) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = earthRadiusKm * c

        return distance <= radiusKm
      })
    } catch (error) {
      throw this.handleError('findByCoordinates', error)
    }
  }

  /**
   * Get branch with technician assignments
   *
   * @param branchId - Branch ID
   * @returns Branch with technicians or null
   */
  async findWithTechnicians(branchId: string): Promise<BranchWithRelations | null> {
    try {
      const branch = await this.prisma.customerBranch.findUnique({
        where: { id: branchId },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          technicianAssignments: {
            select: {
              id: true,
              technicianId: true,
            },
          },
        },
      })

      return branch as BranchWithRelations | null
    } catch (error) {
      throw this.handleError('findWithTechnicians', error)
    }
  }

  /**
   * Get all service tickets for branch
   *
   * @param branchId - Branch ID
   * @returns Array of service tickets
   */
  async getServiceTickets(branchId: string): Promise<any[]> {
    try {
      return await this.prisma.serviceTicket.findMany({
        where: { branchId },
        select: {
          id: true,
          ticketNumber: true,
          status: true,
          priority: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      throw this.handleError('getServiceTickets', error)
    }
  }

  /**
   * Get order history for branch
   *
   * @param branchId - Branch ID
   * @param days - Number of days to look back
   * @returns Array of orders
   */
  async getOrderHistory(branchId: string, days?: number): Promise<any[]> {
    try {
      const dateFrom = days
        ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        : new Date(0)

      return await this.prisma.orderItem.findMany({
        where: {
          branchId,
          createdAt: { gte: dateFrom },
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              orderDate: true,
              totalAmount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      throw this.handleError('getOrderHistory', error)
    }
  }
}
