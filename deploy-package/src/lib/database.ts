import 'reflect-metadata'
import { DataSource } from 'typeorm'

/**
 * TypeORM Database Configuration
 * Supports three configuration methods (in order of precedence):
 * 1. DATABASE_URL environment variable (full PostgreSQL connection string)
 * 2. Individual environment variables (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
 * 3. Defaults (localhost:5432, postgres user, evercold_production database)
 */

interface DatabaseConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
}

/**
 * Parse PostgreSQL connection URL into individual components
 * Throws descriptive error if URL is malformed
 */
function parseConnectionUrl(urlString: string): DatabaseConfig {
  try {
    const url = new URL(urlString)

    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
      throw new Error('Invalid protocol. Expected postgresql:// or postgres://')
    }

    const database = url.pathname.slice(1) // Remove leading /
    if (!database) {
      throw new Error('DATABASE_URL must include database name')
    }

    return {
      host: url.hostname || 'localhost',
      port: url.port ? parseInt(url.port, 10) : 5432,
      username: url.username || 'postgres',
      password: url.password || '',
      database,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to parse DATABASE_URL: ${errorMessage}`)
  }
}

/**
 * Build database configuration from environment variables
 * Preference order: DATABASE_URL > individual env vars > defaults
 */
function buildDatabaseConfig(): DatabaseConfig {
  // Prefer complete DATABASE_URL if provided
  if (process.env.DATABASE_URL) {
    return parseConnectionUrl(process.env.DATABASE_URL)
  }

  // Fall back to individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'evercold_production',
  }
}

const dbConfig = buildDatabaseConfig()

// Entity registry: Entities will be registered dynamically as they are created in Tasks 3-7
const registeredEntities: Function[] = []

/**
 * Register an entity class for the TypeORM DataSource
 * This allows phased entity creation during the migration
 */
export function registerEntity(entity: Function): void {
  if (!registeredEntities.includes(entity)) {
    registeredEntities.push(entity)
  }
}

/**
 * Get all currently registered entity classes
 */
export function getRegisteredEntities(): Function[] {
  return registeredEntities
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: registeredEntities, // Will be populated as entity files are created
  synchronize: false, // Don't auto-sync schema; we manage migrations manually
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  extra: {
    max: 10, // Connection pool size
    connectionTimeoutMillis: 5000,
  },
})

// Initialize DataSource on first import
let initialized = false

/**
 * Initialize the TypeORM DataSource
 * Idempotent: Safe to call multiple times
 * Returns the initialized DataSource instance
 */
export async function initializeDatabase(): Promise<DataSource> {
  if (initialized) {
    return AppDataSource
  }

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
      initialized = true
      console.log('✅ TypeORM database connection initialized')
    }
    return AppDataSource
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Failed to initialize database:', errorMessage)
    throw error
  }
}

/**
 * Get initialized DataSource instance
 * Throws error if database has not been initialized
 * Safe for use after initializeDatabase() has been called
 */
export function getDataSource(): DataSource {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return AppDataSource
}
