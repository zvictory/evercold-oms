import { prisma } from './src/lib/prisma';

async function checkDrivers() {
  const drivers = await prisma.driver.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      phonePin: true,
    },
  });

  console.log('\n=== EXISTING DRIVERS ===\n');

  if (drivers.length === 0) {
    console.log('No drivers found in database.');
  } else {
    drivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.name}`);
      console.log(`   Phone: ${driver.phone}`);
      console.log(`   Status: ${driver.status}`);
      console.log(`   PIN Set: ${driver.phonePin ? '✓ Yes' : '✗ No'}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkDrivers().catch(console.error);
