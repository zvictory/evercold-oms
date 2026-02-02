import ExcelJS from 'exceljs';
import path from 'path';

async function analyzeTemplate() {
  const workbook = new ExcelJS.Workbook();
  const templatePath = path.join(process.cwd(), 'templates', 'schet-faktura-template.xlsx');

  await workbook.xlsx.readFile(templatePath);

  const worksheet = workbook.worksheets[0];

  console.log('=== TEMPLATE ANALYSIS ===\n');
  console.log(`Worksheet name: ${worksheet.name}`);
  console.log(`Total rows: ${worksheet.rowCount}`);
  console.log(`Total columns: ${worksheet.columnCount}\n`);

  console.log('=== FIRST 25 ROWS ===\n');

  // Analyze first 25 rows to find key positions
  for (let rowNum = 1; rowNum <= Math.min(25, worksheet.rowCount); rowNum++) {
    const row = worksheet.getRow(rowNum);
    const cellValues: string[] = [];

    // Check first 11 columns (A-K)
    for (let col = 1; col <= 11; col++) {
      const cell = row.getCell(col);
      const value = cell.value;

      if (value !== null && value !== undefined && value !== '') {
        let displayValue = '';
        if (typeof value === 'object' && 'richText' in value) {
          displayValue = value.richText.map((t: any) => t.text).join('');
        } else if (typeof value === 'object' && 'formula' in value) {
          displayValue = `{formula: ${value.formula}}`;
        } else {
          displayValue = String(value);
        }

        const colLetter = String.fromCharCode(64 + col); // A=65
        cellValues.push(`${colLetter}${rowNum}: "${displayValue}"`);
      }
    }

    if (cellValues.length > 0) {
      console.log(`Row ${rowNum}: ${cellValues.join(' | ')}`);
    }
  }

  console.log('\n=== MERGED CELLS (first 25 rows) ===\n');

  // @ts-ignore - ExcelJS doesn't expose _merges in types but it exists
  const merges = worksheet._merges || {};
  Object.keys(merges).forEach(merge => {
    const mergeRef = merge;
    const startRow = Number(worksheet.getCell(merge.split(':')[0]).row);
    if (startRow <= 25) {
      console.log(merge);
    }
  });
}

analyzeTemplate().catch(console.error);
