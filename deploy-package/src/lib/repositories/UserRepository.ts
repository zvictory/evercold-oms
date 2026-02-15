import { Prisma, User, UserRole } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import {
  BaseRepository,
  RepositoryError,
} from './BaseRepository'

/**
 * User for authentication (without password hash)
 */
export type UserSafe = Omit<User, 'passwordHash'>

/**
 * User search result
 */
export interface UserSearchResult {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
}

/**
 * User statistics
 */
export interface UserStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  usersByRole: Record<UserRole, number>
}

/**
 * Repository for User operations
 */
export class UserRepository extends BaseRepository<
  User,
  Prisma.UserDelegate,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereInput,
  Prisma.UserWhereUniqueInput,
  Prisma.UserSelect,
  Prisma.UserSelect,
  Prisma.UserOrderByWithRelationInput
> {
  protected modelName = 'User'
  protected delegate: Prisma.UserDelegate

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.delegate = prisma.user
  }

  protected getDelegate(): Prisma.UserDelegate {
    return this.prisma.user
  }

  /**
   * Find user by email
   *
   * @param email - User email
   * @returns User or null
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findFirst({
        where: { email },
      })
    } catch (error) {
      throw this.handleError('findByEmail', error)
    }
  }

  /**
   * Find user by email (safe version without password hash)
   *
   * @param email - User email
   * @returns User without password hash or null
   */
  async findByEmailSafe(email: string): Promise<UserSafe | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return user as UserSafe | null
    } catch (error) {
      throw this.handleError('findByEmailSafe', error)
    }
  }

  /**
   * Search users by name
   *
   * @param name - User name (partial match)
   * @param limit - Max results
   * @returns Array of users
   */
  async search(name: string, limit?: number): Promise<UserSearchResult[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          name: {
            contains: name,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
        take: limit,
        orderBy: { name: 'asc' },
      })

      return users as UserSearchResult[]
    } catch (error) {
      throw this.handleError('search', error)
    }
  }

  /**
   * Find all active users
   *
   * @returns Array of active users
   */
  async findActive(): Promise<User[]> {
    try {
      return await this.prisma.user.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findActive', error)
    }
  }

  /**
   * Find users by role
   *
   * @param role - User role
   * @returns Array of users
   */
  async findByRole(role: UserRole): Promise<User[]> {
    try {
      return await this.prisma.user.findMany({
        where: { role },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw this.handleError('findByRole', error)
    }
  }

  /**
   * Authenticate user with email and password hash
   *
   * @param email - User email
   * @param passwordHash - Password hash
   * @returns User or null
   */
  async authenticate(email: string, passwordHash: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email },
      })

      if (!user) {
        return null
      }

      // In a real application, use bcrypt.compare() instead
      if (user.passwordHash === passwordHash) {
        return user
      }

      return null
    } catch (error) {
      throw this.handleError('authenticate', error)
    }
  }

  /**
   * Update user password hash
   *
   * @param userId - User ID
   * @param newPasswordHash - New password hash
   * @returns Updated user
   */
  async updatePassword(userId: string, newPasswordHash: string): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      })
    } catch (error) {
      throw this.handleError('updatePassword', error)
    }
  }

  /**
   * Update user role
   *
   * @param userId - User ID
   * @param role - New role
   * @returns Updated user
   */
  async updateRole(userId: string, role: UserRole): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { role },
      })
    } catch (error) {
      throw this.handleError('updateRole', error)
    }
  }

  /**
   * Deactivate user
   *
   * @param userId - User ID
   * @returns Updated user
   */
  async deactivate(userId: string): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      })
    } catch (error) {
      throw this.handleError('deactivate', error)
    }
  }

  /**
   * Activate user
   *
   * @param userId - User ID
   * @returns Updated user
   */
  async activate(userId: string): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      })
    } catch (error) {
      throw this.handleError('activate', error)
    }
  }

  /**
   * Get user statistics
   *
   * @returns User statistics
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          role: true,
          isActive: true,
        },
      })

      const totalUsers = users.length
      const activeUsers = users.filter((u) => u.isActive).length
      const inactiveUsers = totalUsers - activeUsers

      const usersByRole: Record<UserRole, number> = {
        ADMIN: 0,
        MANAGER: 0,
        VIEWER: 0,
      }

      for (const user of users) {
        usersByRole[user.role]++
      }

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
      }
    } catch (error) {
      throw this.handleError('getUserStats', error)
    }
  }
}
