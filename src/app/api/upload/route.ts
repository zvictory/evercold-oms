import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { parseExcelFile } from '@/lib/parsers/excel-parser'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const customOrderDateStr = formData.get('customOrderDate') as string | null

    // Extract invoice configuration
    const invoiceStartNumber = parseInt(formData.get('invoiceStartNumber') as string) || 1
    const agreementNumber = formData.get('agreementNumber') as string || "1"
    const agreementDateStr = formData.get('agreementDate') as string || new Date().toISOString().split('T')[0]

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filename = `${Date.now()}_${file.name}`
    const filepath = join(process.cwd(), 'public', 'uploads', filename)

    await writeFile(filepath, buffer)

    const receivedDate = new Date()
    // Parse custom date and time without timezone conversion
    let customOrderDate: Date | null = null
    if (customOrderDateStr) {
      // Format: 2025-12-01T14:30
      const [datePart, timePart] = customOrderDateStr.split('T')
      const [year, month, day] = datePart.split('-').map(Number)

      if (timePart) {
        const [hours, minutes] = timePart.split(':').map(Number)
        customOrderDate = new Date(year, month - 1, day, hours, minutes, 0)
      } else {
        customOrderDate = new Date(year, month - 1, day, 12, 0, 0) // noon if no time
      }
    }
    const parseResult = await parseExcelFile(filepath, receivedDate)

    // Parse agreement date
    const [year, month, day] = agreementDateStr.split('-').map(Number)
    const agreementDate = new Date(year, month - 1, day, 12, 0, 0)

    let ordersCreated = 0
    let ordersSkipped = 0
    let batchId: string | null = null
    let currentInvoiceNumber = invoiceStartNumber

    if (Array.isArray(parseResult)) {
      for (const parsedOrder of parseResult) {
        const result = await createOrder(
          parsedOrder,
          filename,
          receivedDate,
          undefined,
          customOrderDate,
          currentInvoiceNumber,
          agreementNumber,
          agreementDate
        )
        if (result.created) {
          ordersCreated++
          currentInvoiceNumber++
        } else {
          ordersSkipped++
        }
      }
    } else {
      batchId = parseResult.batchId
      for (const parsedOrder of parseResult.orders) {
        const result = await createOrder(
          parsedOrder,
          filename,
          receivedDate,
          batchId,
          customOrderDate,
          currentInvoiceNumber,
          agreementNumber,
          agreementDate
        )
        if (result.created) {
          ordersCreated++
          currentInvoiceNumber++
        } else {
          ordersSkipped++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${ordersCreated} orders${ordersSkipped > 0 ? `, skipped ${ordersSkipped} duplicates` : ''}`,
      ordersCreated,
      ordersSkipped,
      batchId,
      invoiceRange: ordersCreated > 0 ? {
        start: invoiceStartNumber,
        end: invoiceStartNumber + ordersCreated - 1
      } : undefined,
    })
  } catch (error: any) {
    console.error('Upload error:', error)

    // Provide more specific error messages
    let errorMessage = error.message || 'Failed to process file'

    if (error.message?.includes('Customer not found')) {
      errorMessage = 'Customer not found in database. Please ensure the customer exists before importing.'
    } else if (error.message?.includes('Branch not found')) {
      errorMessage = 'One or more branch codes not found. Please verify branch codes match the database.'
    } else if (error.message?.includes('xml2js') || error.message?.includes('parser')) {
      errorMessage = 'Invalid Excel file format. Please ensure the file is a valid .xls or .xlsx file.'
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * Find existing customer or auto-create if not found
 * Tries lookup by exact name first, then by partial match, then creates new customer
 */
async function findOrCreateCustomer(
  customerName: string
): Promise<{ id: string; name: string; hasVat: boolean }> {
  // Try exact match first
  let customer = await prisma.customer.findFirst({
    where: { name: customerName },
    select: {
      id: true,
      name: true,
      hasVat: true,
    },
  })

  if (customer) {
    console.log(`✅ Found existing customer (exact): ${customerName}`)
    return customer
  }

  // Try partial match (contains)
  customer = await prisma.customer.findFirst({
    where: { name: { contains: customerName } },
    select: {
      id: true,
      name: true,
      hasVat: true,
    },
  })

  if (customer) {
    console.log(`✅ Found existing customer (partial): ${customerName} -> ${customer.name}`)
    return customer
  }

  // Auto-create new customer
  const newCustomer = await prisma.customer.create({
    data: {
      name: customerName,
      customerCode: `AUTO-${Date.now()}`,
      hasVat: true, // Default to VAT-enabled
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      hasVat: true,
    },
  })

  console.log(`🆕 Auto-created customer: ${customerName}`)
  return newCustomer
}

/**
 * Find existing branch or auto-create if not found
 * Tries lookup by code first, then by name, then creates new branch
 */
async function findOrCreateBranch(
  customerId: string,
  customerName: string,
  branchCode?: string,
  branchName?: string
): Promise<{ id: string } | null> {
  // If no branch info provided, return null
  if (!branchCode && !branchName) {
    return null
  }

  // Try to find existing branch by code
  if (branchCode) {
    const existing = await prisma.customerBranch.findFirst({
      where: {
        customerId,
        OR: [{ branchCode }, { oldBranchCode: branchCode }],
      },
      select: { id: true },
    })

    if (existing) {
      console.log(`✅ Found existing branch: ${branchCode}`)
      return existing
    }
  }

  // Try to find by name if no code or code lookup failed
  if (branchName) {
    const existing = await prisma.customerBranch.findFirst({
      where: {
        customerId,
        branchName: { contains: branchName },
      },
      select: { id: true },
    })

    if (existing) {
      console.log(`✅ Found existing branch by name: ${branchName}`)
      return existing
    }
  }

  // Auto-create new branch if we have enough info
  if (branchCode || branchName) {
    const newBranch = await prisma.customerBranch.create({
      data: {
        customerId,
        branchCode: branchCode || `AUTO-${Date.now()}`,
        branchName: branchName || branchCode || 'Unnamed Branch',
        fullName: `${customerName} - ${branchName || branchCode || 'Branch'}`,
        isActive: true,
      },
      select: { id: true },
    })

    console.log(
      `🆕 Auto-created branch: ${branchCode || branchName} for ${customerName}`
    )
    return newBranch
  }

  return null
}

async function createOrder(
  parsedOrder: any,
  filename: string,
  receivedDate: Date,
  batchId?: string,
  customOrderDate?: Date | null,
  invoiceNumber?: number,
  agreementNumber?: string,
  agreementDate?: Date
): Promise<{ created: boolean; orderId?: string }> {
  // Check if order already exists
  const existingOrder = await prisma.order.findUnique({
    where: { orderNumber: parsedOrder.orderNumber },
  })

  if (existingOrder) {
    console.log(`Order ${parsedOrder.orderNumber} already exists, skipping`)
    return { created: false }
  }

  // Find or auto-create customer
  const customer = await findOrCreateCustomer(parsedOrder.customerName)

  const branch = await findOrCreateBranch(
    customer.id,
    customer.name,
    parsedOrder.branchCode,
    parsedOrder.branchName
  )

  const email = await prisma.email.create({
    data: {
      receivedDate,
      attachmentFilename: filename,
      processed: true,
      processedAt: new Date(),
    },
  })

  const itemsWithPrices = []
  let orderSubtotal = 0
  let orderVatAmount = 0
  let orderTotalAmount = 0

  for (const item of parsedOrder.items) {
    let product = await prisma.product.findFirst({
      where: {
        OR: [
          { sapCode: item.sapCode },
          { barcode: item.barcode },
          { name: { contains: item.productName } },
        ],
      },
      include: {
        customerPrices: {
          where: {
            customerId: customer.id,
          },
        },
      },
    })

    if (!product) {
      product = await prisma.product.create({
        data: {
          name: item.productName,
          sapCode: item.sapCode,
          barcode: item.barcode,
          unitPrice: item.unitPrice || 0,
          unit: 'ШТ',
          vatRate: item.vatRate || 12,
        },
        include: {
          customerPrices: {
            where: {
              customerId: customer.id,
            },
          },
        },
      })
    }

    let itemBranch = branch
    if (item.branchCode && item.branchCode !== parsedOrder.branchCode) {
      itemBranch = await findOrCreateBranch(
        customer.id,
        customer.name,
        item.branchCode,
        item.branchName
      )
    }

    const customerPrice = product.customerPrices?.[0]?.unitPrice
    const unitPrice = item.unitPrice || customerPrice || product.unitPrice
    const vatRate = customer.hasVat ? (item.vatRate || product.vatRate) : 0
    const subtotal = item.subtotal || item.quantity * unitPrice
    const vatAmount = item.vatAmount || (subtotal * vatRate) / 100
    const totalAmount = item.totalAmount || subtotal + vatAmount

    orderSubtotal += subtotal
    orderVatAmount += vatAmount
    orderTotalAmount += totalAmount

    itemsWithPrices.push({
      item,
      product,
      itemBranch,
      unitPrice,
      vatRate,
      subtotal,
      vatAmount,
      totalAmount,
    })
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: parsedOrder.orderNumber,
      orderDate: customOrderDate || new Date(), // Use custom date or current time
      customerId: customer.id,
      contractInfo: parsedOrder.contractInfo,
      sourceType: parsedOrder.sourceType,
      subtotal: orderSubtotal,
      vatAmount: orderVatAmount,
      totalAmount: orderTotalAmount,
      emailId: email.id,
      batchId,
      invoiceNumber,
      agreementNumber,
      agreementDate,
    },
  })

  for (const itemData of itemsWithPrices) {
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        branchId: itemData.itemBranch?.id,
        productId: itemData.product.id,
        productName: itemData.item.productName,
        barcode: itemData.item.barcode,
        sapCode: itemData.item.sapCode,
        quantity: itemData.item.quantity,
        unitPrice: itemData.unitPrice,
        subtotal: itemData.subtotal,
        vatRate: itemData.vatRate,
        vatAmount: itemData.vatAmount,
        totalAmount: itemData.totalAmount,
      },
    })
  }

  return { created: true, orderId: order.id }
}
