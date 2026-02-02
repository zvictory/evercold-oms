import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Get DATABASE_URL from environment, with fallback
// DATABASE_URL should be: postgresql://user@host:port/database
const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.warn('[Prisma] DATABASE_URL not set, using default: postgresql://zafar@localhost:5432/evercold_crm')
    return 'postgresql://zafar@localhost:5432/evercold_crm'
  }
  console.log('[Prisma] Using DATABASE_URL:', url.replace(/password[^@]*@/, 'password:***@'))
  return url
}

// Create Pool using DATABASE_URL
const pool = new Pool({
  connectionString: getDatabaseUrl(),
})

export const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})
