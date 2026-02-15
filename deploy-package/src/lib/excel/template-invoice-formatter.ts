import ExcelJS from 'exceljs'
import path from 'path'
import { InvoiceData } from './invoice-types'
import { formatInvoiceDate } from './invoice-utils'

/**
 * Template-based invoice formatter using READ-ONLY strategy.
 * Loads template, updates ONLY cell values, preserves all structure/formulas/styles.
 * Template has 2 pre-built item rows (17-18), so max 2 items per invoice sheet.
 */
export class TemplateInvoiceFormatter {
  private workbook: ExcelJS.Workbook
  private templatePath: string

  constructor(existingWorkbook?: ExcelJS.Workbook) {
    this.workbook = existingWorkbook || new ExcelJS.Workbook()
    this.templatePath = path.join(process.cwd(), 'templates', 'schet-faktura-template.xlsx')
  }

  async generate(data: InvoiceData, branchCode: string, branchName: string): Promise<Buffer> {
    // Load fresh template for each invoice
    const templateWorkbook = new ExcelJS.Workbook()
    await templateWorkbook.xlsx.readFile(this.templatePath)
    const templateSheet = templateWorkbook.worksheets[0]

    // Clone template sheet name
    const sheetName = `Счет-фактура ${data.invoiceNumber}`
    templateSheet.name = sheetName

    // === UPDATE VALUES ONLY (NO STRUCTURE CHANGES) ===

    // Header (Row 3-5)
    templateSheet.getCell('A3').value = `№ ${data.invoiceNumber} от ${formatInvoiceDate(data.invoiceDate)}`
    templateSheet.getCell('A4').value = data.contractInfo
    templateSheet.getCell('A5').value = `Филиал: ${branchCode} - ${branchName}`

    // Supplier info (Rows 6-12, Column C)
    templateSheet.getCell('C6').value = data.supplier.name
    templateSheet.getCell('C7').value = data.supplier.address
    templateSheet.getCell('C8').value = data.supplier.inn
    templateSheet.getCell('C9').value = data.supplier.vatCode
    templateSheet.getCell('C10').value = data.supplier.bankAccount
    templateSheet.getCell('C11').value = data.supplier.mfo
    templateSheet.getCell('C12').value = data.supplier.tg

    // Buyer info (Rows 6-12, Column I)
    templateSheet.getCell('I6').value = data.buyer.name
    templateSheet.getCell('I7').value = data.buyer.address
    templateSheet.getCell('I8').value = data.buyer.inn
    templateSheet.getCell('I9').value = data.buyer.vatCode
    templateSheet.getCell('I10').value = data.buyer.bankAccount
    templateSheet.getCell('I11').value = data.buyer.mfo
    templateSheet.getCell('I12').value = data.buyer.tg

    // Items (Rows 17-18, max 2 items)
    // Template already has formulas in columns H, J, K - we preserve them
    const itemRows = [17, 18]
    for (let i = 0; i < Math.min(data.items.length, 2); i++) {
      const item = data.items[i]
      const rowNum = itemRows[i]

      templateSheet.getCell(`B${rowNum}`).value = i + 1
      templateSheet.getCell(`C${rowNum}`).value = item.productName
      templateSheet.getCell(`D${rowNum}`).value = item.catalogCode
      templateSheet.getCell(`E${rowNum}`).value = item.barcode
      templateSheet.getCell(`F${rowNum}`).value = item.unit || 'штук'
      templateSheet.getCell(`G${rowNum}`).value = item.quantity
      templateSheet.getCell(`H${rowNum}`).value = item.unitPrice

      // Columns I, J, K have formulas - DO NOT TOUCH
    }

    // If only 1 item, clear row 18
    if (data.items.length === 1) {
      templateSheet.getCell('B18').value = ''
      templateSheet.getCell('C18').value = ''
      templateSheet.getCell('D18').value = ''
      templateSheet.getCell('E18').value = ''
      templateSheet.getCell('F18').value = ''
      templateSheet.getCell('G18').value = 0
      templateSheet.getCell('H18').value = 0
    }

    // Totals row (19) already has formulas - DO NOT TOUCH

    // Add to workbook
    const clonedSheet = this.workbook.addWorksheet(sheetName)

    // Deep copy all cells
    templateSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const targetRow = clonedSheet.getRow(rowNumber)
      targetRow.height = row.height

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const targetCell = targetRow.getCell(colNumber)

        // Copy everything
        targetCell.value = cell.value
        targetCell.style = cell.style
      })

      targetRow.commit()
    })

    // Copy column widths
    templateSheet.columns.forEach((col, idx) => {
      if (col.width) {
        clonedSheet.getColumn(idx + 1).width = col.width
      }
    })

    // Copy merges
    // @ts-ignore
    if (templateSheet._merges) {
      // @ts-ignore
      Object.keys(templateSheet._merges).forEach(merge => {
        try {
          clonedSheet.mergeCells(merge)
        } catch (e) { /* ignore */ }
      })
    }

    return (await this.workbook.xlsx.writeBuffer()) as any
  }

  async generateBulk(
    invoices: Array<{ data: InvoiceData; branchCode: string; branchName: string }>
  ): Promise<Buffer> {
    for (const invoice of invoices) {
      await this.generate(invoice.data, invoice.branchCode, invoice.branchName)
    }
    return (await this.workbook.xlsx.writeBuffer()) as any
  }
}
