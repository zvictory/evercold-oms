import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Checking for existing products...');

  const existingProducts = await prisma.product.findMany({
    where: {
      OR: [
        { sapCode: '107000001-00006' },
        { sapCode: '107000001-00001' }
      ]
    }
  });

  console.log(`Found ${existingProducts.length} existing products`);
  existingProducts.forEach(p => {
    console.log(`- ${p.sapCode}: ${p.name}`);
  });

  const productsToAdd = [
    {
      name: 'Лёд пищевой Ever Cold 1кг',
      sapCode: '107000001-00006',
      sku: 'ICE-1KG',
      barcode: '107000001-00006',
      unitPrice: 8000, // 8000 UZS - adjust as needed
      unit: 'ШТ',
      vatRate: 12.0,
      description: 'Пищевой лёд Ever Cold, вес 1 кг',
      isActive: true
    },
    {
      name: 'Лёд пищевой Ever Cold 3кг',
      sapCode: '107000001-00001',
      sku: 'ICE-3KG',
      barcode: '107000001-00001',
      unitPrice: 22000, // 22000 UZS - adjust as needed
      unit: 'ШТ',
      vatRate: 12.0,
      description: 'Пищевой лёд Ever Cold, вес 3 кг',
      isActive: true
    }
  ];

  for (const productData of productsToAdd) {
    const exists = existingProducts.find(p => p.sapCode === productData.sapCode);

    if (!exists) {
      console.log(`\nAdding product: ${productData.name} (${productData.sapCode})`);
      const product = await prisma.product.create({
        data: productData
      });
      console.log(`✓ Created product: ${product.name} (ID: ${product.id})`);
    } else {
      console.log(`\nSkipping ${productData.name} - already exists`);
    }
  }

  console.log('\n✓ Product import complete!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
