import PDFDocument from 'pdfkit'
import { InvoiceData } from '../excel/invoice-types'
import { formatInvoiceDate } from '../excel/invoice-utils'

/**
 * Generate bulk Schet-Faktura PDFs
 */
export async function generateBulkSchetFakturaPDF(dataArray: InvoiceData[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 20,
      })

      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      dataArray.forEach((data, index) => {
        if (index > 0) {
          doc.addPage()
        }
        renderInvoicePage(doc, data)
      })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generate Schet-Faktura (Tax Invoice) in PDF format using PDFKit
 * No Chromium/Browser needed - pure PDF generation
 */
export async function generateSchetFakturaPDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 20,
      })

      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      renderInvoicePage(doc, data)
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Render invoice page content
 */
function renderInvoicePage(doc: any, data: InvoiceData): void {
  // Header
  doc.fontSize(14).font('Helvetica-Bold').text('СЧЁТ-ФАКТУРА', { align: 'center' })
  doc.fontSize(10).font('Helvetica').text('(Tax Invoice)', { align: 'center' })
  doc.moveDown(1)

      // Invoice details
      doc.fontSize(9)
      doc.text(`Invoice No: ${data.invoiceNumber || 'N/A'}`)
      doc.text(`Date: ${formatInvoiceDate(data.invoiceDate || new Date())}`)
      doc.moveDown(0.5)

      // Supplier info
      doc.font('Helvetica-Bold').text('SUPPLIER / ПОСТАВЩИК:')
      doc.font('Helvetica')
      doc.text(data.supplier?.name || 'Evercold LLC')
      doc.text(`Address: ${data.supplier?.address || 'N/A'}`)
      doc.text(`VAT ID: ${data.supplier?.vatCode || 'N/A'}`)
      doc.moveDown(1)

      // Buyer info
      doc.font('Helvetica-Bold').text('BUYER / ПОКУПАТЕЛЬ:')
      doc.font('Helvetica')
      doc.text(data.buyer?.name || 'N/A')
      doc.text(`Address: ${data.buyer?.address || 'N/A'}`)
      doc.text(`INN: ${data.buyer?.inn || 'N/A'}`)
      doc.moveDown(1)

      // Items table header
      const tableTop = doc.y
      const col1 = 50
      const col2 = 150
      const col3 = 300
      const col4 = 380
      const col5 = 480

      doc.font('Helvetica-Bold').fontSize(8)
      doc.text('Item', col1, tableTop)
      doc.text('Qty', col2, tableTop)
      doc.text('Unit Price', col3, tableTop)
      doc.text('VAT %', col4, tableTop)
      doc.text('Amount', col5, tableTop)

      // Table line
      doc.moveTo(40, tableTop + 15).lineTo(560, tableTop + 15).stroke()

      // Items
      doc.font('Helvetica').fontSize(8)
      let itemTop = tableTop + 25
      let totalAmount = 0
      let totalVat = 0

      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          const itemTotal = (item.quantity || 0) * (item.unitPrice || 0)
          const vatRate = item.vatRate || 0
          const itemVat = itemTotal * vatRate

          doc.text(item.productName || 'Product', col1, itemTop, { width: 90 })
          doc.text(String(item.quantity || 0), col2, itemTop)
          doc.text(`$${(item.unitPrice || 0).toFixed(2)}`, col3, itemTop)
          doc.text(`${(vatRate * 100).toFixed(0)}%`, col4, itemTop)
          doc.text(`$${itemTotal.toFixed(2)}`, col5, itemTop)

          totalAmount += itemTotal
          totalVat += itemVat
          itemTop += 20
        }
      }

      // Totals line
      doc.moveTo(40, itemTop + 5).lineTo(560, itemTop + 5).stroke()

      itemTop += 15
      doc.font('Helvetica-Bold').fontSize(9)
      doc.text('TOTAL:', col1, itemTop)
      doc.text(`$${totalAmount.toFixed(2)}`, col5, itemTop)

      itemTop += 20
      doc.text('VAT:', col1, itemTop)
      doc.text(`$${totalVat.toFixed(2)}`, col5, itemTop)

      itemTop += 20
      doc.fontSize(10).font('Helvetica-Bold')
      doc.text('GRAND TOTAL:', col1, itemTop)
      doc.text(`$${(totalAmount + totalVat).toFixed(2)}`, col5, itemTop)

  // Footer
  doc.moveDown(3)
  doc.fontSize(8).font('Helvetica')
  doc.text('This is a computer-generated invoice. No signature required.', { align: 'center' })
  doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
}
