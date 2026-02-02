require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importFleetData() {
  try {
    console.log('Starting fleet data import...\n');

    // Import Drivers
    const drivers = [
      { id: 'cmjyptrtb0000cappjj4ymx7a', name: 'NASRITDINOV ZUXRITDIN ERKINOVICH', phone: '+998901234567', licenseNumber: 'DRV001', status: 'ACTIVE' },
      { id: 'cmjyptru60001capp9nl7hzch', name: 'Ummat', phone: '+998901234568', licenseNumber: 'DRV002', status: 'ACTIVE' },
      { id: 'cmjyptru90002cappn7p5rxvq', name: 'Viktor', phone: '+998901234569', licenseNumber: 'DRV003', status: 'ACTIVE' },
      { id: 'cmjyptrua0003cappx1rgh16e', name: 'Azamat', phone: '+998901234570', licenseNumber: 'DRV004', status: 'ACTIVE' },
      { id: 'cmjyptrud0004cappndiq1psb', name: 'Elomon', phone: '+998901234571', licenseNumber: 'DRV005', status: 'ACTIVE' },
    ];

    for (const driver of drivers) {
      try {
        const existing = await prisma.driver.findUnique({ where: { id: driver.id } });
        if (!existing) {
          await prisma.driver.create({
            data: {
              id: driver.id,
              name: driver.name,
              phone: driver.phone,
              licenseNumber: driver.licenseNumber,
              status: driver.status,
              createdAt: new Date('2026-01-03T19:48:23.951Z'),
              updatedAt: new Date('2026-01-03T19:48:23.951Z'),
            },
          });
          console.log(`✓ Imported driver: ${driver.name}`);
        } else {
          console.log(`⊘ Driver already exists: ${driver.name}`);
        }
      } catch (error) {
        console.error(`✗ Error importing driver ${driver.name}:`, error.message);
      }
    }

    console.log('\n');

    // Import Vehicles
    const vehicles = [
      { id: 'cmjyptrug0005cappsit0r67i', plateNumber: '01 522 OLA', model: 'DAMAS-2', type: 'VAN' },
      { id: 'cmjyptruk0006capphyejh4lk', plateNumber: '01 R 153 BB', model: 'DAMAS-2', type: 'VAN' },
      { id: 'cmjyptrum0007cappsf7gy5bs', plateNumber: '01 732 BGA', model: 'KIA BONGO', type: 'TRUCK' },
      { id: 'cmjyptrup0008cappjaxgjz1d', plateNumber: '01 298 QMA', model: 'DAMAS-2', type: 'VAN' },
      { id: 'cmjyptrur0009capp3tll43pw', plateNumber: '01 924 NLA', model: 'DAMAS-2', type: 'VAN' },
      { id: 'cmjyptrut000acappqp9ewa4g', plateNumber: '01 612 RJA', model: 'DAMAS-2', type: 'VAN' },
      { id: 'cmjyptruv000bcappziiejo82', plateNumber: '01 685 ZMA', model: 'DAMAS-2', type: 'VAN' },
    ];

    for (const vehicle of vehicles) {
      try {
        const existing = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
        if (!existing) {
          await prisma.vehicle.create({
            data: {
              id: vehicle.id,
              plateNumber: vehicle.plateNumber,
              model: vehicle.model,
              type: vehicle.type,
              status: 'AVAILABLE',
              createdAt: new Date('2026-01-03T19:48:23.992Z'),
              updatedAt: new Date('2026-01-03T19:48:23.992Z'),
            },
          });
          console.log(`✓ Imported vehicle: ${vehicle.plateNumber} (${vehicle.model})`);
        } else {
          console.log(`⊘ Vehicle already exists: ${vehicle.plateNumber}`);
        }
      } catch (error) {
        console.error(`✗ Error importing vehicle ${vehicle.plateNumber}:`, error.message);
      }
    }

    console.log('\n✓ Fleet data import completed!');
    console.log(`Total drivers imported: ${drivers.length}`);
    console.log(`Total vehicles imported: ${vehicles.length}`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importFleetData();
