import { Prisma, ServiceTicket, TicketStatus, TicketPriority } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import {
  BaseRepository,
  RepositoryError,
} from './BaseRepository'

/**
 * Service ticket with relations
 */
export type ServiceTicketWithRelations = ServiceTicket & {
  assignedTechnician?: {
    id: string
    name: string
  }
  branch?: {
    branchCode: string
    branchName: string
  }
  category?: {
    id: string
    name: string
  }
}

/**
 * Service ticket statistics
 */
export interface ServiceTicketStats {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  closedTickets: number
  averageResolutionTime: number
  averageFirstResponseTime: number
  highPriorityCount: number
  unassignedCount: number
}

/**
 * Repository for ServiceTicket operations
 */
export class ServiceTicketRepository extends BaseRepository<
  ServiceTicket,
  Prisma.ServiceTicketDelegate,
  Prisma.ServiceTicketCreateInput,
  Prisma.ServiceTicketUpdateInput,
  Prisma.ServiceTicketWhereInput,
  Prisma.ServiceTicketWhereUniqueInput,
  Prisma.ServiceTicketInclude,
  Prisma.ServiceTicketSelect,
  Prisma.ServiceTicketOrderByWithRelationInput
> {
  protected modelName = 'ServiceTicket'
  protected delegate: Prisma.ServiceTicketDelegate

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.delegate = prisma.serviceTicket
  }

  protected getDelegate(): Prisma.ServiceTicketDelegate {
    return this.prisma.serviceTicket
  }

  /**
   * Find ticket by ticket number
   *
   * @param ticketNumber - Ticket number
   * @returns Service ticket or null
   */
  async findByTicketNumber(ticketNumber: string): Promise<ServiceTicket | null> {
    try {
      return await this.prisma.serviceTicket.findFirst({
        where: { ticketNumber },
      })
    } catch (error) {
      throw this.handleError('findByTicketNumber', error)
    }
  }

  /**
   * Find tickets by status
   *
   * @param status - Ticket status
   * @returns Array of tickets
   */
  async findByStatus(status: TicketStatus): Promise<ServiceTicket[]> {
    try {
      return await this.prisma.serviceTicket.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      throw this.handleError('findByStatus', error)
    }
  }

  /**
   * Find tickets by priority
   *
   * @param priority - Ticket priority
   * @returns Array of tickets
   */
  async findByPriority(priority: TicketPriority): Promise<ServiceTicket[]> {
    try {
      return await this.prisma.serviceTicket.findMany({
        where: { priority },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      throw this.handleError('findByPriority', error)
    }
  }

  /**
   * Find tickets assigned to technician
   *
   * @param technicianId - Technician ID
   * @returns Array of tickets
   */
  async findByTechnician(technicianId: string): Promise<ServiceTicket[]> {
    try {
      return await this.prisma.serviceTicket.findMany({
        where: { assignedTechnicianId: technicianId },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      throw this.handleError('findByTechnician', error)
    }
  }

  /**
   * Find tickets for branch
   *
   * @param branchId - Branch ID
   * @returns Array of tickets
   */
  async findByBranch(branchId: string): Promise<ServiceTicket[]> {
    try {
      return await this.prisma.serviceTicket.findMany({
        where: { branchId },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      throw this.handleError('findByBranch', error)
    }
  }

  /**
   * Find open tickets (not resolved/closed)
   *
   * @returns Array of open tickets
   */
  async findOpen(): Promise<ServiceTicket[]> {
    try {
      return await this.prisma.serviceTicket.findMany({
        where: {
          status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      })
    } catch (error) {
      throw this.handleError('findOpen', error)
    }
  }

  /**
   * Find unassigned tickets
   *
   * @returns Array of unassigned tickets
   */
  async findUnassigned(): Promise<ServiceTicket[]> {
    try {
      return await this.prisma.serviceTicket.findMany({
        where: {
          assignedTechnicianId: null,
          status: { in: ['NEW', 'ASSIGNED'] },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      })
    } catch (error) {
      throw this.handleError('findUnassigned', error)
    }
  }

  /**
   * Find high priority tickets
   *
   * @returns Array of high priority tickets
   */
  async findHighPriority(): Promise<ServiceTicket[]> {
    try {
      return await this.prisma.serviceTicket.findMany({
        where: {
          priority: { in: ['HIGH', 'CRITICAL'] },
          status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] },
        },
        orderBy: { createdAt: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findHighPriority', error)
    }
  }

  /**
   * Get ticket with relations
   *
   * @param ticketId - Ticket ID
   * @returns Ticket with relations
   */
  async getTicketWithRelations(ticketId: string): Promise<ServiceTicketWithRelations | null> {
    try {
      const ticket = await this.prisma.serviceTicket.findUnique({
        where: { id: ticketId },
        include: {
          assignedTechnician: {
            select: {
              id: true,
              name: true,
            },
          },
          branch: {
            select: {
              branchCode: true,
              branchName: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      return ticket as ServiceTicketWithRelations | null
    } catch (error) {
      throw this.handleError('getTicketWithRelations', error)
    }
  }

  /**
   * Assign ticket to technician
   *
   * @param ticketId - Ticket ID
   * @param technicianId - Technician ID
   * @returns Updated ticket
   */
  async assignToTechnician(ticketId: string, technicianId: string): Promise<ServiceTicket> {
    try {
      return await this.prisma.serviceTicket.update({
        where: { id: ticketId },
        data: {
          assignedTechnicianId: technicianId,
          status: 'ASSIGNED',
          firstResponseAt: new Date(),
        },
      })
    } catch (error) {
      throw this.handleError('assignToTechnician', error)
    }
  }

  /**
   * Update ticket status
   *
   * @param ticketId - Ticket ID
   * @param status - New status
   * @returns Updated ticket
   */
  async updateStatus(ticketId: string, status: TicketStatus): Promise<ServiceTicket> {
    try {
      const data: any = { status }

      if (status === 'COMPLETED') {
        data.completedAt = new Date()
      } else if (status === 'CLOSED') {
        data.closedAt = new Date()
      }

      return await this.prisma.serviceTicket.update({
        where: { id: ticketId },
        data,
      })
    } catch (error) {
      throw this.handleError('updateStatus', error)
    }
  }

  /**
   * Update ticket priority
   *
   * @param ticketId - Ticket ID
   * @param priority - New priority
   * @returns Updated ticket
   */
  async updatePriority(ticketId: string, priority: TicketPriority): Promise<ServiceTicket> {
    try {
      return await this.prisma.serviceTicket.update({
        where: { id: ticketId },
        data: { priority },
      })
    } catch (error) {
      throw this.handleError('updatePriority', error)
    }
  }

  /**
   * Get service ticket statistics
   *
   * @param dateFrom - Start date (optional)
   * @param dateTo - End date (optional)
   * @returns Service ticket statistics
   */
  async getTicketStats(dateFrom?: Date, dateTo?: Date): Promise<ServiceTicketStats> {
    try {
      const where: Prisma.ServiceTicketWhereInput = {}

      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt.gte = dateFrom
        if (dateTo) {
          const endDate = new Date(dateTo)
          endDate.setHours(23, 59, 59, 999)
          where.createdAt.lte = endDate
        }
      }

      const tickets = await this.prisma.serviceTicket.findMany({
        where,
        select: {
          status: true,
          priority: true,
          createdAt: true,
          completedAt: true,
          closedAt: true,
          firstResponseAt: true,
          assignedTechnicianId: true,
        },
      })

      const totalTickets = tickets.length
      const openTickets = tickets.filter((t) => t.status === 'ASSIGNED').length
      const resolvedTickets = tickets.filter((t) => t.status === 'COMPLETED').length
      const closedTickets = tickets.filter((t) => t.status === 'CLOSED').length
      const highPriorityCount = tickets.filter((t) => t.priority === 'HIGH').length
      const unassignedCount = tickets.filter((t) => !t.assignedTechnicianId).length

      let totalResolutionTime = 0
      let resolutionCount = 0
      let totalFirstResponseTime = 0
      let firstResponseCount = 0

      for (const t of tickets) {
        if (t.completedAt) {
          totalResolutionTime += t.completedAt.getTime() - t.createdAt.getTime()
          resolutionCount++
        }
        if (t.firstResponseAt) {
          totalFirstResponseTime += t.firstResponseAt.getTime() - t.createdAt.getTime()
          firstResponseCount++
        }
      }

      const averageResolutionTime = resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0
      const averageFirstResponseTime = firstResponseCount > 0 ? totalFirstResponseTime / firstResponseCount : 0

      return {
        totalTickets,
        openTickets,
        resolvedTickets,
        closedTickets,
        averageResolutionTime,
        averageFirstResponseTime,
        highPriorityCount,
        unassignedCount,
      }
    } catch (error) {
      throw this.handleError('getTicketStats', error)
    }
  }
}
