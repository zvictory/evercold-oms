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

async function resetPassword() {
  try {
    const email = 'admin@evercold.uz'
    const newPassword = 'EverCold2026!'
    
    console.log('Resetting password for admin@evercold.uz...')
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    const user = await prisma.user.update({
      where: { email },
      data: {
        passwordHash: hashedPassword
      }
    })
    
    console.log('✓ Password reset successfully!')
    console.log(`  Email: ${user.email}`)
    console.log(`  New Password: ${newPassword}`)
    console.log(`  Try logging in now at: http://localhost:3000/ru/login`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

resetPassword()
