import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';

async function examineExcel() {
  const filePath = '/Users/user/Downloads/4506148419_РЦ_СУРУМ_ИП_ООО_BALTON_TRADING_ASIA.xlsx';

  const fileBuffer = await readFile(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  console.log('Sheet names:', workbook.SheetNames);

  const sheetName = workbook.SheetNames[0];
  console.log('\nExamining sheet:', sheetName);

  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON to see structure
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  console.log('\nTotal rows:', data.length);
  console.log('\nFirst 15 rows:');
  for (let i = 0; i < Math.min(15, data.length); i++) {
    console.log(`Row ${i}:`, data[i]);
  }

  // Show header row
  if (data.length > 0) {
    console.log('\n\n=== HEADER ROW (Row 0) ===');
    console.log(data[0]);
  }

  // Show a few data rows
  console.log('\n\n=== SAMPLE DATA ROWS ===');
  for (let i = 1; i < Math.min(8, data.length); i++) {
    console.log(`\nRow ${i}:`);
    const row = data[i] as any[];
    row.forEach((cell, idx) => {
      if (cell) {
        console.log(`  Col ${idx}: ${cell}`);
      }
    });
  }
}

examineExcel().catch(console.error);
