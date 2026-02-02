import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';

async function examineExcel() {
  const filePath = '/Users/user/Downloads/100011478  ООО EGGSTRA SPECIAL FARMS.xlsx';

  const fileBuffer = await readFile(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  console.log('Sheet names:', workbook.SheetNames);

  const sheetName = workbook.SheetNames[0];
  console.log('\nExamining sheet:', sheetName);

  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON to see structure
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  console.log('\nTotal rows:', data.length);
  console.log('\nFirst 10 rows:');
  for (let i = 0; i < Math.min(10, data.length); i++) {
    console.log(`Row ${i}:`, data[i]);
  }

  // Show header row
  if (data.length > 0) {
    console.log('\nHeader row (Row 0):');
    console.log(data[0]);
  }

  // Show a few data rows
  console.log('\nSample data rows:');
  for (let i = 1; i < Math.min(6, data.length); i++) {
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
