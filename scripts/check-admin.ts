import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@evercold.uz' },
    })
    
    if (user) {
      console.log('USER_FOUND')
      console.log('Name:', user.name)
      console.log('Role:', user.role)
      console.log('Is Active:', user.isActive)
    } else {
      console.log('USER_NOT_FOUND')
    }
    
    const count = await prisma.user.count()
    console.log('Total Users:', count)
  } catch (error) {
    console.error('ERROR:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
