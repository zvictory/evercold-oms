export interface InvoiceData {
  invoiceNumber: number
  invoiceDate: Date
  contractInfo: string
  orderId?: string  // System order ID (e.g., "4506545045")

  // Branch information (for template-based invoices)
  branchCode?: string      // e.g., "00053"
  branchName?: string      // e.g., "KorzinkaKeles"

  supplier: {
    name: string
    address: string
    inn: string
    vatCode: string
    bankAccount: string
    mfo: string
    tg: string
  }

  buyer: {
    name: string
    address: string
    inn: string
    vatCode: string
    bankAccount: string
    mfo: string
    tg: string
  }

  items: InvoiceItem[]
}

export interface InvoiceItem {
  productName: string
  catalogCode: string  // "02105001002000000 - Лёд пищевой"
  barcode: string
  unit: string
  quantity: number
  unitPrice: number
  // Calculated fields
  subtotal?: number     // quantity * unitPrice
  vatRate?: number      // 0.15 for 15%
  vatAmount?: number    // subtotal * vatRate
  totalAmount?: number  // subtotal + vatAmount
}
