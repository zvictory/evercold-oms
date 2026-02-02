import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://zafar@localhost:5432/evercold_crm',
    max: 10, // Maximum number of connections in pool
    idleTimeoutMillis: 30000, // How long a client sits idle before being closed
    connectionTimeoutMillis: 2000, // How long to wait for a new connection from the pool
  })

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const prisma =
  globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
