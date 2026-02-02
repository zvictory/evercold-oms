import ExcelJS from 'exceljs';

async function check() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('/tmp/test-invoice.xlsx');
  const worksheet = workbook.worksheets[0];

  console.log('Row 18 values:');
  for (let col = 1; col <= 11; col++) {
    const cell = worksheet.getCell(18, col);
    const colLetter = String.fromCharCode(64 + col);
    console.log(`  ${colLetter}18: ${JSON.stringify(cell.value)}`);
  }

  console.log('\nRow 19 values:');
  for (let col = 1; col <= 11; col++) {
    const cell = worksheet.getCell(19, col);
    const colLetter = String.fromCharCode(64 + col);
    console.log(`  ${colLetter}19: ${JSON.stringify(cell.value)}`);
  }
}

check();
