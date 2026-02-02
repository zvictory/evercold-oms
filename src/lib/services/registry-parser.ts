import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { OrderStatus, SourceType } from '@prisma/client';

export type DetectedProductRow = {
    rowNumber: number;
    productId: string;
    productName: string;
    sapCode: string | null;
    unitPrice: number;
    vatRate: number;
    productIdentifier: string;
};

export type RegistryParseResult = {
    totalColumns: number;
    processedOrders: number;
    skippedColumns: number;
    errors: Array<{ column: number; branchCode: string; error: string }>;
    detectedProducts?: Array<{
        productName: string;
        rowNumber: number;
        identifier: string;
    }>;
    warnings?: string[];
};

export class RegistryParser {
    async parseAndImport(fileBuffer: any): Promise<RegistryParseResult> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer);
        const worksheet = workbook.getWorksheet(1); // Assume first sheet

        if (!worksheet) {
            throw new Error("Invalid Excel file: No worksheet found");
        }

        const result: RegistryParseResult = {
            totalColumns: 0,
            processedOrders: 0,
            skippedColumns: 0,
            errors: [],
        };

        // Pre-fetch products once for O(1) lookups
        const products = await prisma.product.findMany();

        // Create lookup maps for efficient product matching
        const productsByName = new Map(
            products.map(p => [p.name.toLowerCase(), p])
        );
        const productsBySapCode = new Map(
            products
                .filter(p => p.sapCode)
                .map(p => [p.sapCode!.toLowerCase(), p])
        );
        const productsByBarcode = new Map(
            products
                .filter(p => p.barcode)
                .map(p => [p.barcode!.toLowerCase(), p])
        );

        // Product matching with priority: SAP code > barcode > name > fuzzy match
        const findProductByIdentifier = (identifier: string) => {
            if (!identifier) return undefined;
            const normalized = identifier.toLowerCase().trim();

            // Try exact matches first (highest priority)
            if (productsBySapCode.has(normalized)) {
                return productsBySapCode.get(normalized);
            }
            if (productsByBarcode.has(normalized)) {
                return productsByBarcode.get(normalized);
            }
            if (productsByName.has(normalized)) {
                return productsByName.get(normalized);
            }

            // Fuzzy match: check if normalized is substring or contains substring
            for (const [name, product] of productsByName.entries()) {
                if (name.includes(normalized) || normalized.includes(name)) {
                    return product;
                }
            }
            return undefined;
        };

        // Row definitions based on spec
        const ROW_BRANCH_CODE = 2;
        const ROW_ORDER_NUM = 4;
        const ROW_DATE = 5;
        const ROW_PRODUCTS_START = 8;
        const COL_PRODUCT_IDENTIFIER = 1; // Column A in ExcelJS (1-based)

        const startColumn = 2; // Column B is 2 in ExcelJS (1-based)
        const columnCount = worksheet.columnCount;

        // Detect all products dynamically
        const detectedProducts: DetectedProductRow[] = [];
        let currentRow = ROW_PRODUCTS_START;

        while (currentRow <= worksheet.rowCount) {
            const productCell = worksheet.getCell(currentRow, COL_PRODUCT_IDENTIFIER);
            const productIdentifier = productCell.text?.trim();

            // Stop on empty cell or total row
            if (!productIdentifier ||
                productIdentifier.toLowerCase().includes('итого') ||
                productIdentifier.toLowerCase().includes('total')) {
                break;
            }

            const matchedProduct = findProductByIdentifier(productIdentifier);

            if (matchedProduct && matchedProduct.id && matchedProduct.name) {
                detectedProducts.push({
                    rowNumber: currentRow,
                    productId: matchedProduct.id,
                    productName: matchedProduct.name,
                    sapCode: matchedProduct.sapCode || null,
                    unitPrice: matchedProduct.unitPrice,
                    vatRate: matchedProduct.vatRate,
                    productIdentifier
                });
            } else {
                const warning = `Row ${currentRow}: Product not found - "${productIdentifier}"`;
                console.warn(warning);
                result.warnings = result.warnings || [];
                result.warnings.push(warning);
            }

            currentRow++;
        }

        if (detectedProducts.length === 0) {
            throw new Error("No valid products detected. Expected product identifiers in column A starting from row 8.");
        }

        console.log(
            `Detected ${detectedProducts.length} products:`,
            detectedProducts.map(p => `${p.productName} (row ${p.rowNumber})`).join(', ')
        );

        for (let col = startColumn; col <= columnCount; col++) {
            const branchCode = worksheet.getCell(ROW_BRANCH_CODE, col).text?.trim();

            if (!branchCode) {
                // End of data probably
                continue;
            }
            result.totalColumns++;

            try {
                // 1. Validate Branch
                const branch = await prisma.customerBranch.findUnique({
                    where: { branchCode },
                    include: { customer: true }
                });

                if (!branch) {
                    result.errors.push({ column: col, branchCode, error: `Branch not found: ${branchCode}` });
                    result.skippedColumns++;
                    continue;
                }

                // 2. Parse Order Information
                const registryId = worksheet.getCell(ROW_ORDER_NUM, col).text?.trim(); // e.g. 4506546108
                const dateStr = worksheet.getCell(ROW_DATE, col).text?.trim(); // e.g. 03.12.2025

                // Basic Date Parsing (DD.MM.YYYY)
                const [day, month, year] = dateStr.split('.').map(Number);
                if (!day || !month || !year) {
                    result.errors.push({ column: col, branchCode, error: `Invalid Date Format: ${dateStr}` });
                    result.skippedColumns++;
                    continue;
                }
                const orderDate = new Date(year, month - 1, day);

                // 3. Parse Items (dynamic product rows)
                const orderItemsData: Array<{
                    productId: string;
                    productName: string;
                    sku: string;
                    quantity: number;
                    unitPrice: number;
                    subtotal: number;
                    vatRate: number;
                    vatAmount: number;
                    totalAmount: number;
                }> = [];
                let subtotal = 0;
                let vatTotal = 0;
                let hasAnyQuantity = false;

                for (const productRow of detectedProducts) {
                    const quantityCell = worksheet.getCell(productRow.rowNumber, col);
                    const quantity = parseFloat(quantityCell.text || '0');

                    if (isNaN(quantity) || quantity <= 0) continue;

                    hasAnyQuantity = true;
                    const lineTotal = productRow.unitPrice * quantity;
                    const itemVat = lineTotal * (productRow.vatRate / 100);

                    subtotal += lineTotal;
                    vatTotal += itemVat;

                    orderItemsData.push({
                        productId: productRow.productId,
                        productName: productRow.productName,
                        sku: '', // Will be populated from product lookup if needed
                        quantity: quantity,
                        unitPrice: productRow.unitPrice,
                        subtotal: lineTotal,
                        vatRate: productRow.vatRate,
                        vatAmount: itemVat,
                        totalAmount: lineTotal + itemVat
                    });
                }

                if (!hasAnyQuantity) {
                    result.skippedColumns++;
                    continue;
                }

                // 4. Create Order
                const orderNumber = `${registryId}-${branchCode}`; // Unique Order ID composed of Registry+Branch

                // Check for duplicate
                const existingOrder = await prisma.order.findUnique({
                    where: { orderNumber }
                });

                if (existingOrder) {
                    result.errors.push({ column: col, branchCode, error: `Duplicate Order: ${orderNumber}` });
                    result.skippedColumns++;
                    continue;
                }

                await prisma.order.create({
                    data: {
                        orderNumber,
                        orderDate,
                        customerId: branch.customerId,
                        status: OrderStatus.NEW,
                        subtotal: subtotal,
                        vatAmount: vatTotal,
                        totalAmount: subtotal + vatTotal,
                        sourceType: SourceType.REGISTRY,
                        batchId: registryId, // Group by registry
                        orderItems: {
                            create: orderItemsData.map(item => ({
                                ...item,
                                branchId: branch.id
                            }))
                        }
                    }
                });

                result.processedOrders++;

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error";
                console.error(`Error processing col ${col}:`, err);
                result.errors.push({ column: col, branchCode, error: errorMessage });
            }
        }

        // Add detected products metadata to result
        result.detectedProducts = detectedProducts.map(p => ({
            productName: p.productName,
            rowNumber: p.rowNumber,
            identifier: p.productIdentifier
        }));

        return result;
    }
}
