import { Prisma, CustomerGroup } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import { BaseRepository } from './BaseRepository'

export class CustomerGroupRepository extends BaseRepository<
  CustomerGroup,
  Prisma.CustomerGroupDelegate,
  Prisma.CustomerGroupCreateInput,
  Prisma.CustomerGroupUpdateInput,
  Prisma.CustomerGroupWhereInput,
  Prisma.CustomerGroupWhereUniqueInput,
  Prisma.CustomerGroupInclude,
  Prisma.CustomerGroupSelect,
  Prisma.CustomerGroupOrderByWithRelationInput
> {
  protected modelName = 'CustomerGroup'
  protected delegate: Prisma.CustomerGroupDelegate

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.delegate = prisma.customerGroup
  }

  protected getDelegate(): Prisma.CustomerGroupDelegate {
    return this.prisma.customerGroup
  }

  /**
   * List all active groups ordered by sortOrder
   */
  async listActive(): Promise<CustomerGroup[]> {
    return this.findMany(
      { isActive: true },
      { sortOrder: 'asc' }
    )
  }

  /**
   * List groups with customer and price entry counts
   */
  async listWithCounts() {
    return this.prisma.customerGroup.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            customers: true,
            priceLists: true,
          },
        },
      },
    })
  }

  /**
   * Find group by name
   */
  async findByName(name: string): Promise<CustomerGroup | null> {
    return this.findFirst({ name })
  }
}
