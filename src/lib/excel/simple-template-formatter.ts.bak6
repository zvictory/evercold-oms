import ExcelJS from 'exceljs'
import path from 'path'
import { InvoiceData, InvoiceItem } from './invoice-types'
import { formatInvoiceDate } from './invoice-utils'

/**
 * Simple Template Formatter - Value-Only Approach
 * 
 * This formatter treats the Excel template as 100% read-only.
 * It ONLY updates cell values, never manipulates structure.
 * 
 * Key Features:
 * - No row insertion/deletion (prevents XML corruption)
 * - Fixed cell addresses (no dynamic calculations)
 * - Supports up to 10 items per invoice
 * - Perfect template fidelity (all formatting preserved)
 */

const MAX_ITEMS = 10

// Fixed cell addresses - these map to the template structure
const CELL_MAP = {
    // Header section
    invoiceNumber: 'K3',
    invoiceDate: 'K4',
    contractInfo: 'B5',

    // Supplier section (rows 6-8)
    supplierName: 'B6',
    supplierINN: 'E6',
    supplierVATCode: 'H6',
    supplierAddress: 'B7',
    supplierBankAccount: 'E7',
    supplierMFO: 'H7',
    supplierTG: 'K7',

    // Buyer section (rows 9-11)
    buyerName: 'B9',
    buyerINN: 'E9',
    buyerVATCode: 'H9',
    buyerAddress: 'B10',
    buyerBankAccount: 'E10',
    buyerMFO: 'H10',
    buyerTG: 'K10',

    // Item rows: 12-21 (10 items max)
    itemsStartRow: 12,
    itemsEndRow: 21,

    // Item columns
    itemNumber: 'A',      // Column A: №
    itemName: 'B',        // Columns B-F: Product name (merged)
    itemCatalogCode: 'B', // Row below name
    itemBarcode: 'G',     // Column G: Barcode
    itemUnit: 'H',        // Column H: Unit
    itemQuantity: 'I',    // Column I: Quantity
    itemPrice: 'J',       // Column J: Unit price
    itemTotal: 'K',       // Column K: Total (formula)

    // Footer section (after items)
    totalWithoutVAT: 'K22',
    vatAmount: 'K23',
    totalWithVAT: 'K24',
    totalInWords: 'B25',
}

export class SimpleTemplateFormatter {
    private templatePath: string

    constructor(templatePath?: string) {
        // Default to the template in the project root
        this.templatePath = templatePath || path.join(process.cwd(), 'счет фактура2.xlsx')
    }

    /**
     * Generate a single invoice
     */
    async generate(data: InvoiceData, branchCode?: string, branchName?: string): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.readFile(this.templatePath)

        const worksheet = workbook.getWorksheet(1)
        if (!worksheet) {
            throw new Error('Template has no worksheets')
        }

        // Fill the template with data
        this.fillTemplate(worksheet, data, branchCode, branchName)

        // Generate buffer
        return (await workbook.xlsx.writeBuffer()) as any
    }

    /**
     * Generate multiple invoices in a single workbook
     */
    async generateBulk(invoices: Array<{ data: InvoiceData; branchCode?: string; branchName?: string }>): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook()

        for (const invoice of invoices) {
            // Load template for each invoice
            const templateWorkbook = new ExcelJS.Workbook()
            await templateWorkbook.xlsx.readFile(this.templatePath)

            const templateSheet = templateWorkbook.getWorksheet(1)
            if (!templateSheet) continue

            // Fill the template
            this.fillTemplate(templateSheet, invoice.data, invoice.branchCode, invoice.branchName)

            // Copy the filled sheet to the main workbook
            const sheetName = `Invoice ${invoice.data.invoiceNumber}`
            const newSheet = workbook.addWorksheet(sheetName)

            // Copy all rows and columns from template to new sheet
            templateSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                const newRow = newSheet.getRow(rowNumber)
                newRow.height = row.height

                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const newCell = newRow.getCell(colNumber)

                    // Copy value
                    newCell.value = cell.value

                    // Copy style
                    newCell.style = { ...cell.style }
                })

                newRow.commit()
            })

            // Copy column widths
            templateSheet.columns.forEach((col, index) => {
                if (col.width) {
                    newSheet.getColumn(index + 1).width = col.width
                }
            })

            // Copy merged cells
            if (templateSheet.model.merges) {
                templateSheet.model.merges.forEach((merge: string) => {
                    newSheet.mergeCells(merge)
                })
            }
        }

        return (await workbook.xlsx.writeBuffer()) as any
    }

    /**
     * Fill template with invoice data (VALUE-ONLY, no structure changes)
     */
    private fillTemplate(
        worksheet: ExcelJS.Worksheet,
        data: InvoiceData,
        branchCode?: string,
        branchName?: string
    ): void {
        // === HEADER SECTION ===
        worksheet.getCell(CELL_MAP.invoiceNumber).value = data.invoiceNumber
        worksheet.getCell(CELL_MAP.invoiceDate).value = formatInvoiceDate(data.invoiceDate)
        worksheet.getCell(CELL_MAP.contractInfo).value = data.contractInfo

        // === SUPPLIER SECTION ===
        worksheet.getCell(CELL_MAP.supplierName).value = data.supplier.name
        worksheet.getCell(CELL_MAP.supplierINN).value = data.supplier.inn
        worksheet.getCell(CELL_MAP.supplierVATCode).value = data.supplier.vatCode
        worksheet.getCell(CELL_MAP.supplierAddress).value = data.supplier.address
        worksheet.getCell(CELL_MAP.supplierBankAccount).value = data.supplier.bankAccount
        worksheet.getCell(CELL_MAP.supplierMFO).value = data.supplier.mfo
        worksheet.getCell(CELL_MAP.supplierTG).value = data.supplier.tg

        // === BUYER SECTION ===
        worksheet.getCell(CELL_MAP.buyerName).value = data.buyer.name
        worksheet.getCell(CELL_MAP.buyerINN).value = data.buyer.inn
        worksheet.getCell(CELL_MAP.buyerVATCode).value = data.buyer.vatCode
        worksheet.getCell(CELL_MAP.buyerAddress).value = data.buyer.address
        worksheet.getCell(CELL_MAP.buyerBankAccount).value = data.buyer.bankAccount
        worksheet.getCell(CELL_MAP.buyerMFO).value = data.buyer.mfo
        worksheet.getCell(CELL_MAP.buyerTG).value = data.buyer.tg

        // === ITEMS SECTION ===
        const itemsToProcess = data.items.slice(0, MAX_ITEMS)

        itemsToProcess.forEach((item, index) => {
            const rowNum = CELL_MAP.itemsStartRow + index

            // Item number
            worksheet.getCell(`${CELL_MAP.itemNumber}${rowNum}`).value = index + 1

            // Product name (merged cells B-F)
            worksheet.getCell(`${CELL_MAP.itemName}${rowNum}`).value = item.productName

            // Catalog code and barcode
            worksheet.getCell(`${CELL_MAP.itemCatalogCode}${rowNum + 1}`).value = item.catalogCode
            worksheet.getCell(`${CELL_MAP.itemBarcode}${rowNum}`).value = item.barcode

            // Unit, quantity, price
            worksheet.getCell(`${CELL_MAP.itemUnit}${rowNum}`).value = item.unit
            worksheet.getCell(`${CELL_MAP.itemQuantity}${rowNum}`).value = item.quantity
            worksheet.getCell(`${CELL_MAP.itemPrice}${rowNum}`).value = item.unitPrice

            // Total is calculated by formula in template (e.g., =I12*J12)
            // We don't need to set it manually
        })

        // Clear unused item rows (if fewer than 10 items)
        for (let i = itemsToProcess.length; i < MAX_ITEMS; i++) {
            const rowNum = CELL_MAP.itemsStartRow + i

            worksheet.getCell(`${CELL_MAP.itemNumber}${rowNum}`).value = null
            worksheet.getCell(`${CELL_MAP.itemName}${rowNum}`).value = null
            worksheet.getCell(`${CELL_MAP.itemBarcode}${rowNum}`).value = null
            worksheet.getCell(`${CELL_MAP.itemUnit}${rowNum}`).value = null
            worksheet.getCell(`${CELL_MAP.itemQuantity}${rowNum}`).value = null
            worksheet.getCell(`${CELL_MAP.itemPrice}${rowNum}`).value = null
        }

        // === FOOTER SECTION ===
        // Calculate totals
        let totalWithoutVAT = 0
        let totalVAT = 0

        data.items.forEach(item => {
            const subtotal = item.quantity * item.unitPrice
            const vatAmount = subtotal * (item.vatRate || 0)

            totalWithoutVAT += subtotal
            totalVAT += vatAmount
        })

        const totalWithVAT = totalWithoutVAT + totalVAT

        worksheet.getCell(CELL_MAP.totalWithoutVAT).value = totalWithoutVAT
        worksheet.getCell(CELL_MAP.vatAmount).value = totalVAT
        worksheet.getCell(CELL_MAP.totalWithVAT).value = totalWithVAT

        // Total in words (if available in data)
        // You may need to implement a number-to-words converter
        worksheet.getCell(CELL_MAP.totalInWords).value = `Всего: ${totalWithVAT.toFixed(2)} сум`
    }
}
