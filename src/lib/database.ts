import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') })

// Entity imports - will be added in Task 3 and subsequent tasks
// For now, we use a dynamic import approach to load entities
const entities: any[] = []

// Get database credentials from environment or use defaults
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/evercold_crm'

// Parse connection URL (fallback to individual parameters)
let dbConfig = {
  host: 'localhost',
  port: 5432,
  username: 'zafar',
  password: '',
  database: 'evercold_crm',
}

// Try to parse DATABASE_URL if it's a full connection string
if (DATABASE_URL.startsWith('postgresql://')) {
  const url = new URL(DATABASE_URL)
  dbConfig = {
    host: url.hostname || 'localhost',
    port: parseInt(url.port || '5432'),
    username: url.username || 'zafar',
    password: url.password || '',
    database: url.pathname.substring(1).split('?')[0] || 'evercold_crm',
  }
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: entities, // Will be populated as entity files are created
  synchronize: false, // Don't auto-sync schema, we manage migrations manually
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  ssl: false,
  poolSize: 10,
  connectionTimeoutMillis: 5000,
})

// Register entity classes (to be called from entity files)
export function registerEntity(entity: any) {
  if (!entities.includes(entity)) {
    entities.push(entity)
  }
}

// Get all registered entities
export function getRegisteredEntities(): any[] {
  return entities
}

// Initialize DataSource on first import
let initialized = false

export async function initializeDatabase() {
  if (initialized) return AppDataSource

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
      initialized = true
      console.log('✅ TypeORM database connection initialized')
    }
    return AppDataSource
  } catch (error: any) {
    console.error('❌ Failed to initialize database:', error.message)
    throw error
  }
}

// Get DataSource or throw error if not initialized
export function getDataSource(): DataSource {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return AppDataSource
}
