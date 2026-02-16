import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import { InvoiceData } from '../excel/invoice-types'
import { formatInvoiceDate } from '../excel/invoice-utils'
import { numberToRussianWords } from '../utils/numberToWords'
import { formatNumber } from '../utils/format-number'

/** @deprecated Use formatNumber from utils/format-number instead */
const formatRussianNumber = formatNumber

/**
 * Format timestamp for EDO stamps: YYYY.MM.DD HH:mm:ss
 */
function formatEdoTimestamp(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Render EDO verification stamp box
 */
function renderEdoStamp(
  doc: any,
  x: number,
  y: number,
  width: number,
  stamp: {
    number: string
    timestamp: Date
    status: 'ОТПРАВЛЕНО' | 'ПОДТВЕРЖДЁН'
    operatorName: string
    operatorSystem: string
    ipAddress: string
  }
) {
  const statusColor = stamp.status === 'ОТПРАВЛЕНО' ? '#666666' : '#10b981' // Gray or green

  // Border box
  doc.roundedRect(x, y, width, 60, 5).stroke()

  // Stamp number and timestamp (top line)
  doc.fontSize(7).font('Roboto')
  doc.text(`${stamp.number}  ${formatEdoTimestamp(stamp.timestamp)}`, x + 5, y + 5, {
    width: width - 10,
    lineBreak: false
  })

  // Status (bold, colored)
  doc.fontSize(8).font('Roboto-Bold').fillColor(statusColor)
  doc.text(stamp.status, x + 5, y + 15, {
    width: width - 10,
    align: 'center',
    lineBreak: false
  })

  // Reset color
  doc.fillColor('#000000')

  // Operator name
  doc.fontSize(7).font('Roboto')
  doc.text(stamp.operatorName, x + 5, y + 30, {
    width: width - 10,
    lineBreak: false
  })

  // Operator system
  doc.text(`Оператор: ${stamp.operatorSystem}`, x + 5, y + 40, {
    width: width - 10,
    lineBreak: false
  })

  // IP address
  doc.text(`IP: ${stamp.ipAddress}`, x + 5, y + 50, {
    width: width - 10,
    lineBreak: false
  })
}

/**
 * Render QR code page (page 2) with EDO verification
 */
async function renderQRCodePage(doc: any, data: InvoiceData): Promise<void> {
  doc.addPage()

  const pageWidth = 595.28
  const margin = 30

  // Generate QR code as data URL
  if (data.edoMetadata?.qrCodeData) {
    try {
      const qrDataUrl = await QRCode.toDataURL(data.edoMetadata.qrCodeData, {
        width: 150,
        margin: 1,
        errorCorrectionLevel: 'M'
      })

      // Convert data URL to buffer
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64')

      // Place QR code at top right
      doc.image(qrBuffer, pageWidth - margin - 150, margin, {
        width: 150,
        height: 150
      })
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
  }

  // Document IDs at top left
  let y = margin + 10
  doc.fontSize(7).font('Roboto')

  if (data.edoMetadata?.didoxId) {
    doc.text(`ID документа (Didox.uz): ${data.edoMetadata.didoxId}`, margin, y)
    y += 10
  }

  if (data.edoMetadata?.roumingId) {
    doc.text(`ID документа (Rouming.uz): ${data.edoMetadata.roumingId}`, margin, y)
    y += 10
  }

  doc.text('идентификатор электронного документа', margin, y)
  y += 15

  // "Стандартный" label
  if (data.edoMetadata?.documentType) {
    doc.fontSize(8).font('Roboto')
    doc.rect(margin, y, 100, 25).stroke()
    doc.text(data.edoMetadata.documentType, margin + 10, y + 8)
  }

  y += 40

  // Repeat main invoice content (same as page 1)
  renderInvoicePage(doc, data)
}

/**
 * Generate bulk Schet-Faktura PDFs
 */
export async function generateBulkSchetFakturaPDF(dataArray: InvoiceData[]): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
      })

      // Register DejaVu Sans - full Unicode including Cyrillic
      doc.registerFont('Roboto', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
      doc.registerFont('Roboto-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')

      // Set default font immediately to prevent PDFKit from loading Helvetica
      doc.font('Roboto')

      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Render all invoices (2 copies per page)
      for (let index = 0; index < dataArray.length; index++) {
        const data = dataArray[index]

        if (index > 0) {
          doc.addPage()
        }

        // Render first copy (top of page)
        renderInvoicePage(doc, data, 0)

        // Draw separator line
        doc.moveTo(30, 400).lineTo(565, 400).dash(5, { space: 3 }).stroke().undash()

        // Add scissors icon/text for cutting
        doc.fontSize(8).font('Roboto').fillColor('#999999')
        doc.text('✂', 10, 395)
        doc.fillColor('#000000')

        // Render second copy (bottom of page)
        renderInvoicePage(doc, data, 405)

        // QR code page 2 disabled for now
        // if (data.edoMetadata) {
        //   await renderQRCodePage(doc, data)
        // }
      }

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generate Schet-Faktura (Tax Invoice) in PDF format using PDFKit
 * Matches official Uzbek government format
 */
export async function generateSchetFakturaPDF(data: InvoiceData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
      })

      // Register DejaVu Sans - full Unicode including Cyrillic
      doc.registerFont('Roboto', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
      doc.registerFont('Roboto-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')

      // Set default font immediately to prevent PDFKit from loading Helvetica
      doc.font('Roboto')

      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Render first copy (top of page)
      renderInvoicePage(doc, data, 0)

      // Draw separator line
      doc.moveTo(30, 400).lineTo(565, 400).dash(5, { space: 3 }).stroke().undash()

      // Add scissors icon/text for cutting
      doc.fontSize(8).font('Roboto').fillColor('#999999')
      doc.text('✂', 10, 395)
      doc.fillColor('#000000')

      // Render second copy (bottom of page)
      renderInvoicePage(doc, data, 405)

      // QR code page 2 disabled for now
      // if (data.edoMetadata) {
      //   await renderQRCodePage(doc, data)
      // }

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Render invoice page content in official Uzbek format
 * Exact copy of reference PDF style
 * @param yOffset - Vertical offset for rendering (0 for top copy, ~400 for bottom copy)
 */
function renderInvoicePage(doc: any, data: InvoiceData, yOffset: number = 0): void {
  const pageWidth = 595.28 // A4 width
  const margin = 30

  // Title - 8pt bold
  doc.fontSize(8).font('Roboto-Bold')
  doc.text('Счет-фактура', margin, 40 + yOffset, { width: pageWidth - margin * 2, align: 'center' })

  // Invoice number and date - 7pt (invoice number bold)
  const invoiceDate = formatInvoiceDate(data.invoiceDate || new Date())
  const invoiceText = `№ ${data.invoiceNumber} от ${invoiceDate}`
  doc.fontSize(7).font('Roboto')

  // Calculate center position for the entire text
  const textWidth = doc.widthOfString(invoiceText)
  const centerX = (pageWidth - textWidth) / 2

  // Render with bold invoice number
  doc.text('№ ', centerX, 50 + yOffset, { continued: true })
  doc.font('Roboto-Bold').text(data.invoiceNumber, { continued: true })
  doc.font('Roboto').text(` от ${invoiceDate}`)

  // Contract info - 7pt
  doc.fontSize(7).font('Roboto')
  doc.text(data.contractInfo || 'к договору № 1 от 02.01.2022', margin, 58 + yOffset, { width: pageWidth - margin * 2, align: 'center' })

  let y = 66 + yOffset

  // Order and branch info (if available) - 7pt
  if (data.orderId || data.branchName) {
    doc.fontSize(7).font('Roboto')

    const orderInfo = []
    if (data.orderId) {
      orderInfo.push(`Заказ №: ${data.orderId}`)
    }
    if (data.branchName) {
      const branchFullName = data.branchCode
        ? `${data.buyer.name} - ${data.branchName} (${data.branchCode})`
        : data.branchName
      orderInfo.push(branchFullName)
    }

    if (orderInfo.length > 0) {
      doc.text(orderInfo.join(', '), margin, y, { width: pageWidth - margin * 2, align: 'center' })
      y += 8
    }
  }

  y += 8

  // Two-column layout for supplier and buyer
  const colWidth = (pageWidth - margin * 2) / 2
  const leftCol = margin
  const rightCol = margin + colWidth
  const supplierStartY = y  // Store starting Y position for alignment

  // Remove customer name from branch name if it's duplicated
  const cleanBranchName = data.branchName
    ? data.branchName.replace(new RegExp(`^${data.buyer.name}\\s*-\\s*`, 'i'), '')
    : data.branchName

  const buyerNameWithBranch = data.branchCode
    ? `${data.buyer.name} (${data.branchCode} - ${cleanBranchName})`
    : data.buyer.name

  // Define label width for alignment (compact for closer values)
  const labelWidth = 75
  const valueX = leftCol + labelWidth

  // Поставщик (bold label)
  doc.fontSize(7).font('Roboto-Bold')
  doc.text('Поставщик:', leftCol, y, { width: labelWidth, lineGap: -2 })
  doc.font('Roboto').text(data.supplier.name, valueX, y, { width: colWidth - labelWidth - 10 })
  y += 8

  // Address (bold label, allows 2 lines if needed)
  doc.font('Roboto-Bold')
  doc.text('Адрес:', leftCol, y, { width: labelWidth, lineGap: -2 })
  doc.font('Roboto').text(data.supplier.address, valueX, y, { width: colWidth - labelWidth - 10, lineGap: 1 })
  y += 20  // Extra space to accommodate potential 2-line wrap + spacing

  // INN (bold label, regular value)
  doc.font('Roboto-Bold')
  doc.text('ИНН:', leftCol, y, { width: labelWidth, lineGap: -2 })
  doc.font('Roboto').text(data.supplier.inn, valueX, y)
  y += 10

  // VAT code (bold label, regular value)
  doc.font('Roboto-Bold')
  doc.text('Рег. код НДС:', leftCol, y, { width: labelWidth, lineGap: -2 })
  doc.font('Roboto').text(data.supplier.vatCode, valueX, y)
  y += 8

  // Bank account (bold label, regular value)
  doc.font('Roboto-Bold')
  doc.text('Р/С:', leftCol, y, { width: labelWidth, lineGap: -2 })
  doc.font('Roboto').text(data.supplier.bankAccount, valueX, y)
  y += 8

  // MFO (bold label, regular value)
  doc.font('Roboto-Bold')
  doc.text('МФО:', leftCol, y, { width: labelWidth, lineGap: -2 })
  doc.font('Roboto').text(data.supplier.mfo, valueX, y)

  // Reset Y for buyer column (right side)
  let buyerY = supplierStartY  // Start buyer at same Y as supplier
  const buyerValueX = rightCol + labelWidth

  // Покупатель (bold label)
  doc.fontSize(7).font('Roboto-Bold')
  doc.text('Покупатель:', rightCol, buyerY, { width: labelWidth, lineGap: -2 })
  doc.font('Roboto').text(buyerNameWithBranch, buyerValueX, buyerY, { width: colWidth - labelWidth - 10 })
  buyerY += 8

  // Address (bold label, allows 2 lines if needed)
  doc.font('Roboto-Bold')
  doc.text('Адрес:', rightCol, buyerY, { width: labelWidth, lineGap: -2 })
  doc.font('Roboto').text(data.buyer.address, buyerValueX, buyerY, { width: colWidth - labelWidth - 10, lineGap: 1 })
  buyerY += 20  // Extra space to accommodate potential 2-line wrap + spacing

  // INN (bold label, regular value)
  doc.font('Roboto-Bold')
  doc.text('ИНН:', rightCol, buyerY, { width: labelWidth, lineGap: -2 })
  doc.font('Roboto').text(data.buyer.inn, buyerValueX, buyerY)
  buyerY += 10

  // VAT code (bold label, regular value)
  doc.font('Roboto-Bold')
  doc.text('Рег. код НДС:', rightCol, buyerY, { width: labelWidth, lineGap: -2 })
  doc.font('Roboto').text(data.buyer.vatCode, buyerValueX, buyerY)
  buyerY += 8

  // Bank account (bold label, regular value)
  doc.font('Roboto-Bold')
  doc.text('Р/С:', rightCol, buyerY, { width: labelWidth, lineGap: -2 })
  doc.font('Roboto').text(data.buyer.bankAccount, buyerValueX, buyerY)
  buyerY += 8

  // MFO (bold label, regular value)
  doc.font('Roboto-Bold')
  doc.text('МФО:', rightCol, buyerY, { width: labelWidth, lineGap: -2 })
  doc.font('Roboto').text(data.buyer.mfo, buyerValueX, buyerY)

  // Move Y to bottom of both columns
  y = Math.max(y, buyerY) + 12

  // Table
  const tableTop = y
  const tableWidth = pageWidth - margin * 2

  // Set thin border for table
  doc.lineWidth(0.5)

  // Column widths - optimized for readability and visual hierarchy
  const cols = [
    { width: 22, label: '№', align: 'center' },
    { width: 100, label: 'Наименование товаров (услуг)', align: 'center' },
    { width: 105, label: 'Идентификационный код и название по Единому электронному национальному каталогу товаров (услуг)', align: 'center' },
    { width: 38, label: 'Единица измерения', align: 'center' },
    { width: 38, label: 'Кол-во', align: 'center' },
    { width: 42, label: 'Цена', align: 'center' },
    { width: 48, label: 'Стоимость поставки', align: 'center' },
    { width: 26, label: 'Ставка', align: 'center', parent: 'НДС' },
    { width: 40, label: 'Сумма', align: 'center', parent: 'НДС' },
    { width: 62, label: 'Стоимость поставки с учетом НДС', align: 'center' },
  ]

  // Calculate column X positions
  const colX: number[] = []
  let x = margin
  cols.forEach((col) => {
    colX.push(x)
    x += col.width
  })

  // Draw table header
  doc.fontSize(6).font('Roboto')
  let headerY = tableTop

  // Main headers with text wrapping enabled
  cols.forEach((col, i) => {
    if (!col.parent) {
      doc.text(col.label, colX[i] + 1, headerY + 1, {
        width: col.width - 2,
        align: col.align as any,
        lineGap: -1
      })
    }
  })

  // НДС parent header
  doc.text('НДС', colX[7] + 1, headerY + 1, {
    width: cols[7].width + cols[8].width - 2,
    align: 'center'
  })

  // Sub-headers
  const subHeaderY = tableTop + 16
  doc.text('Ставка', colX[7] + 1, subHeaderY, { width: cols[7].width - 2, align: 'center' })
  doc.text('Сумма', colX[8] + 1, subHeaderY, { width: cols[8].width - 2, align: 'center' })

  // Draw header borders
  const headerHeight = 28
  const subHeaderLineY = tableTop + 16
  doc.rect(margin, tableTop, tableWidth, headerHeight).stroke()

  // Vertical lines - draw full height except for НДС merged cells
  colX.forEach((x, i) => {
    // Column 8 (between НДС sub-columns) - only draw from sub-header line down
    if (i === 8) {
      doc.moveTo(x, subHeaderLineY).lineTo(x, tableTop + headerHeight).stroke()
    } else {
      // All other columns - draw full height
      doc.moveTo(x, tableTop).lineTo(x, tableTop + headerHeight).stroke()
    }
  })
  doc.moveTo(margin + tableWidth, tableTop).lineTo(margin + tableWidth, tableTop + headerHeight).stroke()

  // Horizontal line for НДС sub-headers
  doc.moveTo(colX[7], subHeaderLineY).lineTo(colX[9], subHeaderLineY).stroke()

  // Data rows
  y = tableTop + headerHeight
  let totalSubtotal = 0
  let totalVat = 0
  let grandTotal = 0

  doc.fontSize(6).font('Roboto')

  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      const subtotal = item.quantity * item.unitPrice
      const vatRate = item.vatRate || 0.12
      const vatAmount = subtotal * vatRate
      const itemTotal = subtotal + vatAmount

      totalSubtotal += subtotal
      totalVat += vatAmount
      grandTotal += itemTotal

      const rowHeight = 28
      const textY = y + 2

      // Row data - no text wrapping, single line
      doc.text(`${index + 1}`, colX[0] + 1, textY, { width: cols[0].width - 2, align: 'center', lineBreak: false })
      doc.text(item.productName, colX[1] + 1, textY, { width: cols[1].width - 2, lineBreak: false })
      doc.text(item.catalogCode || '', colX[2] + 1, textY, { width: cols[2].width - 2, lineBreak: false })
      doc.text('пакет=1 килограмм', colX[3] + 1, textY, { width: cols[3].width - 2, lineBreak: false })
      doc.text(formatRussianNumber(item.quantity, 0), colX[4] + 1, textY, { width: cols[4].width - 2, align: 'right', lineBreak: false })
      doc.text(formatRussianNumber(item.unitPrice, 2), colX[5] + 1, textY, { width: cols[5].width - 2, align: 'right', lineBreak: false })
      doc.text(formatRussianNumber(subtotal, 2), colX[6] + 1, textY, { width: cols[6].width - 2, align: 'right', lineBreak: false })
      doc.text(`${(vatRate * 100).toFixed(0)}%`, colX[7] + 1, textY, { width: cols[7].width - 2, align: 'center', lineBreak: false })
      doc.text(formatRussianNumber(vatAmount, 2), colX[8] + 1, textY, { width: cols[8].width - 2, align: 'right', lineBreak: false })
      doc.text(formatRussianNumber(itemTotal, 2), colX[9] + 1, textY, { width: cols[9].width - 2, align: 'right', lineBreak: false })

      // Row border
      doc.rect(margin, y, tableWidth, rowHeight).stroke()

      // Vertical lines
      colX.forEach((x) => {
        doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke()
      })
      doc.moveTo(margin + tableWidth, y).lineTo(margin + tableWidth, y + rowHeight).stroke()

      y += rowHeight
    })
  }

  // Totals row
  const totalsHeight = 14
  doc.fontSize(6).font('Roboto')

  doc.text('Итого', colX[1] + 1, y + 2, { width: cols[1].width - 2, lineBreak: false })
  doc.text(formatRussianNumber(totalSubtotal, 2), colX[6] + 1, y + 2, { width: cols[6].width - 2, align: 'right', lineBreak: false })
  doc.text(formatRussianNumber(totalVat, 2), colX[8] + 1, y + 2, { width: cols[8].width - 2, align: 'right', lineBreak: false })
  doc.text(formatRussianNumber(grandTotal, 2), colX[9] + 1, y + 2, { width: cols[9].width - 2, align: 'right', lineBreak: false })

  // Totals border
  doc.rect(margin, y, tableWidth, totalsHeight).stroke()
  colX.forEach((x) => {
    doc.moveTo(x, y).lineTo(x, y + totalsHeight).stroke()
  })
  doc.moveTo(margin + tableWidth, y).lineTo(margin + tableWidth, y + totalsHeight).stroke()

  y += totalsHeight + 8

  // Total in words
  const totalInWords = numberToRussianWords(grandTotal, 'sum')
  doc.fontSize(7).font('Roboto')
  doc.text(`Всего к оплате: ${totalInWords} . в т. ч. НДС: ${formatRussianNumber(totalVat, 2)} .`,
    margin, y, { width: tableWidth, lineBreak: false })

  y += 18

  // Signatures
  doc.fontSize(7).font('Roboto-Bold')

  doc.text('Руководитель: ', margin, y, { width: colWidth - 5, lineBreak: false, continued: true })
  doc.font('Roboto').text('NASRITDINOV ZUXRITDIN ERKINOVICH', { lineBreak: false })
  doc.font('Roboto-Bold').text('Руководитель:', margin + colWidth, y, { width: colWidth - 5, lineBreak: false })
  y += 10

  doc.font('Roboto-Bold').text('Главный бухгалтер: ', margin, y, { width: colWidth - 5, lineBreak: false, continued: true })
  doc.font('Roboto').text('NASRITDINOV ZUXRITDIN ERKINOVICH', { lineBreak: false })
  doc.font('Roboto-Bold').text('Главный бухгалтер:', margin + colWidth, y, { width: colWidth - 5, lineBreak: false })
  y += 12

  doc.font('Roboto-Bold').text('Товар отпустил:', margin, y, { width: colWidth - 5, lineBreak: false })
  doc.text('Получил:', margin + colWidth, y, { width: colWidth - 5, lineBreak: false })

  // Reset line width to default
  doc.lineWidth(1)

  // EDO section removed for now - can be re-enabled later if needed
}
