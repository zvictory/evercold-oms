
import 'dotenv/config';
import { prisma } from './src/lib/prisma';

async function main() {
    console.log('🤖 Starting Telegram Bot Order Simulation...');

    try {
        // 1. Setup Test Data
        console.log('📦 Setting up test data...');

        // Create or find a test customer
        let customer = await prisma.customer.findFirst({
            where: { phone: '+998901234567' }
        });

        if (!customer) {
            console.log('Creating test customer...');
            customer = await prisma.customer.create({
                data: {
                    name: 'Test Setup Bot Interaction',
                    phone: '+998901234567',
                    customerCode: 'TEST_BOT_001',
                    isActive: true
                }
            });
        }

        // Create or find a test branch
        let branch = await prisma.customerBranch.findFirst({
            where: { customerId: customer.id, branchCode: 'TEST_BOT_BRANCH' }
        });

        if (!branch) {
            console.log('Creating test branch...');
            branch = await prisma.customerBranch.create({
                data: {
                    customerId: customer.id,
                    branchCode: 'TEST_BOT_BRANCH',
                    branchName: 'Test Branch',
                    fullName: 'Test Setup Bot Interaction - Test Branch',
                    deliveryAddress: 'Test Address 123',
                    isActive: true
                }
            });
        }

        // Create or find a test product
        let product = await prisma.product.findFirst({
            where: { sku: 'TEST-PROD-001' }
        });

        if (!product) {
            console.log('Creating test product...');
            product = await prisma.product.create({
                data: {
                    name: 'Test Product Bot',
                    sku: 'TEST-PROD-001',
                    unitPrice: 15000,
                    unit: 'pcs',
                    isActive: true
                }
            });
        }

        // 2. Simulate Session Data (what the bot would have accumulated)
        const session = {
            customerId: customer.id,
            branchId: branch.id,
            items: [
                {
                    productId: product.id,
                    productName: product.name,
                    quantity: 10,
                    unitPrice: product.unitPrice
                }
            ]
        };

        console.log('📝 Simulated Session State:', JSON.stringify(session, null, 2));

        // 3. Execute Order Creation Logic (from bot.ts)
        console.log('🔄 Executing Order Creation Logic...');

        // Generate order number
        const lastOrder = await prisma.order.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { orderNumber: true },
        });

        const lastNum = lastOrder ? parseInt(lastOrder.orderNumber.replace(/\D/g, '')) : 0;
        const orderNumber = `TG${String(lastNum + 1).padStart(8, '0')}`;

        console.log(`🔹 Generated Order Number: ${orderNumber}`);

        // Get customer's VAT setting
        const customerData = await prisma.customer.findUnique({
            where: { id: session.customerId },
            select: { hasVat: true },
        });

        // Calculate totals
        let subtotal = 0;
        let vatAmount = 0;
        let totalAmount = 0;

        session.items.forEach(item => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemVat = customerData?.hasVat ? itemSubtotal * 0.12 : 0;
            subtotal += itemSubtotal;
            vatAmount += itemVat;
            totalAmount += itemSubtotal + itemVat;
        });

        // Create order
        const order = await prisma.order.create({
            data: {
                orderNumber,
                orderDate: new Date(),
                customerId: session.customerId,
                sourceType: 'DETAILED',
                subtotal,
                vatAmount,
                totalAmount,
                status: 'NEW',
            },
        });

        console.log(`✅ Order created with ID: ${order.id}`);

        // Create order items
        for (const item of session.items) {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemVat = customerData?.hasVat ? itemSubtotal * 0.12 : 0;
            const itemTotal = itemSubtotal + itemVat;

            await prisma.orderItem.create({
                data: {
                    orderId: order.id,
                    branchId: session.branchId,
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: itemSubtotal,
                    vatRate: customerData?.hasVat ? 12 : 0,
                    vatAmount: itemVat,
                    totalAmount: itemTotal,
                },
            });
            console.log(`   ➕ Added item: ${item.productName}`);
        }

        console.log('\n🎉 Test Passed! Order simulation completed successfully.');
        console.log(`Order Number: ${orderNumber}`);
        console.log(`Total Amount: ${totalAmount}`);

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
