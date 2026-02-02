import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL || 'postgresql://zafar@localhost:5432/evercold_crm'

// Create Pool with individual config
const pool = new Pool({
  user: 'evercold_user',
  password: '2d075a53447d1d4ac4080f17d5a07f32',
  host: 'localhost',
  port: 5432,
  database: 'evercold_production',
})

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ pool } as any),
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})
