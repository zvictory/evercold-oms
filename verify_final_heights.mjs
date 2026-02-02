import ExcelJS from 'exceljs';

async function verifyFinalHeights() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('/tmp/test-invoice-final.xlsx');

  const sheet = workbook.worksheets[0];

  console.log('=== FINAL ROW HEIGHTS VERIFICATION ===\n');

  // Find totals row
  let totalsRow = null;
  for (let i = 1; i <= 30; i++) {
    const cell = sheet.getCell(`A${i}`);
    if (cell.value && cell.value.toString().includes('Итого')) {
      totalsRow = i;
      break;
    }
  }

  console.log(`Totals row: ${totalsRow}\n`);
  console.log('Expected structure:');
  console.log(`  totalsRow + 0: Итого (15)`);
  console.log(`  totalsRow + 1: Всего с учетом НДС (15)`);
  console.log(`  totalsRow + 2: Empty (15)`);
  console.log(`  totalsRow + 3: Руководитель (9.75)`);
  console.log(`  totalsRow + 4: Empty (15)`);
  console.log(`  totalsRow + 5: Главный бухгалтер (24.75)`);
  console.log(`  totalsRow + 6: Empty (15)`);
  console.log(`  totalsRow + 7: М.П. (24.75)`);
  console.log(`  totalsRow + 8: Empty (15)`);
  console.log(`  totalsRow + 9: Товар отпустил (12.75)\n`);

  console.log('Actual values:\n');

  for (let i = totalsRow; i <= totalsRow + 9; i++) {
    const row = sheet.getRow(i);
    const cellA = sheet.getCell(`A${i}`);
    const cellB = sheet.getCell(`B${i}`);
    const height = row.height || 15;
    const valueA = cellA.value || '';
    const valueB = cellB.value || '';
    const content = (valueA + ' ' + valueB).trim() || '(empty)';

    console.log(`  Row ${i} (offset +${i - totalsRow}): height=${height.toString().padEnd(6)} content="${content}"`);
  }

  // Header verification
  console.log('\n=== HEADER & DATA ROWS ===\n');
  console.log(`Row 14 (header): ${sheet.getRow(14).height} (expected: 23.25)`);
  console.log(`Row 17 (data):   ${sheet.getRow(17).height} (expected: 17.25)`);

  // Column widths
  console.log('\n=== COLUMN WIDTHS ===\n');
  console.log(`Col A: ${sheet.getColumn(1).width} (expected: 4.140625)`);
  console.log(`Col B: ${sheet.getColumn(2).width} (expected: 12.140625)`);
  console.log(`Col C: ${sheet.getColumn(3).width} (expected: 20.7109375)`);
}

verifyFinalHeights().catch(console.error);
