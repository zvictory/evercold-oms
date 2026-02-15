import ExcelJS from 'exceljs'
import { InvoiceData } from './invoice-types'
import { formatInvoiceDate } from './invoice-utils'

/**
 * Generate Schet-Faktura (Tax Invoice) in Excel format
 * Creates 2 copies per A4 page (landscape)
 */
export async function generateSchetFaktura(data: InvoiceData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Счет-фактура', {
        pageSetup: {
            paperSize: 9, // A4
            orientation: 'portrait',
            fitToPage: true,
            fitToHeight: 1,
            fitToWidth: 1,
            margins: {
                left: 0.2,
                right: 0.2,
                top: 0.2,
                bottom: 0.2,
                header: 0,
                footer: 0
            }
        }
    })

    // Set column widths (from template)
    worksheet.columns = [
        { width: 4.140625 },      // A
        { width: 12.140625 },     // B
        { width: 20.7109375 },    // C
        { width: 11.5703125 },    // D
        { width: 0.28515625 },    // E - separator
        { width: 6.28515625 },    // F
        { width: 7.140625 },      // G
        { width: 7.5703125 },     // H
        { width: 7.140625 },      // I
        { width: 11.42578125 },   // J
        { width: 10 }             // K
    ]

    let currentRow = 1

    // Generate first copy
    currentRow = createInvoiceCopy(worksheet, data, currentRow)

    // Add spacing between copies
    currentRow += 2

    // Generate second copy
    createInvoiceCopy(worksheet, data, currentRow)

    return (await workbook.xlsx.writeBuffer()) as any
}

function createInvoiceCopy(
    worksheet: ExcelJS.Worksheet,
    data: InvoiceData,
    startRow: number
): number {
    let row = startRow

    // === ROW 1: TITLE ===
    const titleRow = worksheet.getRow(row)
    worksheet.mergeCells(row, 1, row, 11)
    const titleCell = worksheet.getCell(row, 1)
    titleCell.value = 'Счет-фактура'
    titleCell.font = { name: 'Arial', size: 7, bold: true }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleRow.height = 10
    row++

    // === ROW 2: INVOICE NUMBER AND DATE ===
    const numRow = worksheet.getRow(row)
    worksheet.mergeCells(row, 1, row, 11)
    const numCell = worksheet.getCell(row, 1)
    numCell.value = `№ ${data.invoiceNumber} от ${formatInvoiceDate(data.invoiceDate)}`
    numCell.font = { name: 'Arial', size: 7, bold: true }
    numCell.alignment = { horizontal: 'center', vertical: 'middle' }
    numRow.height = 10
    row++

    // === ROW 3: CONTRACT INFO ===
    const contractRow = worksheet.getRow(row)
    worksheet.mergeCells(row, 1, row, 11)
    const contractCell = worksheet.getCell(row, 1)
    contractCell.value = data.contractInfo
    contractCell.font = { name: 'Arial', size: 7, bold: true }
    contractCell.alignment = { horizontal: 'center', vertical: 'middle' }
    contractRow.height = 10
    row++

    // === ROW 4: BRANCH NAME AND CODE ===
    const branchRow = worksheet.getRow(row)
    worksheet.mergeCells(row, 1, row, 11)
    const branchCell = worksheet.getCell(row, 1)
    const branchCode = data.branchCode || 'K000'
    const branchName = data.branchName || 'EVERCOLD FOOD MCH'
    branchCell.value = `${branchName} ${branchCode}`
    branchCell.font = { name: 'Arial', size: 7, bold: true }
    branchCell.alignment = { horizontal: 'center', vertical: 'middle' }
    branchRow.height = 10
    row++

    // === PARTIES TABLE ===
    const partiesStartRow = row

    // Headers - Row 5
    worksheet.mergeCells(row, 1, row, 4)
    const supplierHeader = worksheet.getCell(row, 1)
    supplierHeader.value = 'Поставщик:'
    supplierHeader.font = { name: 'Arial', size: 7, bold: true }
    supplierHeader.alignment = { horizontal: 'left', vertical: 'middle' }
    supplierHeader.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
    }

    worksheet.mergeCells(row, 6, row, 11)
    const buyerHeader = worksheet.getCell(row, 6)
    buyerHeader.value = 'Покупатель:'
    buyerHeader.font = { name: 'Arial', size: 7, bold: true }
    buyerHeader.alignment = { horizontal: 'left', vertical: 'middle' }
    buyerHeader.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
    }
    worksheet.getRow(row).height = 10
    row++

    // Party details - Rows 6-12
    const partyFields = [
        { label: 'Наименование:', supplierValue: data.supplier.name, buyerLabel: 'Покупатель:', buyerValue: data.buyer.name },
        { label: 'Адрес:', supplierValue: data.supplier.address, buyerLabel: 'Адрес:', buyerValue: data.buyer.address },
        { label: 'Идентификационный номер поставщика (ИНН):', supplierValue: data.supplier.inn, buyerLabel: 'Идентификационный номер покупателя (ИНН):', buyerValue: data.buyer.inn },
        { label: 'Регистрационный код плательщика НДС:', supplierValue: data.supplier.vatCode, buyerLabel: 'Регистрационный код плательщика НДС:', buyerValue: data.buyer.vatCode },
        { label: 'Р/С:', supplierValue: data.supplier.bankAccount, buyerLabel: 'Р/С:', buyerValue: data.buyer.bankAccount },
        { label: 'МФО:', supplierValue: data.supplier.mfo, buyerLabel: 'МФО:', buyerValue: data.buyer.mfo },
    ]

    partyFields.forEach(field => {
        // Supplier side: AB (label), CD (value)
        worksheet.mergeCells(row, 1, row, 2)
        const supplierLabelCell = worksheet.getCell(row, 1)
        supplierLabelCell.value = field.label
        supplierLabelCell.font = { name: 'Arial', size: 7 }
        supplierLabelCell.alignment = { horizontal: 'left', vertical: 'middle' }
        supplierLabelCell.border = {
            left: { style: 'thin' },
            right: { style: 'thin' },
            bottom: { style: 'thin' }
        }

        worksheet.mergeCells(row, 3, row, 4)
        const supplierValueCell = worksheet.getCell(row, 3)
        supplierValueCell.value = field.supplierValue
        supplierValueCell.font = { name: 'Arial', size: 7 }
        supplierValueCell.alignment = { horizontal: 'left', vertical: 'middle' }
        supplierValueCell.border = {
            left: { style: 'thin' },
            right: { style: 'thin' },
            bottom: { style: 'thin' }
        }

        // Column E is empty/separator
        const separatorCell = worksheet.getCell(row, 5)
        separatorCell.value = ''

        // Buyer side: FGH (label), IJK (value)
        worksheet.mergeCells(row, 6, row, 8)
        const buyerLabelCell = worksheet.getCell(row, 6)
        buyerLabelCell.value = field.buyerLabel
        buyerLabelCell.font = { name: 'Arial', size: 7 }
        buyerLabelCell.alignment = { horizontal: 'left', vertical: 'middle' }
        buyerLabelCell.border = {
            left: { style: 'thin' },
            right: { style: 'thin' },
            bottom: { style: 'thin' }
        }

        worksheet.mergeCells(row, 9, row, 11)
        const buyerValueCell = worksheet.getCell(row, 9)
        buyerValueCell.value = field.buyerValue
        buyerValueCell.font = { name: 'Arial', size: 7 }
        buyerValueCell.alignment = { horizontal: 'left', vertical: 'middle' }
        buyerValueCell.border = {
            left: { style: 'thin' },
            right: { style: 'thin' },
            bottom: { style: 'thin' }
        }

        worksheet.getRow(row).height = 10
        row++
    })

    // === ITEMS TABLE ===
    row++ // spacing

    // Table header
    const headerRow = worksheet.getRow(row)
    const headers = [
        { col: 1, text: '№', width: 4 },
        { col: 2, text: 'Наименование товара (услуги)', width: 25 },
        { col: 3, text: 'Идентификационный код товара по Единому классификатору товаров и услуг внешнеэкономической деятельности Республики Узбекистан', width: 18 },
        { col: 4, text: 'Штрих-код', width: 12 },
        { col: 5, text: 'Единица измерения', width: 8 },
        { col: 6, text: 'Количество', width: 10 },
        { col: 7, text: 'Цена (без НДС)', width: 10 },
        { col: 8, text: 'Стоимость (без НДС)', width: 12 },
        { col: 9, text: 'Ставка НДС %', width: 8 },
        { col: 10, text: 'Сумма НДС', width: 12 },
        { col: 11, text: 'Стоимость с учетом НДС', width: 12 }
    ]

    headers.forEach(h => {
        const cell = worksheet.getCell(row, h.col)
        cell.value = h.text
        cell.font = { name: 'Arial', size: 7, bold: true }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
            bottom: { style: 'thin' }
        }
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F0F0' }
        }
    })
    headerRow.height = 30
    row++

    // Items
    let totalWithoutVAT = 0
    let totalVAT = 0
    let totalWithVAT = 0

    data.items.forEach((item, index) => {
        const subtotal = item.quantity * item.unitPrice
        const vatRate = (item.vatRate || 0) * 100
        const vatAmount = subtotal * (item.vatRate || 0)
        const total = subtotal + vatAmount

        totalWithoutVAT += subtotal
        totalVAT += vatAmount
        totalWithVAT += total

        const itemRow = worksheet.getRow(row)

        const cells = [
            { col: 1, value: index + 1, align: 'center' },
            { col: 2, value: item.productName, align: 'left' },
            { col: 3, value: item.catalogCode, align: 'left' },
            { col: 4, value: item.barcode, align: 'left' },
            { col: 5, value: item.unit, align: 'center' },
            { col: 6, value: item.quantity, align: 'right', numFmt: '#,##0.00' },
            { col: 7, value: item.unitPrice, align: 'right', numFmt: '#,##0.00' },
            { col: 8, value: subtotal, align: 'right', numFmt: '#,##0.00' },
            { col: 9, value: `${vatRate}%`, align: 'center' },
            { col: 10, value: vatAmount, align: 'right', numFmt: '#,##0.00' },
            { col: 11, value: total, align: 'right', numFmt: '#,##0.00' }
        ]

        cells.forEach(c => {
            const cell = worksheet.getCell(row, c.col)
            cell.value = c.value
            cell.font = { name: 'Arial', size: 7 }
            cell.alignment = { horizontal: c.align as any, vertical: 'middle' }
            if (c.numFmt) cell.numFmt = c.numFmt
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
                bottom: { style: 'thin' }
            }
        })

        itemRow.height = 15
        row++
    })

    // Totals row
    const totalsRow = worksheet.getRow(row)
    worksheet.mergeCells(row, 1, row, 7)
    const totalsLabel = worksheet.getCell(row, 1)
    totalsLabel.value = 'Итого:'
    totalsLabel.font = { name: 'Arial', size: 7, bold: true }
    totalsLabel.alignment = { horizontal: 'right', vertical: 'middle' }
    totalsLabel.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
    }

    const totalCells = [
        { col: 8, value: totalWithoutVAT },
        { col: 9, value: '' },
        { col: 10, value: totalVAT },
        { col: 11, value: totalWithVAT }
    ]

    totalCells.forEach(c => {
        const cell = worksheet.getCell(row, c.col)
        cell.value = c.value
        cell.font = { name: 'Arial', size: 7, bold: true }
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
        cell.numFmt = '#,##0.00'
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
            bottom: { style: 'thin' }
        }
    })
    totalsRow.height = 15
    row++

    // === FOOTER / SIGNATURES ===
    row++ // spacing

    // Signature rows
    const signatures = [
        { label: 'Руководитель:', value: 'NABITONOV Z', col2Label: 'Получил:', col2Value: '' },
        { label: 'Главный бухгалтер:', value: 'НЕ ПРЕДУСМОТРЕН', col2Label: 'Доверенность:', col2Value: '' }
    ]

    signatures.forEach(sig => {
        const sigRow = worksheet.getRow(row)

        // Left signature
        worksheet.mergeCells(row, 1, row, 2)
        const labelCell = worksheet.getCell(row, 1)
        labelCell.value = sig.label
        labelCell.font = { name: 'Arial', size: 7 }
        labelCell.alignment = { horizontal: 'left', vertical: 'middle' }

        worksheet.mergeCells(row, 3, row, 5)
        const valueCell = worksheet.getCell(row, 3)
        valueCell.value = sig.value
        valueCell.font = { name: 'Arial', size: 7 }
        valueCell.alignment = { horizontal: 'center', vertical: 'middle' }
        valueCell.border = { bottom: { style: 'thin' } }

        // Right signature
        worksheet.mergeCells(row, 6, row, 7)
        const label2Cell = worksheet.getCell(row, 6)
        label2Cell.value = sig.col2Label
        label2Cell.font = { name: 'Arial', size: 7 }
        label2Cell.alignment = { horizontal: 'left', vertical: 'middle' }

        worksheet.mergeCells(row, 8, row, 11)
        const value2Cell = worksheet.getCell(row, 8)
        value2Cell.value = sig.col2Value
        value2Cell.font = { name: 'Arial', size: 7 }
        value2Cell.alignment = { horizontal: 'center', vertical: 'middle' }
        value2Cell.border = { bottom: { style: 'thin' } }

        sigRow.height = 15
        row++
    })

    // Additional footer
    const footerRow = worksheet.getRow(row)
    worksheet.mergeCells(row, 1, row, 11)
    const footerCell = worksheet.getCell(row, 1)
    footerCell.value = 'Отпуск продукции или оказание услуг разрешаю (подпись, печать)'
    footerCell.font = { name: 'Arial', size: 7, italic: true }
    footerCell.alignment = { horizontal: 'center', vertical: 'middle' }
    footerRow.height = 15
    row++

    return row
}
