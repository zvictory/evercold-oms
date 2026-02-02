require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkOrders() {
  try {
    // Get registry orders
    const registryOrders = await prisma.order.findMany({
      where: { sourceType: 'REGISTRY' },
      include: {
        orderItems: {
          include: {
            branch: true
          }
        },
        customer: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('\n=== REGISTRY ORDERS IN DATABASE ===\n');
    console.log(`Total found: ${registryOrders.length}\n`);

    registryOrders.forEach(order => {
      console.log(`Order #${order.orderNumber}`);
      console.log(`  Customer: ${order.customer.name}`);
      console.log(`  Total: ${order.totalAmount.toLocaleString()} UZS`);
      console.log(`  Batch ID: ${order.batchId || 'N/A'}`);
      console.log(`  Items: ${order.orderItems.length}`);
      console.log(`  Created: ${order.createdAt.toISOString()}`);

      // Show first 3 items
      order.orderItems.slice(0, 3).forEach(item => {
        console.log(`    - ${item.productName} (${item.quantity} units) - Branch: ${item.branch?.branchCode || 'N/A'}`);
      });
      console.log('');
    });

    // Get count by batch
    const batchCounts = await prisma.order.groupBy({
      by: ['batchId'],
      where: {
        sourceType: 'REGISTRY',
        batchId: { not: null }
      },
      _count: true
    });

    console.log('=== ORDERS BY BATCH ===\n');
    batchCounts.forEach(batch => {
      console.log(`${batch.batchId}: ${batch._count} orders`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
