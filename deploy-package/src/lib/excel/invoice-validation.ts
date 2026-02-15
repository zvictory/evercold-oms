import { InvoiceData } from './invoice-types'

/**
 * Validates invoice data before generation to ensure all mandatory fields are present.
 * Throws descriptive errors if validation fails.
 */
export function validateInvoiceData(data: InvoiceData): void {
  // Validate header fields
  if (!data.invoiceNumber || data.invoiceNumber <= 0) {
    throw new Error('Invoice number is required and must be positive')
  }

  if (!data.invoiceDate) {
    throw new Error('Invoice date is required')
  }

  if (!data.contractInfo || data.contractInfo.trim() === '') {
    throw new Error('Contract information is required')
  }

  // Validate supplier information
  if (!data.supplier.name || data.supplier.name.trim() === '') {
    throw new Error('Supplier name is required')
  }

  if (!data.supplier.inn || data.supplier.inn.trim() === '') {
    throw new Error('Supplier INN is required')
  }

  if (!data.supplier.address || data.supplier.address.trim() === '') {
    throw new Error('Supplier address is required')
  }

  if (!data.supplier.vatCode || data.supplier.vatCode.trim() === '') {
    throw new Error('Supplier VAT code is required')
  }

  // Validate buyer information
  if (!data.buyer.name || data.buyer.name.trim() === '') {
    throw new Error('Buyer name is required')
  }

  if (!data.buyer.inn || data.buyer.inn.trim() === '') {
    throw new Error('Buyer INN is required')
  }

  if (!data.buyer.address || data.buyer.address.trim() === '') {
    throw new Error('Buyer address is required')
  }

  if (!data.buyer.vatCode || data.buyer.vatCode.trim() === '') {
    throw new Error('Buyer VAT code is required')
  }

  // Validate items array
  if (!data.items || data.items.length === 0) {
    throw new Error('Invoice must contain at least one item')
  }

  // Validate each item - ALL fields are mandatory for Schet-Faktura
  data.items.forEach((item, index) => {
    const itemNum = index + 1

    if (!item.productName || item.productName.trim() === '') {
      throw new Error(`Item ${itemNum}: Product name is required`)
    }

    if (!item.catalogCode || item.catalogCode.trim() === '') {
      throw new Error(`Item ${itemNum}: Catalog code is required`)
    }

    // Barcode is optional for imported items (may fallback to SAP code or N/A)
    // if (!item.barcode || item.barcode.trim() === '') {
    //   throw new Error(`Item ${itemNum}: Barcode is required`)
    // }

    if (!item.unit || item.unit.trim() === '') {
      throw new Error(`Item ${itemNum}: Unit of measurement is required`)
    }

    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      throw new Error(`Item ${itemNum}: Quantity must be a positive number`)
    }

    if (typeof item.unitPrice !== 'number' || item.unitPrice <= 0) {
      throw new Error(`Item ${itemNum}: Unit price must be a positive number`)
    }

    // VAT rate is optional but must be valid if provided
    if (item.vatRate !== undefined) {
      if (typeof item.vatRate !== 'number' || item.vatRate < 0 || item.vatRate > 1) {
        throw new Error(
          `Item ${itemNum}: VAT rate must be a decimal between 0 and 1 (e.g., 0.12 for 12%)`
        )
      }
    }
  })
}
