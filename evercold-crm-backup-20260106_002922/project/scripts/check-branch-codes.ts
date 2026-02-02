import * as fs from 'fs';
import * as xml2js from 'xml2js';

async function checkBranchCodes() {
  const filePath = '/Users/user/Documents/evercold-crm/public/uploads/1765649436193_Реестр заказов (1).xls';
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

  console.log('Branch Codes (Row 1):', row1Data.slice(3, 13));
  console.log('Branch Names (Row 2):', row2Data.slice(3, 13));
}

checkBranchCodes();
