require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://zafar@localhost:5432/evercold_crm';
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function updateOrderItemBarcodes() {
  try {
    console.log('Updating order items with product barcodes...\n');

    // Get all order items without barcodes
    const itemsWithoutBarcodes = await prisma.orderItem.findMany({
      where: {
        OR: [
          { barcode: null },
          { barcode: '' }
        ]
      },
      include: {
        product: {
          select: { barcode: true }
        }
      }
    });

    console.log(`Found ${itemsWithoutBarcodes.length} order items without barcodes\n`);

    let updated = 0;
    const updates = itemsWithoutBarcodes
      .filter(item => item.product && item.product.barcode)
      .map(item =>
        prisma.orderItem.update({
          where: { id: item.id },
          data: { barcode: item.product.barcode }
        })
      );

    if (updates.length > 0) {
      await Promise.all(updates);
      updated = updates.length;
      console.log(`✓ Updated ${updated} order items with product barcodes`);
    }

    // Check remaining items without barcodes
    const stillMissing = await prisma.orderItem.findMany({
      where: {
        OR: [
          { barcode: null },
          { barcode: '' }
        ]
      },
      select: {
        id: true,
        productName: true,
        product: { select: { name: true, barcode: true } }
      },
      take: 5
    });

    if (stillMissing.length > 0) {
      console.log(`\n⚠ Still ${stillMissing.length} items missing barcodes (products don't have them either)`);
    } else {
      console.log(`\n✓ All order items now have barcodes!`);
    }
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

updateOrderItemBarcodes();
