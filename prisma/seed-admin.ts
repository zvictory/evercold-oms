import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedAdmin() {
  const ADMIN_EMAIL = 'admin@evercold.uz'
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'EverCold2026!'
  const SALT_ROUNDS = 10

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    })

    if (existingAdmin) {
      console.log(`✅ Admin already exists: ${ADMIN_EMAIL}`)
      // Update to ADMIN role if needed
      if (existingAdmin.role !== UserRole.ADMIN) {
        await prisma.user.update({
          where: { email: ADMIN_EMAIL },
          data: { role: UserRole.ADMIN },
        })
        console.log(`⚠️  Updated role to ADMIN`)
      }
      return existingAdmin
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS)

    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        role: UserRole.ADMIN,
        name: 'System Administrator',
        isActive: true,
      },
    })

    console.log(`🎉 Admin user created!`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Password: ${ADMIN_PASSWORD}`)
    console.log(`   ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!`)

    return admin
  } catch (error) {
    console.error('❌ Failed to seed admin:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedAdmin()
