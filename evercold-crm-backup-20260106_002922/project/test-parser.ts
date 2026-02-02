import { parsePurchaseOrderFile } from './src/lib/parsers/purchase-order-parser';

async function testParser() {
  try {
    const filePath = '/Users/user/Downloads/Реестр заказов (3).xls';
    console.log('Parsing file:', filePath);

    const orders = await parsePurchaseOrderFile(filePath);

    console.log('\n=== PARSED ORDERS ===');
    console.log('Total orders:', orders.length);

    orders.forEach((order, idx) => {
      console.log(`\nOrder ${idx + 1}:`);
      console.log('  Order Number:', order.orderNumber);
      console.log('  Customer:', order.customerName);
      console.log('  Items:', order.items.length);

      order.items.forEach((item, itemIdx) => {
        console.log(`    Item ${itemIdx + 1}:`);
        console.log('      Material:', item.materialCode);
        console.log('      Product:', item.productDescription);
        console.log('      Branch Code:', item.branchCode);
        console.log('      Branch Name:', item.branchName);
        console.log('      Quantity:', item.quantity);
      });
    });
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testParser();
