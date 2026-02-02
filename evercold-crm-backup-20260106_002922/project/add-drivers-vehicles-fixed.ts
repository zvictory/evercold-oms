import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function addVehiclesAndDrivers() {
  console.log('🚗 Adding vehicles and drivers...\n');

  // Add drivers
  const driversData = [
    { name: 'NASRITDINOV ZUXRITDIN ERKINOVICH', phone: '+998901234567', licenseNumber: 'DRV001' },
    { name: 'Ummat', phone: '+998901234568', licenseNumber: 'DRV002' },
    { name: 'Viktor', phone: '+998901234569', licenseNumber: 'DRV003' },
    { name: 'Azamat', phone: '+998901234570', licenseNumber: 'DRV004' },
    { name: 'Elomon', phone: '+998901234571', licenseNumber: 'DRV005' },
  ];

  console.log('👥 Adding drivers...');
  for (const driverData of driversData) {
    try {
      const driver = await prisma.driver.create({
        data: {
          name: driverData.name,
          phone: driverData.phone,
          licenseNumber: driverData.licenseNumber,
          status: 'ACTIVE',
        },
      });
      console.log(`✅ Added driver: ${driver.name} (${driver.licenseNumber})`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Driver ${driverData.name} already exists`);
      } else {
        console.log(`❌ Error adding driver ${driverData.name}: ${error.message}`);
      }
    }
  }

  // Add vehicles
  const vehiclesData = [
    { plateNumber: '01 522 OLA', model: 'DAMAS-2', type: 'VAN' as const },
    { plateNumber: '01 R 153 BB', model: 'DAMAS-2', type: 'VAN' as const },
    { plateNumber: '01 732 BGA', model: 'KIA BONGO', type: 'TRUCK' as const },
    { plateNumber: '01 298 QMA', model: 'DAMAS-2', type: 'VAN' as const },
    { plateNumber: '01 924 NLA', model: 'DAMAS-2', type: 'VAN' as const },
    { plateNumber: '01 612 RJA', model: 'DAMAS-2', type: 'VAN' as const },
    { plateNumber: '01 685 ZMA', model: 'DAMAS-2', type: 'VAN' as const },
  ];

  console.log('\n🚗 Adding vehicles...');
  for (const vehicleData of vehiclesData) {
    try {
      const vehicle = await prisma.vehicle.create({
        data: {
          plateNumber: vehicleData.plateNumber,
          model: vehicleData.model,
          type: vehicleData.type,
          status: 'AVAILABLE',
        },
      });
      console.log(`✅ Added vehicle: ${vehicle.plateNumber} (${vehicle.model})`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Vehicle ${vehicleData.plateNumber} already exists`);
      } else {
        console.log(`❌ Error adding vehicle ${vehicleData.plateNumber}: ${error.message}`);
      }
    }
  }

  console.log('\n✅ Done!');
  console.log(`\nSummary:`);
  const driverCount = await prisma.driver.count();
  const vehicleCount = await prisma.vehicle.count();
  console.log(`👥 Total drivers: ${driverCount}`);
  console.log(`🚗 Total vehicles: ${vehicleCount}`);
}

addVehiclesAndDrivers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
