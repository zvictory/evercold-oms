import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';

export interface PurchaseOrderLine {
  documentNumber: string;
  supplierCode?: string;
  supplierName?: string;
  materialCode: string;
  productDescription: string;
  branchCode?: string;
  branchName: string;
  quantity: number;
}

export interface ParsedPurchaseOrder {
  orderNumber: string;
  customerName: string;
  items: {
    materialCode: string;
    productDescription: string;
    branchCode?: string;
    branchName: string;
    quantity: number;
  }[];
}

/**
 * Parse purchase order Excel file with Russian format
 * Expected columns:
 * - Документ закупки (Purchase Document)
 * - Поставщик/завод-поставщик (Supplier/Factory-supplier)
 * - Материал (Material)
 * - Краткий текст (Short text)
 * - Имя завода (Factory name)
 * - Количество заказа (Order quantity)
 */
export async function parsePurchaseOrderFile(
  filePath: string
): Promise<ParsedPurchaseOrder[]> {
  const fileBuffer = await readFile(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON with header row
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  if (rawData.length < 2) {
    throw new Error('File is empty or has insufficient data');
  }

  // Detect format - check if it's a registry (matrix) format
  const format = detectFileFormat(rawData);

  if (format === 'REGISTRY') {
    return parseRegistryFormat(rawData);
  } else {
    return parseDetailedFormat(rawData);
  }
}

/**
 * Detect whether the file is in REGISTRY (matrix) or DETAILED format
 */
function detectFileFormat(rawData: any[][]): 'REGISTRY' | 'DETAILED' {
  if (rawData.length < 3) return 'DETAILED';

  const row0 = rawData[0] || [];
  const row1 = rawData[1] || [];
  const row2 = rawData[2] || [];

  // Registry format has:
  // Row 0: null, supplier code, supplier name, branch codes (K013, K022, ...)
  // Row 1: П/П, Код товара, Наименование товара, branch names
  // Row 2: null, null, null, order numbers

  // Check if row 1 has "Код товара" or "Наименование товара" and row 0 has branch codes
  const hasProductHeaders = row1.some((cell: any) => {
    const str = String(cell || '').toLowerCase();
    return str.includes('код товара') || str.includes('наименование');
  });

  const hasBranchCodes = row0.filter((cell: any, idx: number) => {
    if (idx < 3) return false; // Skip first 3 columns
    const str = String(cell || '');
    return str.match(/^K\d+$/); // Matches K013, K022, etc.
  }).length > 0;

  if (hasProductHeaders && hasBranchCodes) {
    return 'REGISTRY';
  }

  return 'DETAILED';
}

/**
 * Parse registry (matrix) format
 * Row 0: null, supplier_code, supplier_name, K013, K022, K023, ...
 * Row 1: П/П, Код товара, Наименование товара, Korzinka - Branch1, ...
 * Row 2: null, null, null, 4506514022, 4506514086, ...
 * Row 3+: 1, 107000001-00001, Лёд пищевой Ever Cold 3кг, qty, qty, ...
 */
function parseRegistryFormat(rawData: any[][]): ParsedPurchaseOrder[] {
  const row0 = rawData[0] || [];
  const row1 = rawData[1] || [];
  const row2 = rawData[2] || [];

  // Extract branch codes from row 0 (starting from column 3)
  const branchCodes: string[] = [];
  for (let i = 3; i < row0.length; i++) {
    const code = String(row0[i] || '').trim();
    if (code) branchCodes.push(code);
  }

  // Extract branch names from row 1 (starting from column 3)
  const branchNames: string[] = [];
  for (let i = 3; i < row1.length; i++) {
    const name = String(row1[i] || '').trim();
    if (name) branchNames.push(name);
  }

  // Extract order numbers from row 2 (starting from column 3)
  const orderNumbers: string[] = [];
  for (let i = 3; i < row2.length; i++) {
    const orderNum = String(row2[i] || '').trim();
    if (orderNum) orderNumbers.push(orderNum);
  }

  // Extract customer name from first branch name
  const customerName = branchNames.length > 0 && branchNames[0].includes(' - ')
    ? branchNames[0].split(' - ')[0].trim()
    : 'Korzinka';

  // Parse product rows (starting from row 3)
  const productRows: Array<{
    materialCode: string;
    productDescription: string;
    quantities: number[];
  }> = [];

  for (let i = 3; i < rawData.length; i++) {
    const row = rawData[i] || [];
    const materialCode = String(row[1] || '').trim();
    const productDescription = String(row[2] || '').trim();

    if (!materialCode || !productDescription) continue;

    const quantities: number[] = [];
    for (let j = 3; j < row.length; j++) {
      const qty = parseFloat(row[j]) || 0;
      quantities.push(qty);
    }

    productRows.push({
      materialCode,
      productDescription,
      quantities,
    });
  }

  // Create orders for each branch
  const orders: ParsedPurchaseOrder[] = [];

  for (let colIndex = 0; colIndex < Math.min(branchCodes.length, orderNumbers.length); colIndex++) {
    const branchCode = branchCodes[colIndex];
    const branchName = branchNames[colIndex] || '';
    const orderNumber = orderNumbers[colIndex];

    if (!orderNumber) continue;

    const items: ParsedPurchaseOrder['items'] = [];

    for (const productRow of productRows) {
      const quantity = productRow.quantities[colIndex] || 0;

      if (quantity > 0) {
        items.push({
          materialCode: productRow.materialCode,
          productDescription: productRow.productDescription,
          branchCode,
          branchName,
          quantity,
        });
      }
    }

    if (items.length > 0) {
      orders.push({
        orderNumber,
        customerName,
        items,
      });
    }
  }

  return orders;
}

/**
 * Parse detailed (single branch) format
 */
function parseDetailedFormat(rawData: any[][]): ParsedPurchaseOrder[] {
  // Find column indices
  const headerRow = rawData[0];
  const colIndices = findColumnIndices(headerRow);

  // Parse all lines
  const lines: PurchaseOrderLine[] = [];
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];

    if (!row || row.length === 0) continue;

    const documentNumber = getCellValue(row, colIndices.documentNumber);
    const materialCode = getCellValue(row, colIndices.materialCode);
    const quantity = parseFloat(getCellValue(row, colIndices.quantity)) || 0;

    // Skip rows without essential data
    if (!documentNumber || !materialCode || quantity === 0) continue;

    lines.push({
      documentNumber: String(documentNumber).trim(),
      supplierCode: getCellValue(row, colIndices.supplierCode),
      supplierName: getCellValue(row, colIndices.supplierName),
      materialCode: String(materialCode).trim(),
      productDescription: getCellValue(row, colIndices.productDescription) || '',
      branchCode: getCellValue(row, colIndices.branchCode) || '',
      branchName: getCellValue(row, colIndices.branchName) || '',
      quantity,
    });
  }

  // Group by order number
  const orderMap = new Map<string, PurchaseOrderLine[]>();
  for (const line of lines) {
    if (!orderMap.has(line.documentNumber)) {
      orderMap.set(line.documentNumber, []);
    }
    orderMap.get(line.documentNumber)!.push(line);
  }

  // Convert to ParsedPurchaseOrder format
  const orders: ParsedPurchaseOrder[] = [];
  for (const [orderNumber, orderLines] of orderMap.entries()) {
    orders.push({
      orderNumber,
      customerName: 'Korzinka', // Default to Korzinka based on branch names
      items: orderLines.map(line => ({
        materialCode: line.materialCode,
        productDescription: line.productDescription,
        branchCode: line.branchCode,
        branchName: line.branchName,
        quantity: line.quantity,
      })),
    });
  }

  return orders;
}

function findColumnIndices(headerRow: any[]): {
  documentNumber: number;
  supplierCode: number;
  supplierName: number;
  materialCode: number;
  productDescription: number;
  branchCode: number;
  branchName: number;
  quantity: number;
} {
  const indices = {
    documentNumber: -1,
    supplierCode: -1,
    supplierName: -1,
    materialCode: -1,
    productDescription: -1,
    branchCode: -1,
    branchName: -1,
    quantity: -1,
  };

  for (let i = 0; i < headerRow.length; i++) {
    const header = String(headerRow[i] || '').toLowerCase().trim();

    // Документ закупки (Purchase Document)
    if (header.includes('документ') && header.includes('закупк')) {
      indices.documentNumber = i;
    }
    // Поставщик/завод-поставщик (Supplier)
    else if (header.includes('поставщик') || header.includes('завод-поставщик')) {
      if (indices.supplierCode === -1) {
        indices.supplierCode = i;
        indices.supplierName = i;
      }
    }
    // Материал (Material) OR Sap code
    else if (header.includes('материал') || header.includes('sap') && header.includes('code')) {
      indices.materialCode = i;
    }
    // Краткий текст (Short text) OR Product
    else if ((header.includes('краткий') && header.includes('текст')) || header === 'product') {
      indices.productDescription = i;
    }
    // branch code (NEW!)
    else if (header.includes('branch') && header.includes('code')) {
      indices.branchCode = i;
    }
    // Имя завода (Factory name) OR Branch name
    else if ((header.includes('имя') && header.includes('завод')) ||
             (header.includes('branch') && header.includes('name'))) {
      indices.branchName = i;
    }
    // Количество заказа (Order quantity)
    else if (header.includes('количеств') && header.includes('заказ')) {
      indices.quantity = i;
    }
  }

  // Validate required columns
  if (indices.documentNumber === -1) {
    throw new Error('Required column not found: Документ закупки (Purchase Document)');
  }
  if (indices.materialCode === -1) {
    throw new Error('Required column not found: Материал (Material) or Sap code');
  }
  if (indices.branchName === -1 && indices.branchCode === -1) {
    throw new Error('Required column not found: Branch name or branch code');
  }
  if (indices.quantity === -1) {
    throw new Error('Required column not found: Количество заказа (Order quantity)');
  }

  return indices;
}

function getCellValue(row: any[], index: number): string {
  if (index === -1 || index >= row.length) return '';
  const value = row[index];
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Extract branch code from branch name
 * Examples:
 * - "Korzinka - Navruz" → "Navruz"
 * - "Korzinka - Andijon To'rko'cha" → "Andijon To'rko'cha"
 */
export function extractBranchCode(branchName: string): string | null {
  if (!branchName) return null;

  // Remove "Korzinka - " prefix
  const cleaned = branchName.replace(/^Korzinka\s*-\s*/i, '').trim();

  return cleaned || null;
}
