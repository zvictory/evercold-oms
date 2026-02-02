import('dotenv/config').then(() => {
  import('@prisma/client').then(({ PrismaClient, UserRole }) => {
    import('bcryptjs').then((bcryptModule) => {
      const bcrypt = bcryptModule.default
      const prisma = new PrismaClient()

      async function seedAdmin() {
        const ADMIN_EMAIL = 'admin@evercold.uz'
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'EverCold2026!'
        const SALT_ROUNDS = 10

        try {
          console.log('Checking for existing admin...')
          const existingAdmin = await prisma.user.findUnique({
            where: { email: ADMIN_EMAIL },
          })

          if (existingAdmin) {
            console.log(`✅ Admin already exists: ${ADMIN_EMAIL}`)
            return existingAdmin
          }

          console.log('Creating admin user...')
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

        } catch (error) {
          console.error('❌ Error:', error.message)
        } finally {
          await prisma.$disconnect()
        }
      }

      seedAdmin()
    })
  })
})
