import ExcelJS from 'exceljs';

async function verifyInvoice() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('/tmp/test-invoice.xlsx');

  const worksheet = workbook.worksheets[0];

  console.log('=== INVOICE VERIFICATION ===\n');
  console.log(`Worksheet name: ${worksheet.name}\n`);

  console.log('=== KEY ROWS ===\n');

  // Check rows 1-10 for header info
  for (let rowNum = 1; rowNum <= 10; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const firstCell = row.getCell(1);
    const value = firstCell.value;

    if (value !== null && value !== undefined && value !== '') {
      let displayValue = '';
      if (typeof value === 'object' && 'richText' in value) {
        displayValue = value.richText.map((t: any) => t.text).join('');
      } else {
        displayValue = String(value);
      }
      console.log(`Row ${rowNum}: ${displayValue}`);
    }
  }

  console.log('\n=== CHECKING BRANCH HEADER (Row 5) ===\n');
  const branchCell = worksheet.getCell('A5');
  console.log(`Branch header: "${branchCell.value}"`);

  console.log('\n=== CHECKING TOTALS (Row 19) ===\n');
  const totalsLabel = worksheet.getCell('A19');
  const totalSubtotal = worksheet.getCell('H19');
  const totalVAT = worksheet.getCell('J19');
  const totalWithVAT = worksheet.getCell('K19');

  console.log(`Totals label: "${totalsLabel.value}"`);
  console.log(`Subtotal formula: ${JSON.stringify(totalSubtotal.value)}`);
  console.log(`VAT formula: ${JSON.stringify(totalVAT.value)}`);
  console.log(`Total with VAT formula: ${JSON.stringify(totalWithVAT.value)}`);

  console.log('\n=== DATA ROWS ===\n');
  for (let rowNum = 17; rowNum <= 18; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const productName = row.getCell(2).value;
    const quantity = row.getCell(6).value;
    const unitPrice = row.getCell(7).value;

    console.log(`Row ${rowNum}: ${productName} | Qty: ${quantity} | Price: ${unitPrice}`);
  }
}

verifyInvoice().catch(console.error);
