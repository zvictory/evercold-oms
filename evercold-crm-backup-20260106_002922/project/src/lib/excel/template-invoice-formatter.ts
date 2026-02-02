import ExcelJS from 'exceljs'
import path from 'path'
import { InvoiceData, InvoiceItem } from './invoice-types'
import { formatInvoiceDate } from './invoice-utils'

/**
 * Template-based invoice formatter that loads a pre-designed template
 * and populates it with order data, including branch information.
 */
export class TemplateInvoiceFormatter {
  private workbook: ExcelJS.Workbook
  private templatePath: string

  constructor(existingWorkbook?: ExcelJS.Workbook) {
    this.workbook = existingWorkbook || new ExcelJS.Workbook()
    this.templatePath = path.join(process.cwd(), 'templates', 'schet-faktura-template.xlsx')
  }

  /**
   * Load template file from disk
   */
  private async loadTemplate(): Promise<ExcelJS.Workbook> {
    const templateWorkbook = new ExcelJS.Workbook()
    await templateWorkbook.xlsx.readFile(this.templatePath)
    return templateWorkbook
  }

  /**
   * Update the branch header at Row 5 with branch information
   */
  private updateBranchHeader(
    worksheet: ExcelJS.Worksheet,
    branchCode: string,
    branchName: string
  ) {
    // Insert branch header at Row 5 (after contract info)
    const branchHeader = `Филиал: ${branchCode} - ${branchName}`

    // Row 5 is empty in template, we need to merge it first
    try {
      worksheet.mergeCells('A5:K5')
    } catch (e) {
      // Already merged, just update value
    }

    const cell = worksheet.getCell('A5')
    cell.value = branchHeader
    cell.font = { bold: true, size: 7 }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
  }

  /**
   * Update invoice header information (number, date, contract)
   */
  private updateInvoiceHeader(
    worksheet: ExcelJS.Worksheet,
    data: InvoiceData
  ) {
    // Row 3: Invoice number and date
    const invoiceNumberText = `№ ${data.invoiceNumber} от ${formatInvoiceDate(data.invoiceDate)}`
    worksheet.getCell('A3').value = invoiceNumberText

    // Row 4: Contract info
    worksheet.getCell('A4').value = data.contractInfo
  }

  /**
   * Update supplier and buyer information
   */
  private updateCompanyInfo(
    worksheet: ExcelJS.Worksheet,
    data: InvoiceData
  ) {
    // Supplier (columns C-E)
    worksheet.getCell('C6').value = data.supplier.name
    worksheet.getCell('C7').value = data.supplier.address
    worksheet.getCell('C8').value = data.supplier.inn
    worksheet.getCell('C9').value = data.supplier.vatCode
    worksheet.getCell('C10').value = data.supplier.bankAccount
    worksheet.getCell('C11').value = data.supplier.mfo
    worksheet.getCell('C12').value = data.supplier.tg

    // Buyer (columns I-K)
    worksheet.getCell('I6').value = data.buyer.name
    worksheet.getCell('I7').value = data.buyer.address
    worksheet.getCell('I8').value = data.buyer.inn
    worksheet.getCell('I9').value = data.buyer.vatCode
    worksheet.getCell('I10').value = data.buyer.bankAccount
    worksheet.getCell('I11').value = data.buyer.mfo
    worksheet.getCell('I12').value = data.buyer.tg
  }

  /**
   * Clear existing product rows from template and insert new data
   */
  private updateProductRows(
    worksheet: ExcelJS.Worksheet,
    items: InvoiceItem[]
  ) {
    const dataStartRow = 17 // First data row in template

    // Remove template sample rows (rows 17-18 in template)
    worksheet.spliceRows(dataStartRow, 2)

    // Insert product rows
    items.forEach((item, idx) => {
      const rowNum = dataStartRow + idx
      const row = worksheet.getRow(rowNum)

      // Set row values
      row.getCell(1).value = idx + 1 // Row number
      row.getCell(2).value = item.productName
      row.getCell(3).value = item.catalogCode
      row.getCell(4).value = item.barcode
      row.getCell(5).value = item.unit
      row.getCell(6).value = item.quantity
      row.getCell(7).value = item.unitPrice

      // Formulas for calculated fields
      row.getCell(8).value = { formula: `F${rowNum}*G${rowNum}` } // Subtotal
      row.getCell(9).value = item.vatRate !== undefined ? item.vatRate : 0.15 // VAT rate
      row.getCell(10).value = { formula: `H${rowNum}/100*15` } // VAT amount (always 15% in formula)
      row.getCell(11).value = { formula: `H${rowNum}+J${rowNum}` } // Total with VAT

      // Apply formatting
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { size: 7 }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }

        // Alignment
        if (colNumber === 1 || colNumber === 5 || colNumber === 6 || colNumber === 9) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        } else if (colNumber === 7 || colNumber === 8 || colNumber === 10 || colNumber === 11) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' }
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' }
        }

        // Number formats
        if (colNumber === 7 || colNumber === 8 || colNumber === 10 || colNumber === 11) {
          cell.numFmt = '#,##0.00'
        }
      })

      row.height = 15 // Match template row height
      row.commit()
    })
  }

  /**
   * Update totals row
   */
  private updateTotalsRow(
    worksheet: ExcelJS.Worksheet,
    itemCount: number
  ) {
    const dataStartRow = 17
    const totalsRow = dataStartRow + itemCount

    // Update "Итого" label (cells already merged in template at row 19)
    const labelCell = worksheet.getCell(`A${totalsRow}`)
    labelCell.value = 'Итого'
    labelCell.font = { size: 7, bold: true }
    labelCell.alignment = { horizontal: 'left', vertical: 'middle' }
    labelCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }

    // Subtotal formula (column H)
    const subtotalCell = worksheet.getCell(`H${totalsRow}`)
    subtotalCell.value = { formula: `SUM(H${dataStartRow}:H${totalsRow - 1})` }
    subtotalCell.numFmt = '#,##0.00'
    subtotalCell.font = { size: 7, bold: true }
    subtotalCell.alignment = { horizontal: 'right', vertical: 'middle' }
    subtotalCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }

    // Empty cell I (VAT rate column - no total)
    const emptyCell = worksheet.getCell(`I${totalsRow}`)
    emptyCell.value = ''
    emptyCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }

    // VAT amount formula (column J)
    const vatCell = worksheet.getCell(`J${totalsRow}`)
    vatCell.value = { formula: `SUM(J${dataStartRow}:J${totalsRow - 1})` }
    vatCell.numFmt = '#,##0.00'
    vatCell.font = { size: 7, bold: true }
    vatCell.alignment = { horizontal: 'right', vertical: 'middle' }
    vatCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }

    // Total with VAT in column K (should be on row 19 in template)
    const totalWithVatCell = worksheet.getCell(`K${totalsRow}`)
    totalWithVatCell.value = { formula: `SUM(K${dataStartRow}:K${totalsRow - 1})` }
    totalWithVatCell.numFmt = '#,##0.00'
    totalWithVatCell.font = { size: 7, bold: true }
    totalWithVatCell.alignment = { horizontal: 'right', vertical: 'middle' }
    totalWithVatCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
  }

  /**
   * Update signature section at the bottom
   */
  private updateSignatures(
    worksheet: ExcelJS.Worksheet,
    itemCount: number
  ) {
    const dataStartRow = 17
    const totalsRow = dataStartRow + itemCount

    // Signature rows from template (row 22, 24 in template)
    const sig1Row = totalsRow + 3 // Руководитель (skip 2 empty rows after totals)
    const sig2Row = totalsRow + 5 // Главный бухгалтер

    // Руководитель - cells already merged in template
    const directorCell = worksheet.getCell(`A${sig1Row}`)
    directorCell.value = 'Руководитель'
    directorCell.font = { size: 7 }
    directorCell.alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.getCell(`D${sig1Row}`).value = 'NASRITDINOV Z'
    worksheet.getCell(`D${sig1Row}`).font = { size: 7 }
    worksheet.getCell(`D${sig1Row}`).alignment = { horizontal: 'center', vertical: 'middle' }

    // Главный бухгалтер - cells already merged in template
    const accountantCell = worksheet.getCell(`A${sig2Row}`)
    accountantCell.value = 'Главный бухгалтер:'
    accountantCell.font = { size: 7 }
    accountantCell.alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.getCell(`D${sig2Row}`).value = 'НЕ ПPЕДУСМОТPЕН'
    worksheet.getCell(`D${sig2Row}`).font = { size: 7 }
    worksheet.getCell(`D${sig2Row}`).alignment = { horizontal: 'center', vertical: 'middle' }

    // Buyer signature - cells already merged in template
    const buyerSigCell = worksheet.getCell(`F${sig2Row}`)
    buyerSigCell.value = 'Получил: (подпись покупателя или уполномоченного представителя)'
    buyerSigCell.font = { size: 7 }
    buyerSigCell.alignment = { horizontal: 'center', vertical: 'middle' }
  }

  /**
   * Generate invoice from template for a single order
   */
  async generate(data: InvoiceData, branchCode: string, branchName: string): Promise<Buffer> {
    // Load template
    const templateWorkbook = await this.loadTemplate()
    const templateSheet = templateWorkbook.worksheets[0]

    // Copy template sheet to our workbook
    const sheetName = `Счет-фактура ${data.invoiceNumber}`
    const worksheet = this.workbook.addWorksheet(sheetName)

    // Copy all rows and columns from template
    templateSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const newRow = worksheet.getRow(rowNumber)
      newRow.height = row.height

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const newCell = newRow.getCell(colNumber)

        // Copy value
        newCell.value = cell.value
        // Copy style
        newCell.font = cell.font
        newCell.alignment = cell.alignment
        newCell.border = cell.border
        newCell.fill = cell.fill
        newCell.numFmt = cell.numFmt
      })

      newRow.commit()
    })

    // Copy column widths
    templateSheet.columns.forEach((col, idx) => {
      if (col.width) {
        worksheet.getColumn(idx + 1).width = col.width
      }
    })

    // Copy merged cells
    // @ts-ignore - _merges is not in types but exists
    if (templateSheet._merges) {
      // @ts-ignore
      Object.keys(templateSheet._merges).forEach(merge => {
        worksheet.mergeCells(merge)
      })
    }

    // Now update with actual data
    this.updateInvoiceHeader(worksheet, data)
    this.updateBranchHeader(worksheet, branchCode, branchName)
    this.updateCompanyInfo(worksheet, data)
    this.updateProductRows(worksheet, data.items)
    this.updateTotalsRow(worksheet, data.items.length)
    this.updateSignatures(worksheet, data.items.length)

    // Return buffer
    return (await this.workbook.xlsx.writeBuffer()) as Buffer
  }

  /**
   * Generate multiple invoices in a single workbook
   */
  async generateBulk(
    invoices: Array<{ data: InvoiceData; branchCode: string; branchName: string }>
  ): Promise<Buffer> {
    for (const invoice of invoices) {
      await this.generate(invoice.data, invoice.branchCode, invoice.branchName)
    }

    return (await this.workbook.xlsx.writeBuffer()) as Buffer
  }
}
