import { prisma } from '../src/lib/prisma';

// Manual mapping of old K-codes to new branch codes based on branch names
const oldToNewMapping: Record<string, string> = {
  // Exact matches based on name
  'K023': 'ANDIJAN',           // Andijon
  'K109': 'ANDIJAN_AMIR_TEMUR', // Andijon To'rtko'cha
  'K035': 'ASAKA',             // Asaka
  'K059': 'BERUNIY',           // Beruniy
  'K026': 'BUNYODKOR',         // Bunyodkor
  'K051': 'KELES',             // Keles
  'K070': 'KOKHINUR',          // Kohinur (spelling variation)
  'K071': 'NAMANGAN',          // Namangan
  'K148': 'NAMANGAN_GRAND',    // Namangan Grand
  'K086': 'SERGELI',           // Sergeli 4-bekat
  'K095': 'SERGELI5',          // Sergeli 8

  // Tashkent branches - mapping based on area names
  'K022': 'ALGORITM',          // Uchtepa - might be Algoritm in Uchtepa
  'K013': 'MOTRID',            // Qorasuv - Samarkand Motrid is in Karasu/Qorasuv
  'K065': 'NEXT',              // Globus - might be in same area
  'K068': 'INTEGRO_CHILANZAR', // Ipakchi
  'K027': 'FAYZABAD',          // Qoyliq
  'K030': 'BASHLIK',           // Beshqayrogoch
  'K060': 'CENTER5',           // Jarariq
  'K084': 'KARATASH',          // Qoraqamish 1/3
  'K134': 'SAMARKAND_DARVOZA', // Qoraqamish 2/5
  'K105': 'KOK_SARAY',         // Zargarlik - Jizzakh
  'K121': 'SHEDEVR',           // Erkin
  'K129': 'BUKHARA1',          // Termez Iceberg
  'K130': 'BUKHARA2',          // Termez Yubileyniy
  'K143': 'MERCATO',           // MUM Mall
  'K147': 'TTZ',               // Alfraganus
  'K152': 'OYBEK',             // Oqtepa 28
  'K178': 'AVIASOZLAR',        // TKAD 17
};

async function main() {
  console.log('Starting to populate old branch codes...\n');

  let updated = 0;
  let notFound = 0;

  for (const [oldCode, newCode] of Object.entries(oldToNewMapping)) {
    try {
      const branch = await prisma.customerBranch.findUnique({
        where: { branchCode: newCode },
      });

      if (!branch) {
        console.log(`⚠️  Branch not found: ${newCode} (old code: ${oldCode})`);
        notFound++;
        continue;
      }

      await prisma.customerBranch.update({
        where: { branchCode: newCode },
        data: { oldBranchCode: oldCode },
      });

      console.log(`✓ Updated ${newCode.padEnd(20)} <- ${oldCode} (${branch.branchName})`);
      updated++;
    } catch (error: any) {
      console.error(`✗ Error updating ${newCode}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Updated: ${updated}`);
  console.log(`Not Found: ${notFound}`);
  console.log(`Total: ${Object.keys(oldToNewMapping).length}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
