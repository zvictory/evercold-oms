import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://zafar@localhost:5432/evercold_crm',
})

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
})

async function createAdmin() {
  try {
    const email = 'admin@evercold.uz'
    const password = 'EverCold2026!'
    
    console.log('Checking for existing user...')
    const existing = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existing) {
      console.log('✓ User already exists')
      console.log(`  Email: ${existing.email}`)
      console.log(`  Role: ${existing.role}`)
      return
    }
    
    console.log('Creating admin user...')
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Admin User',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    })
    
    console.log('✓ Admin user created!')
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

createAdmin()
