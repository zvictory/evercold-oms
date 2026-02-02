import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Checking drivers and vehicles in database...\n');

  // Check drivers
  const drivers = await prisma.driver.findMany({
    include: {
      vehicles: true
    }
  });

  console.log(`Found ${drivers.length} drivers:`);
  drivers.forEach((driver, i) => {
    console.log(`\n${i + 1}. ${driver.name}`);
    console.log(`   Phone: ${driver.phone}`);
    console.log(`   License: ${driver.licenseNumber}`);
    console.log(`   Status: ${driver.status}`);
    if (driver.vehicles.length > 0) {
      console.log(`   Vehicles: ${driver.vehicles.map(v => v.plateNumber).join(', ')}`);
    }
  });

  // Check vehicles
  const vehicles = await prisma.vehicle.findMany({
    include: {
      driver: true
    }
  });

  console.log(`\n\nFound ${vehicles.length} vehicles:`);
  vehicles.forEach((vehicle, i) => {
    console.log(`\n${i + 1}. ${vehicle.plateNumber}`);
    console.log(`   Model: ${vehicle.model}`);
    console.log(`   Type: ${vehicle.type}`);
    console.log(`   Status: ${vehicle.status}`);
    console.log(`   Capacity: ${vehicle.capacity || 'N/A'} kg`);
    if (vehicle.driver) {
      console.log(`   Assigned to: ${vehicle.driver.name}`);
    }
  });

  console.log(`\n\nDatabase: ${process.env.DATABASE_URL}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
