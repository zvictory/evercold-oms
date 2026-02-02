import ExcelJS from 'exceljs';

async function analyzeSignatureStructure() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('/Users/user/Downloads/счет фактура2 (1).xlsx');

  const sheet = workbook.worksheets[0];

  console.log('=== SIGNATURE SECTION STRUCTURE ===\n');

  // Find the totals row (search for "Итого")
  let totalsRow = null;
  for (let i = 1; i <= 30; i++) {
    const cell = sheet.getCell(`A${i}`);
    if (cell.value && cell.value.toString().includes('Итого')) {
      totalsRow = i;
      break;
    }
  }

  console.log(`Totals row: ${totalsRow}\n`);

  // Show 12 rows after totals
  for (let i = totalsRow; i <= totalsRow + 12; i++) {
    const row = sheet.getRow(i);
    const cellA = sheet.getCell(`A${i}`);
    const cellB = sheet.getCell(`B${i}`);
    const height = row.height || 15;
    const valueA = cellA.value || '';
    const valueB = cellB.value || '';
    const mergedValue = (valueA + ' ' + valueB).trim() || '(empty)';

    console.log(`Row ${i} (offset +${i - totalsRow}): height=${height.toString().padEnd(6)} content="${mergedValue}"`);
  }
}

analyzeSignatureStructure().catch(console.error);
