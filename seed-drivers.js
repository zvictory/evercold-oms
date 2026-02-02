const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Delete existing drivers
    await prisma.driver.deleteMany({})

    // Create test drivers
    const drivers = await prisma.driver.createMany({
      data: [
        {
          name: 'Bekzod Tursunov',
          phone: '+998901234567',
          licenseNumber: 'AA1234567',
          status: 'ACTIVE',
          latitude: 41.2900,
          longitude: 69.2500,
          locationStatus: 'MOVING',
          lastLocationUpdate: new Date(),
        },
        {
          name: 'Aziz Rahimov',
          phone: '+998901234568',
          licenseNumber: 'AA1234568',
          status: 'ACTIVE',
          latitude: 41.3200,
          longitude: 69.2800,
          locationStatus: 'STOPPED',
          lastLocationUpdate: new Date(),
        },
        {
          name: 'Jamshid Karimov',
          phone: '+998901234569',
          licenseNumber: 'AA1234569',
          status: 'ACTIVE',
          latitude: 41.2858,
          longitude: 69.2035,
          locationStatus: 'IDLE',
          lastLocationUpdate: new Date(Date.now() - 10 * 60 * 1000),
        },
      ],
    })

    console.log('✅ Seeded drivers:', drivers.count)
    
    const allDrivers = await prisma.driver.findMany({
      select: { id: true, name: true, phone: true, latitude: true, longitude: true, locationStatus: true }
    })
    console.log(JSON.stringify(allDrivers, null, 2))
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
