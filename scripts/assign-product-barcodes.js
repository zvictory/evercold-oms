require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://zafar@localhost:5432/evercold_crm';
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function assignBarcodes() {
  try {
    console.log('Assigning barcodes to products without them...\n');

    // Standard barcodes for ice products
    // Format: 4801234XXXXXX (valid EAN-13 style)
    const barcodeAssignments = {
      '107000001-00001': '4801234000001', // 3kg ice - Ever Cold standard
      '107000001-00006': '4801234000008', // 1kg ice - Ever Cold standard
    };

    let updated = 0;
    let skipped = 0;

    // Get all products without barcodes
    const productsWithoutBarcodes = await prisma.product.findMany({
      where: {
        OR: [
          { barcode: null },
          { barcode: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        sapCode: true,
        barcode: true
      }
    });

    console.log(`Found ${productsWithoutBarcodes.length} products without barcodes\n`);

    for (const product of productsWithoutBarcodes) {
      try {
        let newBarcode = null;

        // Try to assign by SAP code
        if (product.sapCode && barcodeAssignments[product.sapCode]) {
          newBarcode = barcodeAssignments[product.sapCode];
          console.log(`✓ Assigning barcode for SAP code ${product.sapCode}: ${newBarcode}`);
        } else if (product.name.includes('1кг') || product.name.includes('1kg')) {
          // 1kg ice product
          newBarcode = '4801234000008';
          console.log(`✓ Assigning 1kg barcode to: ${product.name}`);
        } else if (product.name.includes('3кг') || product.name.includes('3kg')) {
          // 3kg ice product
          newBarcode = '4801234000001';
          console.log(`✓ Assigning 3kg barcode to: ${product.name}`);
        } else {
          // Generic ice product barcode
          newBarcode = '4801234000015';
          console.log(`✓ Assigning generic barcode to: ${product.name}`);
        }

        if (newBarcode) {
          await prisma.product.update({
            where: { id: product.id },
            data: { barcode: newBarcode }
          });
          updated++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`✗ Error updating product ${product.name}:`, error.message);
      }
    }

    console.log(`\n✓ Barcode assignment completed!`);
    console.log(`  - Updated: ${updated} products`);
    console.log(`  - Skipped: ${skipped} products`);
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

assignBarcodes();
