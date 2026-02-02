import { Prisma, Technician, TechnicianStatus } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import {
  BaseRepository,
  RepositoryError,
} from './BaseRepository'

/**
 * Technician with relations
 */
export type TechnicianWithRelations = Technician & {
  assignedTickets?: Array<{
    id: string
    ticketNumber: string
    status: string
  }>
  branchAssignments?: Array<{
    id: string
    branch: {
      branchName: string
    }
  }>
}

/**
 * Technician statistics
 */
export interface TechnicianStats {
  technicianId: string
  technicianName: string
  totalTickets: number
  resolvedTickets: number
  openTickets: number
  averageResolutionTime: number
  currentStatus: TechnicianStatus
  assignedBranches: number
}

/**
 * Repository for Technician operations
 */
export class TechnicianRepository extends BaseRepository<
  Technician,
  Prisma.TechnicianDelegate,
  Prisma.TechnicianCreateInput,
  Prisma.TechnicianUpdateInput,
  Prisma.TechnicianWhereInput,
  Prisma.TechnicianWhereUniqueInput,
  Prisma.TechnicianInclude,
  Prisma.TechnicianSelect,
  Prisma.TechnicianOrderByWithRelationInput
> {
  protected modelName = 'Technician'
  protected delegate: Prisma.TechnicianDelegate

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.delegate = prisma.technician
  }

  protected getDelegate(): Prisma.TechnicianDelegate {
    return this.prisma.technician
  }

  /**
   * Find technician by phone
   *
   * @param phone - Technician phone
   * @returns Technician or null
   */
  async findByPhone(phone: string): Promise<Technician | null> {
    try {
      return await this.prisma.technician.findFirst({
        where: { phone },
      })
    } catch (error) {
      throw this.handleError('findByPhone', error)
    }
  }

  /**
   * Search technicians by name
   *
   * @param name - Technician name (partial match)
   * @param limit - Max results
   * @returns Array of technicians
   */
  async search(name: string, limit?: number): Promise<Technician[]> {
    try {
      return await this.prisma.technician.findMany({
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
   * Find all active technicians
   *
   * @returns Array of active technicians
   */
  async findActive(): Promise<Technician[]> {
    try {
      return await this.prisma.technician.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findActive', error)
    }
  }

  /**
   * Find technicians by status
   *
   * @param status - Technician status
   * @returns Array of technicians
   */
  async findByStatus(status: TechnicianStatus): Promise<Technician[]> {
    try {
      return await this.prisma.technician.findMany({
        where: { status },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByStatus', error)
    }
  }

  /**
   * Find technicians assigned to branch
   *
   * @param branchId - Branch ID
   * @returns Array of technicians
   */
  async findByBranch(branchId: string): Promise<Technician[]> {
    try {
      const assignments = await this.prisma.technicianBranchAssignment.findMany({
        where: { branchId },
        select: { technicianId: true },
      })

      const technicianIds = assignments.map((a) => a.technicianId)

      if (technicianIds.length === 0) {
        return []
      }

      return await this.prisma.technician.findMany({
        where: { id: { in: technicianIds } },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByBranch', error)
    }
  }

  /**
   * Get technician with relations
   *
   * @param technicianId - Technician ID
   * @returns Technician with relations
   */
  async getTechnicianWithRelations(
    technicianId: string
  ): Promise<TechnicianWithRelations | null> {
    try {
      const technician = await this.prisma.technician.findUnique({
        where: { id: technicianId },
        include: {
          assignedTickets: {
            select: {
              id: true,
              ticketNumber: true,
              status: true,
            },
            take: 10,
          },
          branchAssignments: {
            select: {
              id: true,
              branch: {
                select: { branchName: true },
              },
            },
          },
        },
      })

      return technician as TechnicianWithRelations | null
    } catch (error) {
      throw this.handleError('getTechnicianWithRelations', error)
    }
  }

  /**
   * Update technician status
   *
   * @param technicianId - Technician ID
   * @param status - New status
   * @returns Updated technician
   */
  async updateStatus(technicianId: string, status: TechnicianStatus): Promise<Technician> {
    try {
      return await this.prisma.technician.update({
        where: { id: technicianId },
        data: { status },
      })
    } catch (error) {
      throw this.handleError('updateStatus', error)
    }
  }

  /**
   * Update technician location
   *
   * @param technicianId - Technician ID
   * @param latitude - New latitude
   * @param longitude - New longitude
   * @returns Updated technician
   */
  async updateLocation(
    technicianId: string,
    latitude: number,
    longitude: number
  ): Promise<Technician> {
    try {
      return await this.prisma.technician.update({
        where: { id: technicianId },
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
   * Get technician statistics
   *
   * @param technicianId - Technician ID
   * @returns Technician statistics
   */
  async getTechnicianStats(technicianId: string): Promise<TechnicianStats> {
    try {
      const technician = await this.prisma.technician.findUniqueOrThrow({
        where: { id: technicianId },
        include: {
          assignedTickets: {
            select: {
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          branchAssignments: {
            select: { id: true },
          },
        },
      })

      const tickets = technician.assignedTickets || []
      const totalTickets = tickets.length
      const resolvedTickets = tickets.filter(
        (t) => t.status === 'COMPLETED'
      ).length
      const openTickets = tickets.filter(
        (t) => t.status === 'ASSIGNED'
      ).length

      let totalTime = 0
      let countWithTime = 0
      for (const t of tickets) {
        if (t.status === 'COMPLETED' || t.status === 'CLOSED') {
          totalTime += t.updatedAt.getTime() - t.createdAt.getTime()
          countWithTime++
        }
      }

      const averageResolutionTime = countWithTime > 0 ? totalTime / countWithTime : 0

      return {
        technicianId,
        technicianName: technician.name,
        totalTickets,
        resolvedTickets,
        openTickets,
        averageResolutionTime,
        currentStatus: technician.status,
        assignedBranches: technician.branchAssignments?.length || 0,
      }
    } catch (error) {
      throw this.handleError('getTechnicianStats', error)
    }
  }
}
