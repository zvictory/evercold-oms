import { parsePurchaseOrderFile } from './src/lib/parsers/purchase-order-parser';
import { prisma } from './src/lib/prisma';

async function simulateUpload() {
  try {
    const filePath = '/Users/user/Downloads/Реестр заказов (3).xls';
    console.log('Parsing file:', filePath);

    const parsedOrders = await parsePurchaseOrderFile(filePath);
    console.log('Parsed orders:', parsedOrders.length);

    let ordersCreated = 0;
    let errors: string[] = [];

    // Process first order only for testing
    const parsedOrder = parsedOrders[0];
    console.log('\n=== Processing Order 1 ===');
    console.log('Order Number:', parsedOrder.orderNumber);
    console.log('Customer Name:', parsedOrder.customerName);
    console.log('Items:', parsedOrder.items.length);

    try {
      // Check if order already exists
      const existingOrder = await prisma.order.findUnique({
        where: { orderNumber: parsedOrder.orderNumber },
      });

      if (existingOrder) {
        console.log('Order already exists, skipping');
        return;
      }

      console.log('\nFinding customer with name containing:', parsedOrder.customerName);

      // Find or create customer
      let customer = await prisma.customer.findFirst({
        where: { name: { contains: parsedOrder.customerName, mode: 'insensitive' } },
      });

      console.log('Found customer:', customer ? customer.name : 'null');

      if (!customer) {
        console.log('\nCreating new customer...');
        customer = await prisma.customer.create({
          data: {
            name: parsedOrder.customerName,
            customerCode: parsedOrder.customerName.substring(0, 20).toUpperCase().replace(/\s+/g, '_'),
            isActive: true,
          },
        });
        console.log('Created customer:', customer.name, customer.id);
      }

      console.log('\nCustomer ID:', customer.id);

      // Create email record
      const email = await prisma.email.create({
        data: {
          receivedDate: new Date(),
          attachmentFilename: 'test-upload.xls',
          processed: true,
          processedAt: new Date(),
        },
      });
      console.log('Created email record:', email.id);

      // Create order
      console.log('\nCreating order...');
      const order = await prisma.order.create({
        data: {
          orderNumber: parsedOrder.orderNumber,
          orderDate: new Date(),
          customerId: customer.id,
          sourceType: 'DETAILED',
          subtotal: 0,
          vatAmount: 0,
          totalAmount: 0,
          emailId: email.id,
        },
      });
      console.log('Created order:', order.id);

      // Process first item
      const item = parsedOrder.items[0];
      console.log('\n=== Processing Item 1 ===');
      console.log('Material Code:', item.materialCode);
      console.log('Branch Code:', item.branchCode);

      // Find product
      const product = await prisma.product.findFirst({
        where: { sapCode: item.materialCode },
        include: {
          customerPrices: {
            where: { customerId: customer.id },
          },
        },
      });

      if (!product) {
        console.log('ERROR: Product not found!');
        errors.push(`Product not found: ${item.materialCode}`);
      } else {
        console.log('Found product:', product.name);

        // Find or create branch
        let branch = await prisma.customerBranch.findFirst({
          where: {
            OR: [
              { branchCode: item.branchCode },
              { oldBranchCode: item.branchCode },
            ],
          },
        });

        console.log('Found branch:', branch ? branch.branchName : 'null');

        if (!branch && item.branchCode) {
          console.log('Creating new branch...');
          branch = await prisma.customerBranch.create({
            data: {
              customerId: customer.id,
              branchCode: item.branchCode!,
              branchName: item.branchName || item.branchCode!,
              fullName: `${customer.name} - ${item.branchName || item.branchCode!}`,
              isActive: true,
            },
          });
          console.log('Created branch:', branch.branchName);
        }

        // Calculate prices
        const customerPrice = product.customerPrices?.[0]?.unitPrice;
        const unitPrice = customerPrice || product.unitPrice || 0;
        const vatRate = product.vatRate || 12;
        const subtotal = item.quantity * unitPrice;
        const vatAmount = (subtotal * vatRate) / 100;
        const totalAmount = subtotal + vatAmount;

        console.log('Unit Price:', unitPrice);
        console.log('Subtotal:', subtotal);
        console.log('Total Amount:', totalAmount);

        // Create order item
        const orderItem = await prisma.orderItem.create({
          data: {
            orderId: order.id,
            branchId: branch?.id,
            productId: product.id,
            productName: item.productDescription,
            sapCode: item.materialCode,
            quantity: item.quantity,
            unitPrice,
            subtotal,
            vatRate,
            vatAmount,
            totalAmount,
          },
        });
        console.log('Created order item:', orderItem.id);

        // Update order totals
        await prisma.order.update({
          where: { id: order.id },
          data: {
            subtotal,
            vatAmount,
            totalAmount,
          },
        });
        console.log('Updated order totals');
      }

      ordersCreated++;
      console.log('\n=== SUCCESS ===');
      console.log('Orders created:', ordersCreated);

    } catch (orderError: any) {
      console.error('\n=== ERROR in order processing ===');
      console.error('Error:', orderError.message);
      console.error('Stack:', orderError.stack);
      errors.push(`Error processing order ${parsedOrder.orderNumber}: ${orderError.message}`);
    }

    console.log('\n=== SUMMARY ===');
    console.log('Orders created:', ordersCreated);
    console.log('Errors:', errors);

  } catch (error: any) {
    console.error('Main error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

simulateUpload();
