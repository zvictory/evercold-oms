import PDFDocument from 'pdfkit'
import { InvoiceData } from '../excel/invoice-types'
import { formatInvoiceDate } from '../excel/invoice-utils'

export class InvoicePDFGenerator {
    /**
     * Generate a single invoice PDF using PDFKit
     */
    async generate(data: InvoiceData): Promise<Buffer> {
        return this.generatePDF(data)
    }

    /**
     * Generate multiple invoices in a single PDF
     */
    async generateBulk(invoices: InvoiceData[]): Promise<Buffer> {
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

                invoices.forEach((invoice, index) => {
                    if (index > 0) {
                        doc.addPage()
                    }
                    this.renderInvoicePage(doc, invoice)
                })

                doc.end()
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Generate single invoice PDF
     */
    private async generatePDF(data: InvoiceData): Promise<Buffer> {
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

                this.renderInvoicePage(doc, data)
                doc.end()
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Render invoice page in PDF document
     */
    private renderInvoicePage(doc: PDFKit.PDFDocument, data: InvoiceData): void {
        let y = 20

        // Header
        doc.fontSize(16).font('Helvetica-Bold').text('СЧЁТ-ФАКТУРА', { align: 'center' })
        doc.fontSize(10).font('Helvetica').text('(Tax Invoice)', { align: 'center' })
        y += 40

        // Invoice details
        doc.fontSize(9).font('Helvetica')
        doc.text(`Invoice No: ${data.invoiceNumber || 'N/A'}`, 50, y)
        y += 15
        doc.text(`Date: ${formatInvoiceDate(data.invoiceDate)}`, 50, y)
        if (data.contractInfo) {
            y += 15
            doc.text(`Contract: ${data.contractInfo}`, 50, y)
        }
        y += 30

        // Supplier and Buyer side by side
        doc.font('Helvetica-Bold').fontSize(9)
        doc.text('SUPPLIER / ПОСТАВЩИК:', 50, y)
        doc.text('BUYER / ПОКУПАТЕЛЬ:', 300, y)
        y += 15

        doc.font('Helvetica').fontSize(8)
        const supplierData = data.supplier || {}
        const buyerData = data.buyer || {}

        doc.text(supplierData.name || 'N/A', 50, y)
        doc.text(buyerData.name || 'N/A', 300, y)
        y += 12

        doc.text(`INN: ${supplierData.inn || 'N/A'}`, 50, y)
        doc.text(`INN: ${buyerData.inn || 'N/A'}`, 300, y)
        y += 12

        doc.text(`VAT: ${supplierData.vatCode || 'N/A'}`, 50, y)
        doc.text(`VAT: ${buyerData.vatCode || 'N/A'}`, 300, y)
        y += 12

        doc.text(supplierData.address || 'Address N/A', 50, y, { width: 200 })
        doc.text(buyerData.address || 'Address N/A', 300, y, { width: 200 })
        y += 30

        // Items table header
        const tableY = y
        doc.font('Helvetica-Bold').fontSize(8)
        doc.text('#', 50, tableY)
        doc.text('Product', 70, tableY)
        doc.text('Code', 220, tableY)
        doc.text('Qty', 280, tableY)
        doc.text('Unit Price', 320, tableY)
        doc.text('Subtotal', 400, tableY)
        doc.text('VAT %', 470, tableY)
        doc.text('VAT', 510, tableY)

        // Table line
        doc.moveTo(50, tableY + 10).lineTo(530, tableY + 10).stroke()

        // Items
        doc.font('Helvetica').fontSize(8)
        let itemY = tableY + 18
        let totalSubtotal = 0
        let totalVat = 0

        if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item, index) => {
                const subtotal = (item.quantity || 0) * (item.unitPrice || 0)
                const vatRate = item.vatRate || 0
                const vatAmount = subtotal * vatRate

                doc.text(String(index + 1), 50, itemY)
                doc.text(item.productName || 'Product', 70, itemY, { width: 140 })
                doc.text(item.catalogCode || item.barcode || '', 220, itemY)
                doc.text(String(item.quantity || 0), 280, itemY)
                doc.text(`$${(item.unitPrice || 0).toFixed(2)}`, 320, itemY)
                doc.text(`$${subtotal.toFixed(2)}`, 400, itemY)
                doc.text(`${(vatRate * 100).toFixed(0)}%`, 470, itemY)
                doc.text(`$${vatAmount.toFixed(2)}`, 510, itemY)

                totalSubtotal += subtotal
                totalVat += vatAmount
                itemY += 12
            })
        }

        // Total line
        doc.moveTo(50, itemY + 5).lineTo(530, itemY + 5).stroke()

        itemY += 12
        doc.font('Helvetica-Bold').fontSize(9)
        doc.text('TOTAL:', 400, itemY)
        doc.text(`$${totalSubtotal.toFixed(2)}`, 510, itemY)

        itemY += 15
        doc.text('VAT:', 400, itemY)
        doc.text(`$${totalVat.toFixed(2)}`, 510, itemY)

        itemY += 15
        doc.fontSize(10)
        doc.text('GRAND TOTAL:', 400, itemY)
        doc.text(`$${(totalSubtotal + totalVat).toFixed(2)}`, 510, itemY)

        // Footer
        itemY += 40
        doc.fontSize(8).font('Helvetica')
        doc.text(`Total in words: ${this.numberToWords(totalSubtotal + totalVat)}`, 50, itemY, { width: 480 })

        itemY += 30
        doc.text('This is a computer-generated invoice. No signature required.', 50, itemY, { align: 'center' })
        doc.text(`Generated: ${new Date().toLocaleString()}`, 50, itemY + 12, { align: 'center' })
    }

    /**
     * Convert number to words (Russian)
     */
    private numberToWords(num: number): string {
        const integerPart = Math.floor(num)
        const decimalPart = Math.round((num - integerPart) * 100)
        return `${integerPart.toLocaleString('ru-RU')} сум ${decimalPart.toString().padStart(2, '0')} тийин`
    }
}
