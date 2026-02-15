import { Prisma } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'

/**
 * Transaction client type for Prisma transactions
 */
export type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  /** Page number (1-based) */
  page?: number
  /** Items per page */
  pageSize?: number
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  /** Array of items for current page */
  data: T[]
  /** Pagination metadata */
  pagination: {
    /** Current page number */
    page: number
    /** Items per page */
    pageSize: number
    /** Total number of items */
    total: number
    /** Total number of pages */
    totalPages: number
    /** Whether there is a next page */
    hasNext: boolean
    /** Whether there is a previous page */
    hasPrev: boolean
  }
}

/**
 * Base repository error class
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}

/**
 * Generic base repository providing common CRUD operations
 *
 * @template TModel - The Prisma model type
 * @template TDelegate - The Prisma delegate type for the model
 * @template TCreateInput - The input type for create operations
 * @template TUpdateInput - The input type for update operations
 * @template TWhereInput - The where clause type for queries
 * @template TWhereUniqueInput - The unique where clause type
 * @template TInclude - The include clause type
 * @template TSelect - The select clause type
 * @template TOrderBy - The orderBy clause type
 */
export abstract class BaseRepository<
  TModel,
  TDelegate extends {
    findUnique: any
    findFirst: any
    findMany: any
    create: any
    update: any
    delete: any
    count: any
    deleteMany: any
    updateMany: any
  },
  TCreateInput = any,
  TUpdateInput = any,
  TWhereInput = any,
  TWhereUniqueInput = any,
  TInclude = any,
  TSelect = any,
  TOrderBy = any
> {
  protected prisma: PrismaClient
  protected abstract delegate: TDelegate
  protected abstract modelName: string

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Get the Prisma delegate for the model
   * Must be implemented by child classes
   */
  protected abstract getDelegate(client?: TransactionClient): TDelegate

  /**
   * Find a single record by unique identifier
   *
   * @param where - Unique where clause
   * @param include - Relations to include
   * @param select - Fields to select
   * @returns The found record or null
   * @throws RepositoryError if database query fails
   */
  async findUnique(
    where: TWhereUniqueInput,
    include?: TInclude,
    select?: TSelect
  ): Promise<TModel | null> {
    try {
      const delegate = this.getDelegate()
      const result = await delegate.findUnique({
        where,
        include,
        select,
      })
      return result as TModel | null
    } catch (error) {
      throw this.handleError('findUnique', error)
    }
  }

  /**
   * Find a single record by unique identifier, throw if not found
   *
   * @param where - Unique where clause
   * @param include - Relations to include
   * @param select - Fields to select
   * @returns The found record
   * @throws RepositoryError if not found or database query fails
   */
  async findUniqueOrThrow(
    where: TWhereUniqueInput,
    include?: TInclude,
    select?: TSelect
  ): Promise<TModel> {
    const result = await this.findUnique(where, include, select)
    if (!result) {
      throw new RepositoryError(
        `${this.modelName} not found`,
        'NOT_FOUND'
      )
    }
    return result
  }

  /**
   * Find first record matching criteria
   *
   * @param where - Where clause
   * @param orderBy - Order by clause
   * @param include - Relations to include
   * @param select - Fields to select
   * @returns The found record or null
   * @throws RepositoryError if database query fails
   */
  async findFirst(
    where?: TWhereInput,
    orderBy?: TOrderBy,
    include?: TInclude,
    select?: TSelect
  ): Promise<TModel | null> {
    try {
      const delegate = this.getDelegate()
      const result = await delegate.findFirst({
        where,
        orderBy,
        include,
        select,
      })
      return result as TModel | null
    } catch (error) {
      throw this.handleError('findFirst', error)
    }
  }

  /**
   * Find many records matching criteria
   *
   * @param where - Where clause
   * @param orderBy - Order by clause
   * @param include - Relations to include
   * @param select - Fields to select
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @returns Array of matching records
   * @throws RepositoryError if database query fails
   */
  async findMany(
    where?: TWhereInput,
    orderBy?: TOrderBy,
    include?: TInclude,
    select?: TSelect,
    skip?: number,
    take?: number
  ): Promise<TModel[]> {
    try {
      const delegate = this.getDelegate()
      const result = await delegate.findMany({
        where,
        orderBy,
        include,
        select,
        skip,
        take,
      })
      return result as TModel[]
    } catch (error) {
      throw this.handleError('findMany', error)
    }
  }

  /**
   * Find many records with pagination
   *
   * @param where - Where clause
   * @param orderBy - Order by clause
   * @param pagination - Pagination options
   * @param include - Relations to include
   * @param select - Fields to select
   * @returns Paginated result with data and metadata
   * @throws RepositoryError if database query fails
   */
  async findManyPaginated(
    where?: TWhereInput,
    orderBy?: TOrderBy,
    pagination?: PaginationOptions,
    include?: TInclude,
    select?: TSelect
  ): Promise<PaginatedResult<TModel>> {
    const page = pagination?.page ?? 1
    const pageSize = pagination?.pageSize ?? 50
    const skip = (page - 1) * pageSize

    try {
      const delegate = this.getDelegate()

      const [data, total] = await Promise.all([
        delegate.findMany({
          where,
          orderBy,
          include,
          select,
          skip,
          take: pageSize,
        }),
        delegate.count({ where }),
      ])

      const totalPages = Math.ceil(total / pageSize)

      return {
        data: data as TModel[],
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      throw this.handleError('findManyPaginated', error)
    }
  }

  /**
   * Count records matching criteria
   *
   * @param where - Where clause
   * @returns Number of matching records
   * @throws RepositoryError if database query fails
   */
  async count(where?: TWhereInput): Promise<number> {
    try {
      const delegate = this.getDelegate()
      return await delegate.count({ where })
    } catch (error) {
      throw this.handleError('count', error)
    }
  }

  /**
   * Create a new record
   *
   * @param data - Data to create
   * @param include - Relations to include in returned record
   * @param select - Fields to select in returned record
   * @returns The created record
   * @throws RepositoryError if database query fails
   */
  async create(
    data: TCreateInput,
    include?: TInclude,
    select?: TSelect
  ): Promise<TModel> {
    try {
      const delegate = this.getDelegate()
      const result = await delegate.create({
        data,
        include,
        select,
      })
      return result as TModel
    } catch (error) {
      throw this.handleError('create', error)
    }
  }

  /**
   * Update a record by unique identifier
   *
   * @param where - Unique where clause
   * @param data - Data to update
   * @param include - Relations to include in returned record
   * @param select - Fields to select in returned record
   * @returns The updated record
   * @throws RepositoryError if database query fails
   */
  async update(
    where: TWhereUniqueInput,
    data: TUpdateInput,
    include?: TInclude,
    select?: TSelect
  ): Promise<TModel> {
    try {
      const delegate = this.getDelegate()
      const result = await delegate.update({
        where,
        data,
        include,
        select,
      })
      return result as TModel
    } catch (error) {
      throw this.handleError('update', error)
    }
  }

  /**
   * Update many records matching criteria
   *
   * @param where - Where clause
   * @param data - Data to update
   * @returns Count of updated records
   * @throws RepositoryError if database query fails
   */
  async updateMany(
    where: TWhereInput,
    data: TUpdateInput
  ): Promise<number> {
    try {
      const delegate = this.getDelegate()
      const result = await delegate.updateMany({
        where,
        data,
      })
      return result.count
    } catch (error) {
      throw this.handleError('updateMany', error)
    }
  }

  /**
   * Delete a record by unique identifier
   *
   * @param where - Unique where clause
   * @returns The deleted record
   * @throws RepositoryError if database query fails
   */
  async delete(where: TWhereUniqueInput): Promise<TModel> {
    try {
      const delegate = this.getDelegate()
      const result = await delegate.delete({ where })
      return result as TModel
    } catch (error) {
      throw this.handleError('delete', error)
    }
  }

  /**
   * Delete many records matching criteria
   *
   * @param where - Where clause
   * @returns Count of deleted records
   * @throws RepositoryError if database query fails
   */
  async deleteMany(where?: TWhereInput): Promise<number> {
    try {
      const delegate = this.getDelegate()
      const result = await delegate.deleteMany({ where })
      return result.count
    } catch (error) {
      throw this.handleError('deleteMany', error)
    }
  }

  /**
   * Execute a function within a transaction
   *
   * @param fn - Function to execute with transaction client
   * @returns Result of the function
   * @throws RepositoryError if transaction fails
   */
  async transaction<R>(
    fn: (client: TransactionClient) => Promise<R>
  ): Promise<R> {
    try {
      return await this.prisma.$transaction(fn)
    } catch (error) {
      throw this.handleError('transaction', error)
    }
  }

  /**
   * Check if a record exists
   *
   * @param where - Where clause
   * @returns True if at least one record exists
   * @throws RepositoryError if database query fails
   */
  async exists(where: TWhereInput): Promise<boolean> {
    const count = await this.count(where)
    return count > 0
  }

  /**
   * Handle and transform database errors
   *
   * @param operation - The operation that failed
   * @param error - The error that occurred
   * @returns RepositoryError with appropriate message and code
   */
  protected handleError(operation: string, error: unknown): RepositoryError {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return new RepositoryError(
            `${this.modelName}: Unique constraint violation`,
            'UNIQUE_CONSTRAINT_VIOLATION',
            error
          )
        case 'P2003':
          return new RepositoryError(
            `${this.modelName}: Foreign key constraint violation`,
            'FOREIGN_KEY_CONSTRAINT_VIOLATION',
            error
          )
        case 'P2025':
          return new RepositoryError(
            `${this.modelName}: Record not found`,
            'NOT_FOUND',
            error
          )
        default:
          return new RepositoryError(
            `${this.modelName}: Database error in ${operation}`,
            'DATABASE_ERROR',
            error
          )
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return new RepositoryError(
        `${this.modelName}: Validation error in ${operation}`,
        'VALIDATION_ERROR',
        error
      )
    }

    if (error instanceof RepositoryError) {
      return error
    }

    return new RepositoryError(
      `${this.modelName}: Unknown error in ${operation}`,
      'UNKNOWN_ERROR',
      error
    )
  }
}
