import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Create EverCold as supplier (Customer)
  const korzinka = await prisma.customer.upsert({
    where: { customerCode: 'KORZINKA' },
    update: {},
    create: {
      name: 'Korzinka',
      customerCode: 'KORZINKA',
      contactPerson: 'N/A',
      email: 'orders@korzinka.uz',
      headquartersAddress: 'Tashkent, Uzbekistan',
      contractNumber: '17',
      contractDate: '07.09.2022',
      isActive: true,
    },
  })

  console.log('✅ Created customer: Korzinka')

  // Create Korzinka branches
  const branches = [
    { code: 'K013', name: 'Qorasuv', fullName: 'Korzinka - Qorasuv' },
    { code: 'K021', name: 'Qoqon', fullName: 'Korzinka - Qoqon' },
    { code: 'K022', name: 'Uchtepa', fullName: 'Korzinka - Uchtepa' },
    { code: 'K023', name: 'Andijon', fullName: 'Korzinka - Andijon' },
    { code: 'K026', name: 'Bunyodkor', fullName: 'Korzinka - Bunyodkor' },
    { code: 'K027', name: 'Qoyliq', fullName: 'Korzinka - Qoyliq' },
    { code: 'K030', name: 'Beshqayrogoch', fullName: 'Korzinka - Beshqayrogoch' },
    { code: 'K041', name: 'Qoyliq Markaz', fullName: 'Korzinka - Qoyliq Markaz' },
    { code: 'K051', name: 'Keles', fullName: 'Korzinka - Keles' },
    { code: 'K059', name: 'Beruniy', fullName: 'Korzinka - Beruniy' },
    { code: 'K065', name: 'Globus', fullName: 'Korzinka - Globus' },
    { code: 'K068', name: 'Ipakchi', fullName: 'Korzinka - Ipakchi' },
    { code: 'K070', name: 'Kohinur', fullName: 'Korzinka - Kohinur' },
    { code: 'K071', name: 'Namangan', fullName: 'Korzinka - Namangan' },
    { code: 'K086', name: 'Sergeli 4-bekat', fullName: 'Korzinka - Sergeli 4-bekat' },
    { code: 'K088', name: 'Olmaliq 2', fullName: 'Korzinka - Olmaliq 2' },
    { code: 'K095', name: 'Sergeli 8', fullName: 'Korzinka - Sergeli 8' },
    { code: 'K097', name: 'Dombirobod', fullName: 'Korzinka - Dombirobod' },
    { code: 'K105', name: 'Zargarlik', fullName: 'Korzinka - Zargarlik' },
    { code: 'K109', name: 'Andijon To\'rtko\'cha', fullName: 'Korzinka - Andijon To\'rtko\'cha' },
    { code: 'K121', name: 'Erkin', fullName: 'Korzinka - Erkin' },
    { code: 'K129', name: 'Termez Iceberg', fullName: 'Korzinka - Termez Iceberg' },
    { code: 'K130', name: 'Termez Yubileyniy', fullName: 'Korzinka - Termez Yubileyniy' },
    { code: 'K133', name: 'Qo\'qon Go\'zal', fullName: 'Korzinka - Qo\'qon Go\'zal' },
    { code: 'K134', name: 'Qoraqamish 2/5', fullName: 'Korzinka - Qoraqamish 2/5' },
    { code: 'K135', name: 'Qo\'qon Charxiy', fullName: 'Korzinka - Qo\'qon Charxiy' },
    { code: 'K147', name: 'Alfraganus', fullName: 'Korzinka - Alfraganus' },
    { code: 'K148', name: 'Namangan Grand', fullName: 'Korzinka - Namangan Grand' },
    { code: 'K152', name: 'Oqtepa 28', fullName: 'Korzinka - Oqtepa 28' },
    { code: 'K165', name: 'Keles st166', fullName: 'Korzinka - Keles st166' },
    { code: 'K178', name: 'TKAD 17', fullName: 'Korzinka - TKAD 17' },
  ]

  for (const branch of branches) {
    await prisma.customerBranch.upsert({
      where: { branchCode: branch.code },
      update: {},
      create: {
        customerId: korzinka.id,
        branchCode: branch.code,
        branchName: branch.name,
        fullName: branch.fullName,
        isActive: true,
      },
    })
  }

  console.log(`✅ Created ${branches.length} branches`)

  // Create EverCold products
  await prisma.product.upsert({
    where: { sapCode: '107000001-00001' },
    update: {},
    create: {
      name: 'Лёд пищевой Ever Cold 3кг',
      sapCode: '107000001-00001',
      barcode: '4780053810028',
      unitPrice: 14513.4,
      unit: 'ШТ',
      vatRate: 12.0,
      description: 'Food grade ice 3kg bag',
      isActive: true,
    },
  })

  await prisma.product.upsert({
    where: { sapCode: '107000001-00006' },
    update: {},
    create: {
      name: 'Лёд пищевой Ever Cold 1кг',
      sapCode: '107000001-00006',
      barcode: '4780053810011',
      unitPrice: 5468.75,
      unit: 'ШТ',
      vatRate: 12.0,
      description: 'Food grade ice 1kg bag',
      isActive: true,
    },
  })

  console.log('✅ Created 2 products')

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
