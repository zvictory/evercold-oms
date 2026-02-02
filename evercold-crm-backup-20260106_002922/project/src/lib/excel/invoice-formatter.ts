import ExcelJS from 'exceljs'
import { InvoiceData, InvoiceItem } from './invoice-types'
import { INVOICE_CONSTANTS, TABLE_HEADERS } from './invoice-template'
import {
  createBorderedCell,
  mergeCellsAndSet,
  applyBordersToRange,
  formatInvoiceDate,
} from './invoice-utils'

export class InvoiceFormatter {
  private workbook: ExcelJS.Workbook
  private sheet: ExcelJS.Worksheet

  constructor(existingWorkbook?: ExcelJS.Workbook, sheetName?: string) {
    if (existingWorkbook) {
      this.workbook = existingWorkbook
      this.sheet = this.workbook.addWorksheet(sheetName || 'Worksheet')
    } else {
      this.workbook = new ExcelJS.Workbook()
      this.sheet = this.workbook.addWorksheet('Worksheet')
    }
    this.setupPage()
    this.setupColumns()
  }

  private setupPage() {
    // A4 Portrait
    this.sheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: false,
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
    }
  }

  private setupColumns() {
    INVOICE_CONSTANTS.COLUMN_WIDTHS.forEach((width, idx) => {
      this.sheet.getColumn(idx + 1).width = width
    })
  }

  // Create one invoice copy
  private createInvoiceCopy(data: InvoiceData, startRow: number) {
    // === HEADER ===
    mergeCellsAndSet(
      this.sheet,
      `A${startRow}:K${startRow}`,
      'Счет-фактура',
      { bold: true, fontSize: 7, alignment: 'center' }
    )

    mergeCellsAndSet(
      this.sheet,
      `A${startRow + 1}:K${startRow + 1}`,
      `№ ${data.invoiceNumber} от ${formatInvoiceDate(data.invoiceDate)}`,
      { bold: true, fontSize: 7, alignment: 'center' }
    )

    mergeCellsAndSet(
      this.sheet,
      `A${startRow + 2}:K${startRow + 2}`,
      `к договору ${data.contractInfo}`,
      { bold: true, fontSize: 7, alignment: 'center' }
    )

    // === Empty row ===
    mergeCellsAndSet(this.sheet, `A${startRow + 3}:K${startRow + 3}`, '', { fontSize: 7 })

    // === SUPPLIER & BUYER INFO ===
    const infoStartRow = startRow + 4

    // Row 1: Поставщик / Покупатель labels
    mergeCellsAndSet(this.sheet, `A${infoStartRow}:B${infoStartRow}`, 'Поставщик:', { fontSize: 7, bold: false })
    mergeCellsAndSet(this.sheet, `C${infoStartRow}:E${infoStartRow}`, data.supplier.name, { fontSize: 7, alignment: 'left' })
    mergeCellsAndSet(this.sheet, `F${infoStartRow}:H${infoStartRow}`, 'Покупатель:', { fontSize: 7, bold: false })
    mergeCellsAndSet(this.sheet, `I${infoStartRow}:K${infoStartRow}`, data.buyer.name, { fontSize: 7, alignment: 'left' })

    // Row 2: Адрес
    mergeCellsAndSet(this.sheet, `A${infoStartRow + 1}:B${infoStartRow + 1}`, 'Адрес:', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `C${infoStartRow + 1}:E${infoStartRow + 1}`, data.supplier.address, { fontSize: 7, alignment: 'left', wrapText: true })
    mergeCellsAndSet(this.sheet, `F${infoStartRow + 1}:H${infoStartRow + 1}`, 'Адрес:', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `I${infoStartRow + 1}:K${infoStartRow + 1}`, data.buyer.address, { fontSize: 7, alignment: 'left', wrapText: true })

    // Row 3: ИНН
    mergeCellsAndSet(this.sheet, `A${infoStartRow + 2}:B${infoStartRow + 2}`, 'Идентификационный номер поставщика (ИНН):', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `C${infoStartRow + 2}:E${infoStartRow + 2}`, data.supplier.inn, { fontSize: 7, alignment: 'left' })
    mergeCellsAndSet(this.sheet, `F${infoStartRow + 2}:H${infoStartRow + 2}`, 'Идентификационный номер покупателя (ИНН):', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `I${infoStartRow + 2}:K${infoStartRow + 2}`, data.buyer.inn, { fontSize: 7, alignment: 'left' })

    // Row 4: VAT Code
    mergeCellsAndSet(this.sheet, `A${infoStartRow + 3}:B${infoStartRow + 3}`, 'Регистрационный код плательщика НДС:', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `C${infoStartRow + 3}:E${infoStartRow + 3}`, data.supplier.vatCode, { fontSize: 7, alignment: 'left' })
    mergeCellsAndSet(this.sheet, `F${infoStartRow + 3}:H${infoStartRow + 3}`, 'Регистрационный код плательщика НДС:', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `I${infoStartRow + 3}:K${infoStartRow + 3}`, data.buyer.vatCode, { fontSize: 7, alignment: 'left' })

    // Row 5: Банк счет
    mergeCellsAndSet(this.sheet, `A${infoStartRow + 4}:B${infoStartRow + 4}`, 'Банковский счет (р/с):', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `C${infoStartRow + 4}:E${infoStartRow + 4}`, data.supplier.bankAccount, { fontSize: 7, alignment: 'left' })
    mergeCellsAndSet(this.sheet, `F${infoStartRow + 4}:H${infoStartRow + 4}`, 'Банковский счет (р/с):', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `I${infoStartRow + 4}:K${infoStartRow + 4}`, data.buyer.bankAccount, { fontSize: 7, alignment: 'left' })

    // Row 6: МФО
    mergeCellsAndSet(this.sheet, `A${infoStartRow + 5}:B${infoStartRow + 5}`, 'Код банка (МФО):', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `C${infoStartRow + 5}:E${infoStartRow + 5}`, data.supplier.mfo, { fontSize: 7, alignment: 'left' })
    mergeCellsAndSet(this.sheet, `F${infoStartRow + 5}:H${infoStartRow + 5}`, 'Код банка (МФО):', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `I${infoStartRow + 5}:K${infoStartRow + 5}`, data.buyer.mfo, { fontSize: 7, alignment: 'left' })

    // Row 7: TG
    mergeCellsAndSet(this.sheet, `A${infoStartRow + 6}:B${infoStartRow + 6}`, 'Код территории (ТГ):', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `C${infoStartRow + 6}:E${infoStartRow + 6}`, data.supplier.tg, { fontSize: 7, alignment: 'left' })
    mergeCellsAndSet(this.sheet, `F${infoStartRow + 6}:H${infoStartRow + 6}`, 'Код территории (ТГ):', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `I${infoStartRow + 6}:K${infoStartRow + 6}`, data.buyer.tg, { fontSize: 7, alignment: 'left' })

    // === Empty row before table ===
    mergeCellsAndSet(this.sheet, `A${infoStartRow + 7}:K${infoStartRow + 7}`, '', { fontSize: 7 })

    // === TABLE HEADER ===
    const tableHeaderRow = infoStartRow + 8

    // Set header row height
    this.sheet.getRow(tableHeaderRow).height = INVOICE_CONSTANTS.ROW_HEIGHTS.TABLE_HEADER

    // Row 1 - Main headers with merges
    mergeCellsAndSet(this.sheet, `A${tableHeaderRow}:A${tableHeaderRow + 1}`, '№', { bold: true, fontSize: 7, alignment: 'center', wrapText: true })
    mergeCellsAndSet(this.sheet, `B${tableHeaderRow}:B${tableHeaderRow + 1}`, 'Наименование товаров (услуг)', { bold: true, fontSize: 7, alignment: 'center', wrapText: true })
    mergeCellsAndSet(this.sheet, `C${tableHeaderRow}:C${tableHeaderRow + 1}`, 'Идентификационный код и название по Единому электронному национальному классификатору продукции и услуг', { bold: true, fontSize: 7, alignment: 'center', wrapText: true })
    mergeCellsAndSet(this.sheet, `D${tableHeaderRow}:D${tableHeaderRow + 1}`, 'Штрих-код товара/услуги', { bold: true, fontSize: 7, alignment: 'center', wrapText: true })
    // Column E is the separator (hidden/narrow)
    createBorderedCell(this.sheet, `E${tableHeaderRow}`, '', { fontSize: 7 })
    createBorderedCell(this.sheet, `E${tableHeaderRow + 1}`, '', { fontSize: 7 })

    mergeCellsAndSet(this.sheet, `F${tableHeaderRow}:F${tableHeaderRow + 1}`, 'Единица измерения', { bold: true, fontSize: 7, alignment: 'center', wrapText: true })
    mergeCellsAndSet(this.sheet, `G${tableHeaderRow}:G${tableHeaderRow + 1}`, 'Количество', { bold: true, fontSize: 7, alignment: 'center', wrapText: true })
    mergeCellsAndSet(this.sheet, `H${tableHeaderRow}:H${tableHeaderRow + 1}`, 'Цена', { bold: true, fontSize: 7, alignment: 'center', wrapText: true })
    mergeCellsAndSet(this.sheet, `I${tableHeaderRow}:I${tableHeaderRow + 1}`, 'Стоимость поставки', { bold: true, fontSize: 7, alignment: 'center', wrapText: true })

    // НДС header spans J and K in first row
    mergeCellsAndSet(this.sheet, `J${tableHeaderRow}:K${tableHeaderRow}`, 'НДС', { bold: true, fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `J${tableHeaderRow + 1}`, 'Ставка', { bold: true, fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `K${tableHeaderRow + 1}`, 'Сумма', { bold: true, fontSize: 7, alignment: 'center' })

    // Row 3 - Column numbers
    const numRow = tableHeaderRow + 2
    createBorderedCell(this.sheet, `A${numRow}`, '', { fontSize: 7 })
    createBorderedCell(this.sheet, `B${numRow}`, '1', { fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `C${numRow}`, '2', { fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `D${numRow}`, '3', { fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `E${numRow}`, '', { fontSize: 7 })
    createBorderedCell(this.sheet, `F${numRow}`, '4', { fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `G${numRow}`, '5', { fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `H${numRow}`, '6', { fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `I${numRow}`, '7', { fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `J${numRow}`, '8', { fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `K${numRow}`, '9', { fontSize: 7, alignment: 'center' })

    // === DATA ROWS ===
    const dataStartRow = numRow + 1

    data.items.forEach((item, idx) => {
      const rowNum = dataStartRow + idx

      // Set data row height
      this.sheet.getRow(rowNum).height = INVOICE_CONSTANTS.ROW_HEIGHTS.DATA_ROW

      createBorderedCell(this.sheet, `A${rowNum}`, idx + 1, { fontSize: 7, alignment: 'center' })
      createBorderedCell(this.sheet, `B${rowNum}`, item.productName, { fontSize: 7 })
      createBorderedCell(this.sheet, `C${rowNum}`, item.catalogCode, { fontSize: 7 })
      createBorderedCell(this.sheet, `D${rowNum}`, item.barcode, { fontSize: 7 })
      createBorderedCell(this.sheet, `E${rowNum}`, '', { fontSize: 7 })
      createBorderedCell(this.sheet, `F${rowNum}`, item.unit, { fontSize: 7, alignment: 'center' })
      createBorderedCell(this.sheet, `G${rowNum}`, item.quantity, { fontSize: 7, alignment: 'center' })
      createBorderedCell(this.sheet, `H${rowNum}`, item.unitPrice, { fontSize: 7, alignment: 'right' })

      // Formulas
      const cell_I = this.sheet.getCell(`I${rowNum}`)
      cell_I.value = { formula: `G${rowNum}*H${rowNum}` }
      cell_I.numFmt = '#,##0.00'
      cell_I.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
      cell_I.font = { size: 7 }
      cell_I.alignment = { horizontal: 'right' }

      const cell_J = this.sheet.getCell(`J${rowNum}`)
      cell_J.value = item.vatRate !== undefined ? item.vatRate * 100 : 15 // Show as percentage
      cell_J.numFmt = '0'
      cell_J.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
      cell_J.font = { size: 7 }
      cell_J.alignment = { horizontal: 'center' }

      const cell_K = this.sheet.getCell(`K${rowNum}`)
      cell_K.value = { formula: `I${rowNum}*J${rowNum}/100` }
      cell_K.numFmt = '#,##0.00'
      cell_K.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
      cell_K.font = { size: 7 }
      cell_K.alignment = { horizontal: 'right' }
    })

    // === TOTALS ROW ===
    const totalsRow = dataStartRow + data.items.length

    mergeCellsAndSet(this.sheet, `A${totalsRow}:H${totalsRow}`, 'Итого', { fontSize: 7, bold: true, alignment: 'left' })

    const totals_I = this.sheet.getCell(`I${totalsRow}`)
    totals_I.value = { formula: `SUM(I${dataStartRow}:I${totalsRow - 1})` }
    totals_I.numFmt = '#,##0.00'
    totals_I.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
    totals_I.font = { size: 7, bold: true }
    totals_I.alignment = { horizontal: 'right' }

    const totals_J = this.sheet.getCell(`J${totalsRow}`)
    totals_J.value = ''
    totals_J.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
    totals_J.font = { size: 7 }

    const totals_K = this.sheet.getCell(`K${totalsRow}`)
    totals_K.value = { formula: `SUM(K${dataStartRow}:K${totalsRow - 1})` }
    totals_K.numFmt = '#,##0.00'
    totals_K.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
    totals_K.font = { size: 7, bold: true }
    totals_K.alignment = { horizontal: 'right' }

    // === TOTAL WITH VAT ROW ===
    const totalWithVatRow = totalsRow + 1

    mergeCellsAndSet(this.sheet, `A${totalWithVatRow}:H${totalWithVatRow}`, 'Всего с учетом НДС', { fontSize: 7, bold: true, alignment: 'left' })

    createBorderedCell(this.sheet, `I${totalWithVatRow}`, '', { fontSize: 7 })
    createBorderedCell(this.sheet, `J${totalWithVatRow}`, '', { fontSize: 7 })

    const totalWithVat_K = this.sheet.getCell(`K${totalWithVatRow}`)
    totalWithVat_K.value = { formula: `I${totalsRow}+K${totalsRow}` }
    totalWithVat_K.numFmt = '#,##0.00'
    totalWithVat_K.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
    totalWithVat_K.font = { size: 7, bold: true }
    totalWithVat_K.alignment = { horizontal: 'right' }

    // === SIGNATURES ===
    // Structure matches template exactly:
    // totalsRow + 0: Итого
    // totalsRow + 1: Всего с учетом НДС
    // totalsRow + 2: Empty row
    // totalsRow + 3: Руководитель (9.75)
    // totalsRow + 4: Empty row
    // totalsRow + 5: Главный бухгалтер (24.75)
    // totalsRow + 6: Empty row
    // totalsRow + 7: М.П. (24.75)
    // totalsRow + 8: Empty row
    // totalsRow + 9: Товар отпустил (12.75)

    // Empty row after "Всего с учетом НДС"
    const emptyRow1 = totalWithVatRow + 1
    mergeCellsAndSet(this.sheet, `A${emptyRow1}:K${emptyRow1}`, '', { fontSize: 7 })

    // Row 1: Руководитель
    const sig1Row = totalWithVatRow + 2
    this.sheet.getRow(sig1Row).height = INVOICE_CONSTANTS.ROW_HEIGHTS.SIGNATURE_1
    mergeCellsAndSet(this.sheet, `A${sig1Row}:B${sig1Row}`, 'Руководитель', { fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `C${sig1Row}`, '', { fontSize: 7 })
    createBorderedCell(this.sheet, `D${sig1Row}`, 'NASRITDINOV Z', { fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `E${sig1Row}`, '', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `F${sig1Row}:K${sig1Row}`, '', { fontSize: 7 })

    // Empty row
    const emptyRow2 = sig1Row + 1
    mergeCellsAndSet(this.sheet, `A${emptyRow2}:K${emptyRow2}`, '', { fontSize: 7 })

    // Row 2: Главный бухгалтер
    const sig2Row = sig1Row + 2
    this.sheet.getRow(sig2Row).height = INVOICE_CONSTANTS.ROW_HEIGHTS.SIGNATURE_2
    mergeCellsAndSet(this.sheet, `A${sig2Row}:B${sig2Row}`, 'Главный бухгалтер:', { fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `C${sig2Row}`, '', { fontSize: 7 })
    createBorderedCell(this.sheet, `D${sig2Row}`, 'NASRITDINOV Z', { fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `E${sig2Row}`, '', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `F${sig2Row}:K${sig2Row}`, '(подпись покупателя с указанием даты получения)', { fontSize: 7, alignment: 'center' })

    // Empty row
    const emptyRow3 = sig2Row + 1
    mergeCellsAndSet(this.sheet, `A${emptyRow3}:K${emptyRow3}`, '', { fontSize: 7 })

    // Row 3: М.П.
    const sig3Row = sig2Row + 2
    this.sheet.getRow(sig3Row).height = INVOICE_CONSTANTS.ROW_HEIGHTS.SIGNATURE_2
    mergeCellsAndSet(this.sheet, `A${sig3Row}:E${sig3Row}`, 'М.П.: (при наличии печати)', { fontSize: 7, alignment: 'center' })
    mergeCellsAndSet(this.sheet, `F${sig3Row}:K${sig3Row}`, '', { fontSize: 7 })

    // Empty row
    const emptyRow4 = sig3Row + 1
    mergeCellsAndSet(this.sheet, `A${emptyRow4}:K${emptyRow4}`, '', { fontSize: 7 })

    // Row 4: Товар отпустил
    const sig4Row = sig3Row + 2
    this.sheet.getRow(sig4Row).height = INVOICE_CONSTANTS.ROW_HEIGHTS.SIGNATURE_3
    createBorderedCell(this.sheet, `A${sig4Row}`, '', { fontSize: 7 })
    createBorderedCell(this.sheet, `B${sig4Row}`, 'Товар отпустил', { fontSize: 7, alignment: 'center' })
    createBorderedCell(this.sheet, `C${sig4Row}`, '', { fontSize: 7 })
    createBorderedCell(this.sheet, `D${sig4Row}`, '', { fontSize: 7 })
    createBorderedCell(this.sheet, `E${sig4Row}`, '', { fontSize: 7 })
    createBorderedCell(this.sheet, `F${sig4Row}`, '', { fontSize: 7 })
    createBorderedCell(this.sheet, `G${sig4Row}`, '', { fontSize: 7 })
    mergeCellsAndSet(this.sheet, `H${sig4Row}:K${sig4Row}`, 'ФИО получателя', { fontSize: 7, alignment: 'center' })
  }

  // Main generation method
  async generate(data: InvoiceData): Promise<Buffer> {
    // First copy
    this.createInvoiceCopy(data, INVOICE_CONSTANTS.ROWS.TITLE)

    // Second copy (offset by 33 rows)
    this.createInvoiceCopy(
      data,
      INVOICE_CONSTANTS.ROWS.TITLE + INVOICE_CONSTANTS.SECOND_COPY_OFFSET
    )

    return (await this.workbook.xlsx.writeBuffer()) as Buffer
  }
}
