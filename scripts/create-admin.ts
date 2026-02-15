import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Hash the password
    const passwordHash = await bcrypt.hash('admin123', 10)
    
    // Delete existing admin if exists
    await prisma.user.deleteMany({
      where: { email: 'admin@evercold.uz' }
    })
    
    // Create new admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@evercold.uz',
        name: 'Administrator',
        passwordHash: passwordHash,
        role: 'ADMIN',
        isActive: true,
      }
    })
    
    console.log('✅ Admin user created successfully!')
    console.log('Email:', admin.email)
    console.log('Password: admin123')
  } catch (error) {
    console.error('Error creating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
