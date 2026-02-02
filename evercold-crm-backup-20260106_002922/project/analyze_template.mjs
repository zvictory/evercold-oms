import ExcelJS from 'exceljs';

async function analyzeTemplate() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('/Users/user/Downloads/счет фактура2 (1).xlsx');
  
  const sheet = workbook.worksheets[0];
  
  console.log('=== ROW HEIGHTS (First 35 rows) ===\n');
  
  for (let i = 1; i <= 35; i++) {
    const row = sheet.getRow(i);
    const height = row.height || 15;
    console.log(`Row ${i}: ${height}`);
  }
}

analyzeTemplate().catch(console.error);
