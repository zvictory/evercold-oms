/**
 * Data migration script: Pricing tier system bootstrap
 *
 * Run with: npx ts-node --compiler-options '{"module":"commonjs"}' prisma/migrate-pricing.ts
 *
 * Steps:
 * 1. Create a "Standard" CustomerGroup
 * 2. Assign all existing customers to the Standard group
 * 3. Migrate hasVat → taxStatus
 * 4. Set nationalCatalogCode on all products
 * 5. Seed PriceListEntry from each Product.unitPrice for the Standard group
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting pricing migration...\n')

  // 1. Create "Standard" CustomerGroup
  console.log('1. Creating Standard customer group...')
  const standardGroup = await prisma.customerGroup.upsert({
    where: { name: 'Standard' },
    update: {},
    create: {
      name: 'Standard',
      description: 'Стандартная ценовая группа (базовые цены)',
      sortOrder: 0,
      isActive: true,
    },
  })
  console.log(`   Created/found group: ${standardGroup.id}`)

  // 2. Set all existing customers' customerGroupId to Standard
  console.log('2. Assigning all customers to Standard group...')
  const customerResult = await prisma.customer.updateMany({
    where: { customerGroupId: null },
    data: { customerGroupId: standardGroup.id },
  })
  console.log(`   Updated ${customerResult.count} customers`)

  // 3. Migrate hasVat → taxStatus
  console.log('3. Migrating hasVat → taxStatus...')
  const vatPayerResult = await prisma.customer.updateMany({
    where: { hasVat: true },
    data: { taxStatus: 'VAT_PAYER' },
  })
  console.log(`   Set ${vatPayerResult.count} customers to VAT_PAYER`)

  const exemptResult = await prisma.customer.updateMany({
    where: { hasVat: false },
    data: { taxStatus: 'EXEMPT' },
  })
  console.log(`   Set ${exemptResult.count} customers to EXEMPT`)

  // 4. Set nationalCatalogCode on all products
  console.log('4. Setting nationalCatalogCode on products...')
  const productResult = await prisma.product.updateMany({
    where: { nationalCatalogCode: null },
    data: {
      nationalCatalogCode: '02105001002000000',
      nationalCatalogName: 'Лёд пищевой',
    },
  })
  console.log(`   Updated ${productResult.count} products`)

  // 5. Seed PriceListEntry from each Product.unitPrice
  console.log('5. Seeding PriceListEntry from product base prices...')
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, unitPrice: true },
  })

  let seededCount = 0
  for (const product of products) {
    const existing = await prisma.priceListEntry.findFirst({
      where: {
        customerGroupId: standardGroup.id,
        productId: product.id,
      },
    })

    if (!existing) {
      await prisma.priceListEntry.create({
        data: {
          customerGroupId: standardGroup.id,
          productId: product.id,
          basePrice: product.unitPrice,
          currency: 'UZS',
        },
      })
      seededCount++
      console.log(`   Seeded: ${product.name} → ${product.unitPrice} UZS`)
    }
  }
  console.log(`   Seeded ${seededCount} price list entries`)

  console.log('\nMigration complete!')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
