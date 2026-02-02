import type { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { OrderRepository } from './OrderRepository'

// Re-export base classes and types
export { BaseRepository, RepositoryError } from './BaseRepository'
export type {
  TransactionClient,
  PaginationOptions,
  PaginatedResult,
} from './BaseRepository'

// Re-export domain repositories
export { OrderRepository } from './OrderRepository'
export type {
  OrderWithRelations,
  OrderListItem,
  OrderStatistics,
  OrderFilters,
  CreateOrderInput,
} from './OrderRepository'

/**
 * Centralized repository registry
 * Provides singleton access to all repositories
 */
export class RepositoryRegistry {
  private static instance: RepositoryRegistry | null = null
  private prismaClient: PrismaClient
  private repositories: Map<string, any> = new Map()

  private constructor(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient
  }

  /**
   * Get or create singleton instance
   *
   * @param prismaClient - Optional Prisma client (uses default if not provided)
   * @returns RepositoryRegistry instance
   */
  static getInstance(prismaClient?: PrismaClient): RepositoryRegistry {
    if (!RepositoryRegistry.instance) {
      RepositoryRegistry.instance = new RepositoryRegistry(
        prismaClient ?? prisma
      )
    }
    return RepositoryRegistry.instance
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static resetInstance(): void {
    RepositoryRegistry.instance = null
  }

  /**
   * Get OrderRepository instance
   *
   * @returns OrderRepository singleton
   */
  getOrderRepository(): OrderRepository {
    if (!this.repositories.has('order')) {
      this.repositories.set('order', new OrderRepository(this.prismaClient))
    }
    return this.repositories.get('order')!
  }

  /**
   * Get Prisma client instance
   *
   * @returns PrismaClient instance
   */
  getPrismaClient(): PrismaClient {
    return this.prismaClient
  }

  /**
   * Clear all repository instances
   * Useful when switching Prisma client instances
   */
  clearRepositories(): void {
    this.repositories.clear()
  }
}

/**
 * Initialize repositories with default Prisma client
 *
 * @returns RepositoryRegistry instance
 */
export function initializeRepositories(): RepositoryRegistry {
  return RepositoryRegistry.getInstance(prisma)
}

/**
 * Initialize repositories with custom Prisma client
 *
 * @param prismaClient - Custom Prisma client instance
 * @returns RepositoryRegistry instance
 */
export function initializeRepositoriesWithClient(
  prismaClient: PrismaClient
): RepositoryRegistry {
  return RepositoryRegistry.getInstance(prismaClient)
}

// Default repository registry instance
const defaultRegistry = RepositoryRegistry.getInstance()

/**
 * Get default OrderRepository instance
 *
 * @returns OrderRepository singleton
 */
export const getOrderRepository = (): OrderRepository => {
  return defaultRegistry.getOrderRepository()
}

/**
 * Convenience function to get repository registry
 *
 * @returns Default RepositoryRegistry instance
 */
export const getRepositories = (): RepositoryRegistry => {
  return defaultRegistry
}
