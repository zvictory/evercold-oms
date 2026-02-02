require('dotenv').config({ path: '.env' });
const { parseExcelFile } = require('../src/lib/parsers/excel-parser');
const path = require('path');

async function parseFile() {
  try {
    const filePath = '/Users/zafar/Desktop/Реестр заказов.xls';
    const receivedDate = new Date();

    console.log('\n=== PARSING REGISTRY FILE ===\n');
    console.log(`File: ${filePath}\n`);

    const result = await parseExcelFile(filePath, receivedDate);

    if (Array.isArray(result)) {
      console.log(`Format: DETAILED`);
      console.log(`Orders found: ${result.length}\n`);

      result.slice(0, 5).forEach(order => {
        console.log(`Order #${order.orderNumber}`);
        console.log(`  Customer: ${order.customerName}`);
        console.log(`  Branch: ${order.branchCode || 'N/A'}`);
        console.log(`  Items: ${order.items.length}`);
        console.log(`  Source Type: ${order.sourceType}`);
        console.log('');
      });
    } else {
      console.log(`Format: REGISTRY`);
      console.log(`Batch ID: ${result.batchId}`);
      console.log(`Orders found: ${result.orders.length}\n`);

      result.orders.slice(0, 5).forEach(order => {
        console.log(`Order #${order.orderNumber}`);
        console.log(`  Customer: ${order.customerName}`);
        console.log(`  Branch: ${order.branchCode || 'N/A'}`);
        console.log(`  Items: ${order.items.length}`);
        console.log(`  Source Type: ${order.sourceType}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Parse error:', error.message);
    console.error(error.stack);
  }
}

parseFile();
