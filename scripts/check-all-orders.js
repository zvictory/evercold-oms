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
    // Get total count of orders
    const totalCount = await prisma.order.count();
    console.log(`\n=== TOTAL ORDERS: ${totalCount} ===\n`);

    // Get orders grouped by sourceType
    const bySourceType = await prisma.order.groupBy({
      by: ['sourceType'],
      _count: true
    });

    console.log('=== ORDERS BY SOURCE TYPE ===\n');
    bySourceType.forEach(group => {
      console.log(`${group.sourceType || 'NULL'}: ${group._count} orders`);
    });

    // Get latest 5 orders with any source type
    const latestOrders = await prisma.order.findMany({
      include: {
        customer: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('\n=== LATEST 5 ORDERS ===\n');
    latestOrders.forEach(order => {
      console.log(`Order #${order.orderNumber}`);
      console.log(`  Customer: ${order.customer.name}`);
      console.log(`  Source Type: ${order.sourceType || 'NULL'}`);
      console.log(`  Total: ${order.totalAmount.toLocaleString()} UZS`);
      console.log(`  Batch ID: ${order.batchId || 'N/A'}`);
      console.log(`  Created: ${order.createdAt.toISOString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkOrders();
