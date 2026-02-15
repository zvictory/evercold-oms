import puppeteer from 'puppeteer'
import fs from 'fs/promises'
import path from 'path'
import { InvoiceData } from '../excel/invoice-types'
import { formatInvoiceDate } from '../excel/invoice-utils'

export class InvoicePDFGenerator {
    private templatePath: string

    constructor() {
        this.templatePath = path.join(process.cwd(), 'src/lib/pdf/invoice-template.html')
    }

    /**
     * Generate a single invoice PDF
     */
    async generate(data: InvoiceData): Promise<Buffer> {
        const html = await this.renderHTML(data)
        return await this.convertToPDF(html)
    }

    /**
     * Generate multiple invoices in a single PDF
     */
    async generateBulk(invoices: InvoiceData[]): Promise<Buffer> {
        const htmlPages = await Promise.all(
            invoices.map(invoice => this.renderHTML(invoice))
        )

        // Combine all HTML pages with page breaks
        const combinedHTML = htmlPages.join('<div style="page-break-after: always;"></div>')

        return await this.convertToPDF(combinedHTML)
    }

    /**
     * Render HTML from template with data
     */
    private async renderHTML(data: InvoiceData): Promise<string> {
        // Load template
        let template = await fs.readFile(this.templatePath, 'utf-8')

        // Replace header placeholders
        template = template.replace('{{invoiceNumber}}', data.invoiceNumber.toString())
        template = template.replace('{{invoiceDate}}', formatInvoiceDate(data.invoiceDate))
        template = template.replace('{{contractInfo}}', data.contractInfo)

        // Replace supplier placeholders
        template = template.replace('{{supplierName}}', data.supplier.name)
        template = template.replace('{{supplierINN}}', data.supplier.inn)
        template = template.replace('{{supplierVATCode}}', data.supplier.vatCode)
        template = template.replace('{{supplierAddress}}', data.supplier.address)
        template = template.replace('{{supplierBankAccount}}', data.supplier.bankAccount)
        template = template.replace('{{supplierMFO}}', data.supplier.mfo)
        template = template.replace('{{supplierTG}}', data.supplier.tg)

        // Replace buyer placeholders
        template = template.replace('{{buyerName}}', data.buyer.name)
        template = template.replace('{{buyerINN}}', data.buyer.inn)
        template = template.replace('{{buyerVATCode}}', data.buyer.vatCode)
        template = template.replace('{{buyerAddress}}', data.buyer.address)
        template = template.replace('{{buyerBankAccount}}', data.buyer.bankAccount)
        template = template.replace('{{buyerMFO}}', data.buyer.mfo)
        template = template.replace('{{buyerTG}}', data.buyer.tg)

        // Generate item rows
        const itemsRows = data.items.map((item, index) => {
            const subtotal = item.quantity * item.unitPrice
            const vatRate = (item.vatRate || 0) * 100 // Convert 0.15 to 15
            const vatAmount = subtotal * (item.vatRate || 0)
            const total = subtotal + vatAmount

            return `
        <tr>
          <td class="col-num">${index + 1}</td>
          <td class="col-name">${item.productName}</td>
          <td class="col-code">${item.catalogCode}</td>
          <td class="col-barcode">${item.barcode}</td>
          <td class="col-unit">${item.unit}</td>
          <td class="col-qty">${item.quantity.toFixed(2)}</td>
          <td class="col-price">${item.unitPrice.toFixed(2)}</td>
          <td class="col-subtotal">${subtotal.toFixed(2)}</td>
          <td class="col-vat-rate">${vatRate.toFixed(0)}%</td>
          <td class="col-vat-amount">${vatAmount.toFixed(2)}</td>
          <td class="col-total">${total.toFixed(2)}</td>
        </tr>
      `
        }).join('')

        template = template.replace('{{itemsRows}}', itemsRows)

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

        // Replace total placeholders
        template = template.replace('{{totalWithoutVAT}}', totalWithoutVAT.toFixed(2))
        template = template.replace('{{vatAmount}}', totalVAT.toFixed(2))
        template = template.replace('{{totalWithVAT}}', totalWithVAT.toFixed(2))

        // Total in words (simplified)
        const totalInWords = `Всего к оплате: ${totalWithVAT.toFixed(2)} сум (${this.numberToWords(totalWithVAT)})`
        template = template.replace('{{totalInWords}}', totalInWords)

        return template
    }

    /**
     * Convert HTML to PDF using Puppeteer
     */
    private async convertToPDF(html: string): Promise<Buffer> {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        try {
            const page = await browser.newPage()
            await page.setContent(html, { waitUntil: 'networkidle0' })

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '10mm',
                    right: '10mm',
                    bottom: '10mm',
                    left: '10mm'
                }
            })

            return Buffer.from(pdfBuffer)
        } finally {
            await browser.close()
        }
    }

    /**
     * Convert number to words (simplified Russian)
     * For production, use a proper library like 'number-to-words' or 'written-number'
     */
    private numberToWords(num: number): string {
        // Simplified implementation - just return formatted number
        // In production, you'd want proper Russian number-to-words conversion
        const integerPart = Math.floor(num)
        const decimalPart = Math.round((num - integerPart) * 100)

        return `${integerPart.toLocaleString('ru-RU')} сум ${decimalPart.toString().padStart(2, '0')} тийин`
    }
}
