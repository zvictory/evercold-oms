import type { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { OrderRepository } from './OrderRepository'
import { CustomerRepository } from './CustomerRepository'
import { CustomerBranchRepository } from './CustomerBranchRepository'
import { CustomerProductPriceRepository } from './CustomerProductPriceRepository'
import { ProductRepository } from './ProductRepository'
import { DeliveryRepository } from './DeliveryRepository'
import { DeliveryRouteRepository } from './DeliveryRouteRepository'
import { DriverRepository } from './DriverRepository'
import { VehicleRepository } from './VehicleRepository'
import { TechnicianRepository } from './TechnicianRepository'
import { ServiceTicketRepository } from './ServiceTicketRepository'
import { UserRepository } from './UserRepository'

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

export { CustomerRepository } from './CustomerRepository'
export type {
  CustomerWithBranches,
  CustomerStats,
  CustomerSearchResult,
} from './CustomerRepository'

export { CustomerBranchRepository } from './CustomerBranchRepository'
export type {
  BranchWithRelations,
  BranchLocation,
  BranchServiceHistory,
} from './CustomerBranchRepository'

export { CustomerProductPriceRepository } from './CustomerProductPriceRepository'
export type {
  CustomPriceWithProduct,
  PriceAdjustment,
} from './CustomerProductPriceRepository'

export { ProductRepository } from './ProductRepository'
export type {
  ProductWithPricing,
  ProductStats,
} from './ProductRepository'

export { DeliveryRepository } from './DeliveryRepository'
export type {
  DeliveryWithRelations,
  DeliveryStats,
} from './DeliveryRepository'

export { DeliveryRouteRepository } from './DeliveryRouteRepository'
export type {
  RouteWithStops,
  RouteStats,
} from './DeliveryRouteRepository'

export { DriverRepository } from './DriverRepository'
export type {
  DriverWithRelations,
  DriverStats,
} from './DriverRepository'

export { VehicleRepository } from './VehicleRepository'
export type {
  VehicleWithRelations,
  VehicleStats,
} from './VehicleRepository'

export { TechnicianRepository } from './TechnicianRepository'
export type {
  TechnicianWithRelations,
  TechnicianStats,
} from './TechnicianRepository'

export { ServiceTicketRepository } from './ServiceTicketRepository'
export type {
  ServiceTicketWithRelations,
  ServiceTicketStats,
} from './ServiceTicketRepository'

export { UserRepository } from './UserRepository'
export type {
  UserSafe,
  UserSearchResult,
  UserStats,
} from './UserRepository'

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
   * Get CustomerRepository instance
   *
   * @returns CustomerRepository singleton
   */
  getCustomerRepository(): CustomerRepository {
    if (!this.repositories.has('customer')) {
      this.repositories.set('customer', new CustomerRepository(this.prismaClient))
    }
    return this.repositories.get('customer')!
  }

  /**
   * Get CustomerBranchRepository instance
   *
   * @returns CustomerBranchRepository singleton
   */
  getCustomerBranchRepository(): CustomerBranchRepository {
    if (!this.repositories.has('customerBranch')) {
      this.repositories.set('customerBranch', new CustomerBranchRepository(this.prismaClient))
    }
    return this.repositories.get('customerBranch')!
  }

  /**
   * Get CustomerProductPriceRepository instance
   *
   * @returns CustomerProductPriceRepository singleton
   */
  getCustomerProductPriceRepository(): CustomerProductPriceRepository {
    if (!this.repositories.has('customerProductPrice')) {
      this.repositories.set('customerProductPrice', new CustomerProductPriceRepository(this.prismaClient))
    }
    return this.repositories.get('customerProductPrice')!
  }

  /**
   * Get ProductRepository instance
   *
   * @returns ProductRepository singleton
   */
  getProductRepository(): ProductRepository {
    if (!this.repositories.has('product')) {
      this.repositories.set('product', new ProductRepository(this.prismaClient))
    }
    return this.repositories.get('product')!
  }

  /**
   * Get DeliveryRepository instance
   *
   * @returns DeliveryRepository singleton
   */
  getDeliveryRepository(): DeliveryRepository {
    if (!this.repositories.has('delivery')) {
      this.repositories.set('delivery', new DeliveryRepository(this.prismaClient))
    }
    return this.repositories.get('delivery')!
  }

  /**
   * Get DeliveryRouteRepository instance
   *
   * @returns DeliveryRouteRepository singleton
   */
  getDeliveryRouteRepository(): DeliveryRouteRepository {
    if (!this.repositories.has('deliveryRoute')) {
      this.repositories.set('deliveryRoute', new DeliveryRouteRepository(this.prismaClient))
    }
    return this.repositories.get('deliveryRoute')!
  }

  /**
   * Get DriverRepository instance
   *
   * @returns DriverRepository singleton
   */
  getDriverRepository(): DriverRepository {
    if (!this.repositories.has('driver')) {
      this.repositories.set('driver', new DriverRepository(this.prismaClient))
    }
    return this.repositories.get('driver')!
  }

  /**
   * Get VehicleRepository instance
   *
   * @returns VehicleRepository singleton
   */
  getVehicleRepository(): VehicleRepository {
    if (!this.repositories.has('vehicle')) {
      this.repositories.set('vehicle', new VehicleRepository(this.prismaClient))
    }
    return this.repositories.get('vehicle')!
  }

  /**
   * Get TechnicianRepository instance
   *
   * @returns TechnicianRepository singleton
   */
  getTechnicianRepository(): TechnicianRepository {
    if (!this.repositories.has('technician')) {
      this.repositories.set('technician', new TechnicianRepository(this.prismaClient))
    }
    return this.repositories.get('technician')!
  }

  /**
   * Get ServiceTicketRepository instance
   *
   * @returns ServiceTicketRepository singleton
   */
  getServiceTicketRepository(): ServiceTicketRepository {
    if (!this.repositories.has('serviceTicket')) {
      this.repositories.set('serviceTicket', new ServiceTicketRepository(this.prismaClient))
    }
    return this.repositories.get('serviceTicket')!
  }

  /**
   * Get UserRepository instance
   *
   * @returns UserRepository singleton
   */
  getUserRepository(): UserRepository {
    if (!this.repositories.has('user')) {
      this.repositories.set('user', new UserRepository(this.prismaClient))
    }
    return this.repositories.get('user')!
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
 * Get default CustomerRepository instance
 *
 * @returns CustomerRepository singleton
 */
export const getCustomerRepository = (): CustomerRepository => {
  return defaultRegistry.getCustomerRepository()
}

/**
 * Get default CustomerBranchRepository instance
 *
 * @returns CustomerBranchRepository singleton
 */
export const getCustomerBranchRepository = (): CustomerBranchRepository => {
  return defaultRegistry.getCustomerBranchRepository()
}

/**
 * Get default CustomerProductPriceRepository instance
 *
 * @returns CustomerProductPriceRepository singleton
 */
export const getCustomerProductPriceRepository = (): CustomerProductPriceRepository => {
  return defaultRegistry.getCustomerProductPriceRepository()
}

/**
 * Get default ProductRepository instance
 *
 * @returns ProductRepository singleton
 */
export const getProductRepository = (): ProductRepository => {
  return defaultRegistry.getProductRepository()
}

/**
 * Get default DeliveryRepository instance
 *
 * @returns DeliveryRepository singleton
 */
export const getDeliveryRepository = (): DeliveryRepository => {
  return defaultRegistry.getDeliveryRepository()
}

/**
 * Get default DeliveryRouteRepository instance
 *
 * @returns DeliveryRouteRepository singleton
 */
export const getDeliveryRouteRepository = (): DeliveryRouteRepository => {
  return defaultRegistry.getDeliveryRouteRepository()
}

/**
 * Get default DriverRepository instance
 *
 * @returns DriverRepository singleton
 */
export const getDriverRepository = (): DriverRepository => {
  return defaultRegistry.getDriverRepository()
}

/**
 * Get default VehicleRepository instance
 *
 * @returns VehicleRepository singleton
 */
export const getVehicleRepository = (): VehicleRepository => {
  return defaultRegistry.getVehicleRepository()
}

/**
 * Get default TechnicianRepository instance
 *
 * @returns TechnicianRepository singleton
 */
export const getTechnicianRepository = (): TechnicianRepository => {
  return defaultRegistry.getTechnicianRepository()
}

/**
 * Get default ServiceTicketRepository instance
 *
 * @returns ServiceTicketRepository singleton
 */
export const getServiceTicketRepository = (): ServiceTicketRepository => {
  return defaultRegistry.getServiceTicketRepository()
}

/**
 * Get default UserRepository instance
 *
 * @returns UserRepository singleton
 */
export const getUserRepository = (): UserRepository => {
  return defaultRegistry.getUserRepository()
}

/**
 * Convenience function to get repository registry
 *
 * @returns Default RepositoryRegistry instance
 */
export const getRepositories = (): RepositoryRegistry => {
  return defaultRegistry
}
