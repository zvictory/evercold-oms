import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

export interface ParsedImageOrder {
  orderNumber: string;
  customerName: string;
  items: {
    materialCode: string;
    productDescription: string;
    branchName: string;
    quantity: number;
  }[];
}

/**
 * Parse image of Excel table using OCR
 * Supports: PNG, JPG, JPEG, BMP, TIFF
 */
export async function parseImageFile(
  filePath: string
): Promise<ParsedImageOrder[]> {
  let worker = null;
  try {
    // Preprocess image for better OCR results
    const processedImagePath = filePath + '.processed.png';
    await sharp(filePath)
      .greyscale()
      .normalize()
      .sharpen()
      .toFile(processedImagePath);

    console.log('Creating Tesseract worker...');

    // Create worker for Node.js environment (no workerPath needed - it auto-detects)
    worker = await createWorker('rus+eng', 1, {
      logger: (m) => {
        console.log(`[Tesseract] ${m.status}: ${m.progress ? Math.round(m.progress * 100) + '%' : ''}`);
      },
    });

    console.log('Performing OCR...');
    const { data } = await worker.recognize(processedImagePath);

    await worker.terminate();
    worker = null;

    const extractedText = data.text;
    console.log('Extracted text length:', extractedText.length);
    console.log('First 500 characters:', extractedText.substring(0, 500));

    // Parse the extracted text into structured data
    const orders = parseOCRText(extractedText);

    return orders;
  } catch (error: any) {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

function parseOCRText(text: string): ParsedImageOrder[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Find the header row
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('документ') && line.includes('закупк')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error('Could not find header row in image. Please ensure the image contains the table header.');
  }

  // Parse data rows
  const orderMap = new Map<string, any[]>();

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    // Try to extract data from the line
    // Expected format: Document | Supplier | Material | Description | Branch | Quantity
    const parsed = parseDataLine(line);

    if (parsed) {
      if (!orderMap.has(parsed.orderNumber)) {
        orderMap.set(parsed.orderNumber, []);
      }

      orderMap.get(parsed.orderNumber)!.push({
        materialCode: parsed.materialCode,
        productDescription: parsed.productDescription,
        branchName: parsed.branchName,
        quantity: parsed.quantity,
      });
    }
  }

  // Convert to ParsedImageOrder format
  const orders: ParsedImageOrder[] = [];
  for (const [orderNumber, items] of orderMap.entries()) {
    orders.push({
      orderNumber,
      customerName: 'Korzinka', // Default to Korzinka
      items,
    });
  }

  return orders;
}

function parseDataLine(line: string): {
  orderNumber: string;
  materialCode: string;
  productDescription: string;
  branchName: string;
  quantity: number;
} | null {
  // Split by multiple spaces or tabs
  const parts = line.split(/\s{2,}|\t/).map(p => p.trim()).filter(p => p.length > 0);

  if (parts.length < 5) {
    return null;
  }

  // Extract order number (should be numeric, 10 digits)
  const orderNumber = parts.find(p => /^\d{10}$/.test(p));
  if (!orderNumber) {
    return null;
  }

  // Extract material code (format: 113000006-XXXXX)
  const materialCode = parts.find(p => /^\d{9}-\d{5}$/.test(p));
  if (!materialCode) {
    return null;
  }

  // Extract quantity (should be numeric at the end)
  const quantityStr = parts[parts.length - 1];
  const quantity = parseFloat(quantityStr);
  if (isNaN(quantity)) {
    return null;
  }

  // Extract branch name (contains "Korzinka")
  const branchName = parts.find(p => p.toLowerCase().includes('korzinka')) || '';

  // Extract product description (everything between material code and branch)
  const materialIndex = parts.indexOf(materialCode);
  const branchIndex = parts.indexOf(branchName);
  const productDescription = branchIndex > materialIndex
    ? parts.slice(materialIndex + 1, branchIndex).join(' ')
    : parts[materialIndex + 1] || '';

  return {
    orderNumber,
    materialCode,
    productDescription,
    branchName,
    quantity,
  };
}

/**
 * Alternative: Parse using table detection
 * This approach tries to detect table structure from OCR data
 */
export async function parseImageWithTableDetection(
  filePath: string
): Promise<ParsedImageOrder[]> {
  let worker = null;
  try {
    console.log('Creating Tesseract worker for table detection...');

    worker = await createWorker('rus+eng', 1, {
      logger: (m) => {
        console.log(`[Tesseract] ${m.status}: ${m.progress ? Math.round(m.progress * 100) + '%' : ''}`);
      },
    });

    console.log('Performing OCR with table detection...');
    const { data } = await worker.recognize(filePath);

    await worker.terminate();
    worker = null;

    // Use hOCR (HTML) output for better structure detection
    const words = (data as any).words || [];
    const lines = (data as any).lines || [];

    // Group words into table cells based on position
    const cells = groupWordsIntoTableCells(words, lines);

    // Detect table structure
    const table = detectTableStructure(cells);

    // Parse table into orders
    const orders = parseTableIntoOrders(table);

    return orders;
  } catch (error: any) {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
    throw new Error(`Failed to process image with table detection: ${error.message}`);
  }
}

function groupWordsIntoTableCells(words: any[], lines: any[]): any[][] {
  // Sort words by Y position (top to bottom) then X position (left to right)
  const sortedWords = [...words].sort((a, b) => {
    if (Math.abs(a.bbox.y0 - b.bbox.y0) < 5) {
      return a.bbox.x0 - b.bbox.x0;
    }
    return a.bbox.y0 - b.bbox.y0;
  });

  // Group words into rows based on Y position
  const rows: any[][] = [];
  let currentRow: any[] = [];
  let lastY = -1;

  for (const word of sortedWords) {
    if (lastY === -1 || Math.abs(word.bbox.y0 - lastY) < 10) {
      currentRow.push(word);
    } else {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [word];
    }
    lastY = word.bbox.y0;
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}

function detectTableStructure(rows: any[][]): string[][] {
  // Convert word groups into cell values
  const table: string[][] = [];

  for (const row of rows) {
    const cellValues: string[] = [];
    let currentCell = '';
    let lastX = -1;

    for (const word of row) {
      if (lastX === -1 || word.bbox.x0 - lastX < 20) {
        // Same cell
        currentCell += (currentCell ? ' ' : '') + word.text;
      } else {
        // New cell
        if (currentCell) {
          cellValues.push(currentCell);
        }
        currentCell = word.text;
      }
      lastX = word.bbox.x1;
    }

    if (currentCell) {
      cellValues.push(currentCell);
    }

    if (cellValues.length > 0) {
      table.push(cellValues);
    }
  }

  return table;
}

function parseTableIntoOrders(table: string[][]): ParsedImageOrder[] {
  if (table.length === 0) {
    return [];
  }

  // Find column indices
  const headerRow = table[0];
  const colIndices = {
    documentNumber: findColumnIndex(headerRow, ['документ', 'закупк']),
    materialCode: findColumnIndex(headerRow, ['материал']),
    productDescription: findColumnIndex(headerRow, ['краткий', 'текст']),
    branchName: findColumnIndex(headerRow, ['имя', 'завод']),
    quantity: findColumnIndex(headerRow, ['количеств']),
  };

  // Parse data rows
  const orderMap = new Map<string, any[]>();

  for (let i = 1; i < table.length; i++) {
    const row = table[i];

    const orderNumber = row[colIndices.documentNumber] || '';
    const materialCode = row[colIndices.materialCode] || '';
    const productDescription = row[colIndices.productDescription] || '';
    const branchName = row[colIndices.branchName] || '';
    const quantity = parseFloat(row[colIndices.quantity]) || 0;

    if (!orderNumber || !materialCode || quantity === 0) {
      continue;
    }

    if (!orderMap.has(orderNumber)) {
      orderMap.set(orderNumber, []);
    }

    orderMap.get(orderNumber)!.push({
      materialCode,
      productDescription,
      branchName,
      quantity,
    });
  }

  // Convert to ParsedImageOrder format
  const orders: ParsedImageOrder[] = [];
  for (const [orderNumber, items] of orderMap.entries()) {
    orders.push({
      orderNumber,
      customerName: 'Korzinka',
      items,
    });
  }

  return orders;
}

function findColumnIndex(headerRow: string[], keywords: string[]): number {
  for (let i = 0; i < headerRow.length; i++) {
    const cell = headerRow[i].toLowerCase();
    if (keywords.every(keyword => cell.includes(keyword))) {
      return i;
    }
  }
  return -1;
}
