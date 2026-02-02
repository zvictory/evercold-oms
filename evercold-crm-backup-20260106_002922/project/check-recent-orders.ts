
import 'dotenv/config';
import { prisma } from './src/lib/prisma';

async function main() {
    console.log('🔍 Checking recent orders...');

    const orders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            customer: true,
            orderItems: true
        }
    });

    console.log('Found orders:', orders.length);

    for (const order of orders) {
        console.log(`\n-----------------------------------`);
        console.log(`Order #: ${order.orderNumber}`);
        console.log(`Date: ${order.createdAt}`);
        console.log(`Customer: ${order.customer.name} (Code: ${order.customer.customerCode})`);
        console.log(`Phone: ${order.customer.phone}`);
        console.log(`Source Type: ${order.sourceType}`);
        console.log(`Total: ${order.totalAmount}`);
        console.log(`Items: ${order.orderItems.length}`);
    }

    await prisma.$disconnect();
}

main();
