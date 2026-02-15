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

  // EDO metadata (optional - only when EDO sync is active)
  edoMetadata?: {
    didoxId?: string           // Didox.uz document ID
    roumingId?: string          // Rouming.uz document ID
    documentType?: string       // e.g., "Стандартный"
    sentStamp?: {
      number: string            // e.g., "№2022895979"
      timestamp: Date           // 2025.12.09 13:58:52
      operatorName: string      // NASRITDINOV ZUXRITDIN ERKINOVICH
      operatorSystem: string    // didox.uz
      ipAddress: string         // 89.236.232.33
    }
    confirmedStamp?: {
      number: string            // e.g., "№2020567907"
      timestamp: Date           // 2025.12.09 14:36:57
      operatorName: string      // USMANOV AZIZBEK MAMUR O'G'LI
      operatorSystem: string    // app.hippo.uz
      ipAddress: string         // 89.249.60.188
    }
    qrCodeData?: string         // QR code content (URL or data)
  }
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
