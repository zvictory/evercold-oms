import { prisma } from './src/lib/prisma';
import { hashPin } from './src/lib/driverAuth';

async function setAllPins() {
  try {
    console.log('\n🔐 Setting all driver PINs to 1234...\n');

    // Get all drivers
    const drivers = await prisma.driver.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
      },
    });

    if (drivers.length === 0) {
      console.log('❌ No drivers found in database.');
      console.log('\nCreate a driver first at: http://localhost:3000/drivers');
      return;
    }

    // Hash the PIN
    const hashedPin = await hashPin('1234');

    // Update all drivers
    let updated = 0;
    for (const driver of drivers) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: { phonePin: hashedPin },
      });
      updated++;
      console.log(`✓ Updated PIN for: ${driver.name} (${driver.phone})`);
    }

    console.log(`\n✅ Successfully set PIN to 1234 for ${updated} driver(s)\n`);
    console.log('📱 Test Login:');
    console.log('   URL: http://192.168.0.111:3000/driver/login');
    console.log('   Phone: ' + drivers[0].phone.replace('+998', ''));
    console.log('   PIN: 1234\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAllPins();
