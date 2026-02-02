import ExcelJS from 'exceljs';

async function verifyBulk() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('/tmp/bulk-invoices.xlsx');

  console.log('=== BULK INVOICE VERIFICATION ===\n');
  console.log(`Total worksheets: ${workbook.worksheets.length}\n`);

  workbook.worksheets.forEach((worksheet, idx) => {
    console.log(`--- Worksheet ${idx + 1}: ${worksheet.name} ---`);

    // Check key rows
    const title = worksheet.getCell('A2').value;
    const invoiceNum = worksheet.getCell('A3').value;
    const contract = worksheet.getCell('A4').value;
    const branch = worksheet.getCell('A5').value;

    console.log(`  Title: ${title}`);
    console.log(`  Invoice: ${invoiceNum}`);
    console.log(`  Contract: ${contract}`);
    console.log(`  Branch: ${branch}`);
    console.log('');
  });
}

verifyBulk().catch(console.error);
