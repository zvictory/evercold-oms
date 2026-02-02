import * as fs from 'fs';
import * as xml2js from 'xml2js';
import * as path from 'path';

async function extractAllBranchCodes() {
  const uploadsDir = '/Users/user/Documents/evercold-crm/public/uploads';
  const files = await fs.promises.readdir(uploadsDir);
  const xlsFiles = files.filter(f => f.endsWith('.xls'));

  const branchMapping = new Map<string, string>();

  for (const file of xlsFiles.slice(-3)) { // Check last 3 files
    try {
      const filePath = path.join(uploadsDir, file);
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(fileContent);

      const worksheet = result.Workbook.Worksheet[0];
      const table = worksheet.Table[0];
      const rows = table.Row;

      const extractRowData = (row: any) => {
        if (!row.Cell) return [];
        return row.Cell.map((cell: any) => {
          if (!cell.Data || !cell.Data[0]) return '';
          return String(cell.Data[0]._ || cell.Data[0] || '');
        });
      };

      const row1Data = extractRowData(rows[0]);
      const row2Data = extractRowData(rows[1]);

      // Extract branch codes and names
      for (let i = 3; i < row1Data.length; i++) {
        const code = row1Data[i];
        const name = row2Data[i];

        if (code && code.startsWith('K') && name) {
          // Clean up the name - remove "Korzinka - " prefix
          const cleanName = name.replace(/^Korzinka\s*-\s*/i, '').trim();
          branchMapping.set(code, cleanName);
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  // Print all unique mappings
  console.log('\nAll Branch Code Mappings:');
  console.log('='.repeat(60));
  const sortedEntries = Array.from(branchMapping.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [code, name] of sortedEntries) {
    console.log(`${code.padEnd(10)} => ${name}`);
  }
  console.log('='.repeat(60));
  console.log(`Total unique branches: ${branchMapping.size}`);
}

extractAllBranchCodes();
