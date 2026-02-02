import * as XLSX from 'xlsx';

const filePath = '/Users/user/Downloads/Реестр заказов (3).xls';

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

console.log('File:', filePath);
console.log('Sheet:', sheetName);
console.log('Total rows:', rawData.length);
console.log('\nFirst 5 rows:');
rawData.slice(0, 5).forEach((row, idx) => {
  console.log(`Row ${idx}:`, row);
});

// Check row 0 for branch codes
console.log('\n=== Branch Codes in Row 0 ===');
const row0 = rawData[0] || [];
row0.forEach((cell, idx) => {
  if (idx >= 3) {
    const str = String(cell || '');
    if (str.match(/^K\d+$/)) {
      console.log(`Column ${idx}: ${str}`);
    }
  }
});

// Check row 2 for order numbers
console.log('\n=== Order Numbers in Row 2 ===');
const row2 = rawData[2] || [];
row2.forEach((cell, idx) => {
  if (idx >= 3 && cell) {
    console.log(`Column ${idx}: ${cell}`);
  }
});

// Check products
console.log('\n=== Products (Rows 3+) ===');
for (let i = 3; i < Math.min(rawData.length, 6); i++) {
  const row = rawData[i];
  if (!row || row.length === 0) continue;

  const productCode = row[1]; // Column B - Код товара
  const productName = row[2]; // Column C - Наименование товара

  if (productCode) {
    console.log(`Row ${i}: ${productCode} - ${productName}`);

    // Show quantities for first few branches
    for (let colIdx = 3; colIdx < Math.min(row.length, 8); colIdx++) {
      const qty = row[colIdx];
      if (qty) {
        console.log(`  Column ${colIdx} (${row0[colIdx]}): ${qty}`);
      }
    }
  }
}
