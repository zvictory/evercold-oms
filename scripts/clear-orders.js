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

async function clearOrders() {
  try {
    console.log('\n=== CLEARING ORDER HISTORY ===\n');

    // Get counts before deletion
    const orderCount = await prisma.order.count();
    const orderItemCount = await prisma.orderItem.count();

    console.log('Current database status:');
    console.log(`  Orders: ${orderCount}`);
    console.log(`  Order Items: ${orderItemCount}`);
    console.log('');

    if (orderCount === 0) {
      console.log('✓ No orders to delete. Database is already clean.');
      return;
    }

    console.log('Deleting records...');

    // Use transaction to ensure both deletions succeed or both fail
    await prisma.$transaction(async (tx) => {
      // Delete order items first (foreign key constraint)
      const deletedItems = await tx.orderItem.deleteMany({});
      console.log(`  ✓ Deleted ${deletedItems.count} order items`);

      // Delete orders
      const deletedOrders = await tx.order.deleteMany({});
      console.log(`  ✓ Deleted ${deletedOrders.count} orders`);
    });

    // Verify deletion
    const remainingOrders = await prisma.order.count();
    const remainingItems = await prisma.orderItem.count();

    console.log('');
    console.log('=== CLEANUP COMPLETE ===\n');
    console.log('Database status:');
    console.log(`  Orders: ${remainingOrders}`);
    console.log(`  Order Items: ${remainingItems}`);
    console.log('');
    console.log('✓ Order history cleared successfully!');
    console.log('You can now upload the registry file to create fresh orders.');
    console.log('');

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

clearOrders();
