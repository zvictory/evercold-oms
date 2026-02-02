import { prisma } from '../src/lib/prisma';

async function checkDuplicates() {
  const drivers = await prisma.driver.findMany({
    select: { id: true, phone: true, name: true }
  });

  const phoneMap = new Map<string, typeof drivers>();

  for (const driver of drivers) {
    const existing = phoneMap.get(driver.phone) || [];
    existing.push(driver);
    phoneMap.set(driver.phone, existing);
  }

  const duplicates = Array.from(phoneMap.entries())
    .filter(([_, driverList]) => driverList.length > 1);

  if (duplicates.length > 0) {
    console.log('Found duplicate phone numbers:');
    duplicates.forEach(([phone, driverList]) => {
      console.log(`\nPhone: ${phone}`);
      driverList.forEach(d => console.log(`  - ${d.name} (${d.id})`));
    });
    process.exit(1);
  } else {
    console.log('No duplicate phone numbers found. Safe to proceed with migration.');
    process.exit(0);
  }
}

checkDuplicates()
  .catch(console.error);
