import * as xml2js from 'xml2js';
import { readFile } from 'fs/promises';

export interface ParsedOrder {
  orderNumber: string;
  orderDate: Date;
  customerName: string;
  branchCode?: string;
  branchName?: string;
  contractInfo?: string;
  items: ParsedOrderItem[];
  sourceType: 'DETAILED' | 'REGISTRY';
}

export interface ParsedOrderItem {
  productName: string;
  barcode?: string;
  sapCode?: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
  vatRate?: number;
  vatAmount?: number;
  totalAmount?: number;
  branchCode?: string;
  branchName?: string;
}

export interface ParsedRegistry {
  batchId: string;
  receivedDate: Date;
  orders: ParsedOrder[];
}

export async function parseExcelFile(
  filePath: string,
  receivedDate: Date
): Promise<ParsedOrder[] | ParsedRegistry> {
  const fileContent = await readFile(filePath, 'utf-8');

  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(fileContent);

  const worksheet = result.Workbook.Worksheet[0];
  const table = worksheet.Table[0];
  const rows = table.Row;

  const format = detectFormat(rows);

  if (format === 'DETAILED') {
    return [parseDetailedOrder(rows, receivedDate)];
  } else {
    return parseRegistry(rows, receivedDate);
  }
}

function detectFormat(rows: any[]): 'DETAILED' | 'REGISTRY' {
  if (rows.length < 3) return 'DETAILED';

  const row1 = extractRowData(rows[0]);

  const firstCell = String(row1[0] || '');
  if (firstCell.includes('Заказ №')) {
    return 'DETAILED';
  }

  if (row1[2] && row1.length > 10 && row1[3]) {
    return 'REGISTRY';
  }

  return 'DETAILED';
}

function extractRowData(row: any): string[] {
  if (!row.Cell) return [];

  return row.Cell.map((cell: any) => {
    if (!cell.Data || !cell.Data[0]) return '';
    const value = cell.Data[0]._ || cell.Data[0];
    return String(value || '');
  });
}

function parseDetailedOrder(rows: any[], receivedDate: Date): ParsedOrder {
  const row1 = extractRowData(rows[0]);
  const row3 = extractRowData(rows[2]);
  const row4 = extractRowData(rows[3]);
  const row5 = extractRowData(rows[4]);

  const orderText = row1[0] || '';
  const orderMatch = orderText.match(/Заказ № (\d+) от ([\d.]+)/) ||
                     orderText.match(/Заказ № (\d+)/);
  const orderNumber = orderMatch ? orderMatch[1] : '';
  const orderDateStr = orderMatch && orderMatch[2] ? orderMatch[2] : '';

  const supplierText = row3[0] || '';
  const customerText = row4[0] || '';
  const contractText = row5[0] || '';

  // Match variations:
  // "Получатель: Korzinka - Navruz" (with branch)
  // "Получатель : РЦ СУРУМ" (without branch)
  // "Получатель: РЦ СУРУМ" (without branch, no space after colon)
  const customerMatch = customerText.match(/Получатель\s*:\s*(.+?)\s*-\s*(.+)/) ||
                        customerText.match(/Получатель\s*:\s*(.+)/);
  const customerName = customerMatch ? customerMatch[1].trim() : 'Unknown';
  const branchName = customerMatch && customerMatch[2] ? customerMatch[2].trim() : '';

  const items: ParsedOrderItem[] = [];

  for (let i = 6; i < rows.length - 1; i++) {
    const rowData = extractRowData(rows[i]);

    if (rowData[1] && rowData[1] !== 'Итого') {
      // Handle VAT rate - it might be decimal (0.12) or percentage (12%)
      let vatRate = parseFloat(rowData[7]?.toString().replace('%', '')) || 12;
      // If VAT rate is decimal (like 0.12), convert to percentage
      if (vatRate < 1) {
        vatRate = vatRate * 100;
      }

      items.push({
        productName: rowData[1],
        barcode: rowData[2],
        sapCode: rowData[3],
        quantity: parseFloat(rowData[4]) || 0,
        unitPrice: parseFloat(rowData[5]) || 0,
        subtotal: parseFloat(rowData[6]) || 0,
        vatRate,
        vatAmount: parseFloat(rowData[8]) || 0,
        totalAmount: parseFloat(rowData[9]) || 0,
      });
    }
  }

  return {
    orderNumber,
    orderDate: parseOrderDate(orderDateStr) || receivedDate,
    customerName,
    branchName,
    contractInfo: contractText.replace('Договор / Спец. №, дата:', '').trim(),
    items,
    sourceType: 'DETAILED',
  };
}

function parseRegistry(rows: any[], receivedDate: Date): ParsedRegistry {
  const row1 = extractRowData(rows[0]);
  const row2 = extractRowData(rows[1]);
  const row3 = extractRowData(rows[2]);

  const supplierCode = row1[1] || '';
  const supplierName = row1[2] || '';

  const branchCodes = row1.slice(3).filter(x => x);
  const branchNames = row2.slice(3).filter(x => x);
  const orderNumbers = row3.slice(3).filter(x => x);

  const customerName = branchNames.length > 0 && branchNames[0].includes(' - ')
    ? branchNames[0].split(' - ')[0].trim()
    : 'Korzinka';

  const productRows: any[] = [];
  for (let i = 3; i < rows.length; i++) {
    const rowData = extractRowData(rows[i]);
    if (rowData[1]) {
      productRows.push(rowData);
    }
  }

  const orders: ParsedOrder[] = [];
  const batchId = `BATCH_${Date.now()}`;

  for (let colIndex = 0; colIndex < branchCodes.length; colIndex++) {
    const branchCode = branchCodes[colIndex];
    const branchName = branchNames[colIndex];
    const orderNumber = orderNumbers[colIndex];

    if (!orderNumber) continue;

    const items: ParsedOrderItem[] = [];

    for (const productRow of productRows) {
      const quantity = parseFloat(productRow[3 + colIndex]) || 0;

      if (quantity > 0) {
        items.push({
          productName: productRow[2],
          sapCode: productRow[1],
          quantity,
          branchCode,
          branchName,
        });
      }
    }

    if (items.length > 0) {
      orders.push({
        orderNumber,
        orderDate: receivedDate,
        customerName,
        branchCode,
        branchName,
        items,
        sourceType: 'REGISTRY',
      });
    }
  }

  return {
    batchId,
    receivedDate,
    orders,
  };
}

function parseOrderDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }

  return null;
}
