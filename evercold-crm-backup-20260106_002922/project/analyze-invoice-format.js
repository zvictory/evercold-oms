const ExcelJS = require('exceljs');

async function analyzeInvoiceFormat() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('/Users/zafar/Downloads/счет фактура2.xlsx');

  console.log('=== WORKBOOK ANALYSIS ===');
  console.log(`Number of worksheets: ${workbook.worksheets.length}`);
  console.log('');

  workbook.worksheets.forEach((worksheet, index) => {
    console.log(`\n=== WORKSHEET ${index + 1}: "${worksheet.name}" ===`);
    console.log(`Row count: ${worksheet.rowCount}`);
    console.log(`Column count: ${worksheet.columnCount}`);
    console.log('');

    // Get all rows with data
    console.log('--- CONTENT ---');
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const values = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        values.push({
          col: colNumber,
          value: cell.value,
          type: cell.type,
          style: {
            font: cell.font,
            fill: cell.fill,
            border: cell.border,
            alignment: cell.alignment,
            numFmt: cell.numFmt
          }
        });
      });
      console.log(`\nRow ${rowNumber}:`);
      values.forEach(v => {
        if (v.value !== null && v.value !== undefined && v.value !== '') {
          console.log(`  Col ${v.col}: "${v.value}" (type: ${v.type})`);
          if (v.style.font) {
            console.log(`    Font:`, JSON.stringify(v.style.font));
          }
          if (v.style.fill) {
            console.log(`    Fill:`, JSON.stringify(v.style.fill));
          }
          if (v.style.numFmt) {
            console.log(`    NumFmt: ${v.style.numFmt}`);
          }
        }
      });
    });

    // Column widths
    console.log('\n--- COLUMN WIDTHS ---');
    worksheet.columns.forEach((col, index) => {
      if (col.width) {
        console.log(`Column ${index + 1}: ${col.width}`);
      }
    });

    // Merged cells
    if (worksheet.model.merges && worksheet.model.merges.length > 0) {
      console.log('\n--- MERGED CELLS ---');
      console.log(worksheet.model.merges);
    }
  });
}

analyzeInvoiceFormat().catch(console.error);
