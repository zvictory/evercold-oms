import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    const skuCodes = ['107000001-00001', '107000001-00006'];

    console.log('Checking for products with SKU codes:', skuCodes);

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { sku: { in: skuCodes } },
          { sapCode: { in: skuCodes } },
        ]
      },
      select: {
        id: true,
        name: true,
        sku: true,
        sapCode: true,
        barcode: true,
      }
    });

    console.log('\nFound products:', products.length);
    console.log(JSON.stringify(products, null, 2));

    if (products.length === 0) {
      console.log('\n⚠️  No products found with these SKU codes!');
      console.log('This is likely why the upload creates 0 orders.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
