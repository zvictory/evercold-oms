const ExcelJS = require('exceljs');

async function extractTemplate() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('/Users/zafar/Downloads/счет фактура2.xlsx');

  const worksheet = workbook.worksheets[0];

  console.log('Key rows and their content:\n');

  // Get first 15 rows to understand structure
  for (let i = 1; i <= 15; i++) {
    const row = worksheet.getRow(i);
    const cellValues = [];
    for (let j = 1; j <= 11; j++) {
      const cell = row.getCell(j);
      if (cell.value) {
        cellValues.push(`[${j}]="${cell.value}"`);
      }
    }
    if (cellValues.length > 0) {
      console.log(`Row ${i}: ${cellValues.join(', ')}`);
    }
  }

  console.log('\n\n=== MERGED CELLS ===');
  console.log(worksheet.model.merges);

  console.log('\n\n=== COLUMN WIDTHS ===');
  worksheet.columns.forEach((col, index) => {
    if (col.width) {
      console.log(`Column ${index + 1}: ${col.width}`);
    }
  });

  // Now copy the template and create new file with our data
  console.log('\n\n=== Creating new invoice based on template ===');

  const newWorkbook = new ExcelJS.Workbook();
  await newWorkbook.xlsx.readFile('/Users/zafar/Downloads/счет фактура2.xlsx');
  const newWorksheet = newWorkbook.worksheets[0];

  // Update invoice number and date (Row 3)
  newWorksheet.getCell('A3').value = '№ 2129 от 05.12.2025';

  // Find and update the total cost with VAT
  // Based on the template structure, need to find the row with "Итого" or similar
  for (let i = 1; i <= worksheet.rowCount; i++) {
    const row = newWorksheet.getRow(i);
    const firstCell = row.getCell(1).value;
    if (firstCell && firstCell.toString().includes('Итого')) {
      console.log(`Found total row at: ${i}`);
      // Update the total with VAT value (usually in the last column)
      const lastColWithData = row.getCell(11);
      console.log(`Current value: ${lastColWithData.value}`);
      // We'll update this with our value: 111900.04
    }
  }

  // Save the new file
  await newWorkbook.xlsx.writeFile('/Users/zafar/Downloads/invoice_2129_template_based.xlsx');
  console.log('\nNew invoice created: /Users/zafar/Downloads/invoice_2129_template_based.xlsx');
}

extractTemplate().catch(console.error);
