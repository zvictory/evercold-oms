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

// Order numbers from row 3 of the uploaded file
const orderNumbers = [
  '4506514022',
  '4506514086',
  '4506513684',
  '4506515500',
  '4506517150',
  '4506518005',
  '4506517899',
];

async function checkOrders() {
  try {
    console.log('\n=== CHECKING SPECIFIC ORDER NUMBERS ===\n');

    for (const orderNum of orderNumbers) {
      const order = await prisma.order.findUnique({
        where: { orderNumber: orderNum },
        include: {
          customer: true
        }
      });

      if (order) {
        console.log(`✓ Order #${orderNum} EXISTS`);
        console.log(`  Customer: ${order.customer.name}`);
        console.log(`  Source Type: ${order.sourceType}`);
        console.log(`  Batch ID: ${order.batchId || 'N/A'}`);
        console.log(`  Total: ${order.totalAmount.toLocaleString()} UZS`);
        console.log(`  Created: ${order.createdAt.toISOString()}`);
      } else {
        console.log(`✗ Order #${orderNum} NOT FOUND`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkOrders();
