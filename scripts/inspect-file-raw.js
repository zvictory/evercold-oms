const xml2js = require('xml2js');
const { readFile } = require('fs/promises');

async function inspectFile() {
  try {
    const filePath = 'public/uploads/1769598333193_Реестр заказов.xls';
    const fileContent = await readFile(filePath, 'utf-8');

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(fileContent);

    const worksheet = result.Workbook.Worksheet[0];
    const table = worksheet.Table[0];
    const rows = table.Row;

    console.log('\n=== FILE INSPECTION ===\n');
    console.log(`Total rows: ${rows.length}\n`);

    // Check first 5 rows
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i];
      if (!row.Cell) {
        console.log(`Row ${i + 1}: No cells`);
        continue;
      }

      const cells = row.Cell.map((cell) => {
        if (!cell.Data || !cell.Data[0]) return '';
        const value = cell.Data[0]._ || cell.Data[0];
        return String(value || '');
      });

      console.log(`Row ${i + 1} (${cells.length} cells):`);
      cells.slice(0, 10).forEach((cell, idx) => {
        if (cell) {
          console.log(`  [${idx}] ${cell.substring(0, 50)}${cell.length > 50 ? '...' : ''}`);
        }
      });
      console.log('');
    }

    // Format detection logic
    const row1 = rows[0].Cell ? rows[0].Cell.map((cell) => {
      if (!cell.Data || !cell.Data[0]) return '';
      const value = cell.Data[0]._ || cell.Data[0];
      return String(value || '');
    }) : [];

    console.log('=== FORMAT DETECTION ===\n');
    console.log(`First cell: "${row1[0] || ''}"`);
    console.log(`Contains "Заказ №": ${String(row1[0] || '').includes('Заказ №')}`);
    console.log(`row1[2] exists: ${!!row1[2]}`);
    console.log(`row1.length > 10: ${row1.length > 10}`);
    console.log(`row1[3] exists: ${!!row1[3]}`);

    if (String(row1[0] || '').includes('Заказ №')) {
      console.log('\n→ Detected as: DETAILED');
    } else if (row1[2] && row1.length > 10 && row1[3]) {
      console.log('\n→ Detected as: REGISTRY');
    } else {
      console.log('\n→ Detected as: DETAILED (default)');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspectFile();
