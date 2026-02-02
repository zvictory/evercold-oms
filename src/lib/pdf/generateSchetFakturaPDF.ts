import puppeteer from 'puppeteer'
import { InvoiceData } from '../excel/invoice-types'
import { formatInvoiceDate } from '../excel/invoice-utils'

/**
 * Generate Schet-Faktura (Tax Invoice) in PDF format
 * Creates 2 copies per A4 page
 */
export async function generateSchetFakturaPDF(data: InvoiceData): Promise<Buffer> {
  const html = generateInvoiceHTML(data)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: 'A4',
      landscape: false,
      printBackground: true,
      margin: {
        top: '5mm',
        right: '5mm',
        bottom: '5mm',
        left: '5mm'
      }
    })

    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

/**
 * Generate bulk Schet-Faktura PDFs for multiple orders
 * Creates a multi-page PDF with 2 copies per page for each order
 */
export async function generateBulkSchetFakturaPDF(invoices: InvoiceData[]): Promise<Buffer> {
  const htmlPages = invoices.map(data => generateInvoiceHTML(data)).join('\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setContent(htmlPages, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: 'A4',
      landscape: false,
      printBackground: true,
      margin: {
        top: '5mm',
        right: '5mm',
        bottom: '5mm',
        left: '5mm'
      }
    })

    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}


function generateInvoiceHTML(data: InvoiceData): string {
  const invoiceCopy = generateInvoiceCopyHTML(data)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 6pt;
      line-height: 1.2;
    }
    
    .page {
      width: 210mm;
      height: 297mm;
      padding: 3mm;
      display: flex;
      flex-direction: column;
      gap: 3mm;
      page-break-after: always;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    .invoice-copy {
      flex: 1;
      border-bottom: 1px dashed #999;
      padding-bottom: 2mm;
    }
    
    .invoice-copy:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .header-row {
      text-align: center;
      font-weight: bold;
      margin-bottom: 1mm;
      font-size: 7pt;
    }
    
    .header-row.title {
      font-size: 9pt;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1mm;
    }
    
    .party-table td {
      border: 0.5pt solid black;
      padding: 0.5mm 1mm;
      font-size: 6pt;
      vertical-align: top;
    }
    
    .party-label {
      font-weight: bold;
    }
    
    .items-table {
      margin-top: 1mm;
      font-size: 5.5pt;
    }
    
    .items-table th,
    .items-table td {
      border: 0.5pt solid black;
      padding: 0.5mm;
      text-align: center;
      vertical-align: middle;
    }
    
    .items-table th {
      background-color: #f0f0f0;
      font-weight: bold;
      font-size: 5.5pt;
    }
    
    .items-table td.left {
      text-align: left;
    }
    
    .items-table td.right {
      text-align: right;
    }
    
    .column-numbers td {
      font-size: 5pt;
      padding: 0.3mm;
    }
    
    .totals-row {
      font-weight: bold;
    }
    
    .signatures {
      margin-top: 1mm;
      font-size: 6pt;
    }
    
    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1mm;
    }
    
    .signature-item {
      flex: 1;
    }
  </style>
</head>
<body>
  <div class="page">
    ${invoiceCopy}
    ${invoiceCopy}
  </div>
</body>
</html>
  `
}

function generateInvoiceCopyHTML(data: InvoiceData): string {
  const branchCode = data.branchCode || 'K000'
  const branchName = data.branchName || 'EVERCOLD FOOD MCH'

  // Calculate totals
  let totalWithoutVAT = 0
  let totalVAT = 0
  let totalWithVAT = 0

  const itemsHTML = data.items.map((item, index) => {
    const subtotal = item.quantity * item.unitPrice
    const vatRate = (item.vatRate || 0) * 100
    const vatAmount = subtotal * (item.vatRate || 0)
    const total = subtotal + vatAmount

    totalWithoutVAT += subtotal
    totalVAT += vatAmount
    totalWithVAT += total

    return `
      <tr>
        <td>${index + 1}</td>
        <td class="left">${item.productName}</td>
        <td class="left">02105001002000000 - Лёд пищевой</td>
        <td>пакет-1 килограмм</td>
        <td class="right">${item.quantity.toFixed(6)}</td>
        <td class="right">${item.unitPrice.toFixed(2)}</td>
        <td class="right">${subtotal.toFixed(2)}</td>
        <td>${vatRate}%</td>
        <td class="right">${vatAmount.toFixed(2)}</td>
        <td class="right">${total.toFixed(2)}</td>
        <td>Собственное производство</td>
      </tr>
    `
  }).join('')

  return `
    <div class="invoice-copy">
      <!-- Header -->
      <div class="header-row title">Счет-фактура</div>
      <div class="header-row">№ ${data.invoiceNumber} от ${formatInvoiceDate(data.invoiceDate)}</div>
      <div class="header-row">${data.contractInfo}</div>
      <div class="header-row">${branchName} ${branchCode} Заказ №${(data as any).orderId || data.invoiceNumber}</div>
      
      <!-- Party Details -->
      <table class="party-table">
        <tr>
          <td class="party-label" style="width: 15%">Поставщик:</td>
          <td style="width: 35%">"EVER COLD" XK</td>
          <td class="party-label" style="width: 15%">Покупатель:</td>
          <td style="width: 35%">"ANGLESEY FOOD" MCHJ</td>
        </tr>
        <tr>
          <td class="party-label">Адрес:</td>
          <td>${data.supplier.address}</td>
          <td class="party-label">Адрес:</td>
          <td>${data.buyer.address}</td>
        </tr>
        <tr>
          <td class="party-label">Идентификационный номер поставщика (ИНН):</td>
          <td>${data.supplier.inn}</td>
          <td class="party-label">Идентификационный номер покупателя (ИНН):</td>
          <td>${data.buyer.inn}</td>
        </tr>
        <tr>
          <td class="party-label">Регистрационный код плательщика НДС:</td>
          <td>${data.supplier.vatCode}</td>
          <td class="party-label">Регистрационный код плательщика НДС:</td>
          <td>${data.buyer.vatCode}</td>
        </tr>
        <tr>
          <td class="party-label">Р/С:</td>
          <td>${data.supplier.bankAccount}</td>
          <td class="party-label">Р/С:</td>
          <td>${data.buyer.bankAccount}</td>
        </tr>
        <tr>
          <td class="party-label">МФО:</td>
          <td>${data.supplier.mfo}</td>
          <td class="party-label">МФО:</td>
          <td>${data.buyer.mfo}</td>
        </tr>
      </table>
      
      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th rowspan="2" style="width: 3%">№</th>
            <th rowspan="2" style="width: 12%">Наименование товаров (услуг)</th>
            <th rowspan="2" style="width: 18%">Идентификационный код и название по Единому электронному национальному каталогу товаров (услуг)</th>
            <th rowspan="2" style="width: 8%">Единица измерения</th>
            <th rowspan="2" style="width: 7%">Количество</th>
            <th rowspan="2" style="width: 7%">Цена</th>
            <th rowspan="2" style="width: 9%">Стоимость поставки</th>
            <th colspan="2" style="width: 12%">НДС</th>
            <th rowspan="2" style="width: 10%">Стоимость поставки с учетом НДС</th>
            <th rowspan="2" style="width: 10%">Происхождение товара</th>
          </tr>
          <tr>
            <th style="width: 6%">Ставка</th>
            <th style="width: 6%">Сумма</th>
          </tr>
          <tr class="column-numbers">
            <td>1</td>
            <td>2</td>
            <td>3</td>
            <td>4</td>
            <td>5</td>
            <td>6</td>
            <td>7</td>
            <td>8</td>
            <td>9</td>
            <td>10</td>
            <td>11</td>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
          <tr class="totals-row">
            <td colspan="6" class="right">Итого:</td>
            <td class="right">${totalWithoutVAT.toFixed(2)}</td>
            <td></td>
            <td class="right">${totalVAT.toFixed(2)}</td>
            <td class="right">${totalWithVAT.toFixed(2)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      
      <!-- Signatures -->
      <div class="signatures">
        <div class="signature-row">
          <div class="signature-item">
            <strong>Руководитель:</strong> NASRITDINOV ZUXRITDIN ERKINOVICH
          </div>
          <div class="signature-item">
            <strong>Руководитель:</strong> XUGO WILLEM XXX
          </div>
        </div>
        <div class="signature-row">
          <div class="signature-item">
            <strong>Главный бухгалтер:</strong> NASRITDINOV ZUXRITDIN ERKINOVICH
          </div>
          <div class="signature-item">
            <strong>Главный бухгалтер:</strong> SHAKIROV TAL'AT TULKUNOVICH
          </div>
        </div>
        <div class="signature-row">
          <div class="signature-item">
            <strong>Товар отпустил:</strong>
          </div>
          <div class="signature-item">
            <strong>Получил:</strong>
          </div>
        </div>
      </div>
    </div>
  `
}
