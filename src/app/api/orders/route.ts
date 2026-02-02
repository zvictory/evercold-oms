import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://zafar@localhost:5432/evercold_crm',
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse filters from query params
    const status = searchParams.get('status')
    const branch = searchParams.get('branch')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build SQL query with dynamic filters
    let query = `
      SELECT
        o.id,
        o."orderNumber",
        o.status,
        o."totalAmount",
        o."orderDate",
        o."sourceType",
        c.name as "customerName",
        COUNT(oi.id) as "itemCount",
        COALESCE(SUM(oi.quantity), 0) as "totalQuantity",
        COALESCE(SUM(CASE WHEN oi."sapCode" = '107000001-00001' THEN oi.quantity ELSE 0 END), 0) as "ice3kg",
        COALESCE(SUM(CASE WHEN oi."sapCode" = '107000001-00006' THEN oi.quantity ELSE 0 END), 0) as "ice1kg",
        COALESCE(cb."branchCode", 'Multiple') as "branchCode",
        COALESCE(cb."branchName", 'Multiple Branches') as "branchName"
      FROM "Order" o
      LEFT JOIN "Customer" c ON o."customerId" = c.id
      LEFT JOIN "OrderItem" oi ON o.id = oi."orderId"
      LEFT JOIN "CustomerBranch" cb ON oi."branchId" = cb.id
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    // Filter by status
    if (status && status !== 'ALL') {
      query += ` AND o.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    // Filter by branch
    if (branch) {
      query += ` AND (cb."branchCode" ILIKE $${paramIndex} OR cb."branchName" ILIKE $${paramIndex})`
      params.push(`%${branch}%`)
      paramIndex++
    }

    // Filter by search (order number or customer name)
    if (search) {
      query += ` AND (o."orderNumber" ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    // Filter by date range
    if (dateFrom) {
      query += ` AND o."orderDate" >= $${paramIndex}`
      params.push(new Date(dateFrom))
      paramIndex++
    }

    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      query += ` AND o."orderDate" <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    // Group by and order
    query += `
      GROUP BY o.id, c.name, cb."branchCode", cb."branchName"
      ORDER BY o."orderDate" DESC
    `

    const result = await pool.query(query, params)

    // Transform data for frontend
    const transformedOrders = result.rows.map((row: any) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      branch: row.branchName,
      branchCode: row.branchCode,
      customer: row.customerName,
      weight: Math.round(row.totalQuantity),
      amount: row.totalAmount,
      status: row.status,
      date: new Date(row.orderDate).toISOString().split('T')[0],
      sourceType: row.sourceType,
      itemCount: parseInt(row.itemCount),
      products: {
        ice3kg: parseInt(row.ice3kg),
        ice1kg: parseInt(row.ice1kg),
      },
    }))

    return NextResponse.json({
      orders: transformedOrders,
      total: transformedOrders.length,
    })
  } catch (error: any) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.customerId || !body.branchId || !body.items?.length) {
      return NextResponse.json(
        { error: 'Customer, branch, and items are required' },
        { status: 400 }
      )
    }

    // Get the last order number to generate the next one
    const lastOrderResult = await pool.query(
      `SELECT "orderNumber" FROM "Order" ORDER BY "createdAt" DESC LIMIT 1`
    )
    const orderNumber = generateOrderNumber(lastOrderResult.rows[0]?.orderNumber)

    // Calculate totals for each item
    const items = body.items.map((item: any) => {
      const subtotal = item.quantity * item.price
      const vatAmount = subtotal * (item.vatRate / 100)
      const totalAmount = subtotal + vatAmount

      return {
        branchId: body.branchId,
        productId: item.productId,
        productName: item.productName || '',
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal,
        vatRate: item.vatRate,
        vatAmount,
        totalAmount,
        sapCode: item.sapCode || '',
        barcode: item.barcode || ''
      }
    })

    // Calculate order totals
    const subtotal = items.reduce((sum: number, i: any) => sum + i.subtotal, 0)
    const vatAmount = items.reduce((sum: number, i: any) => sum + i.vatAmount, 0)
    const totalAmount = items.reduce((sum: number, i: any) => sum + i.totalAmount, 0)

    // Create order with items (simple implementation - note: real implementation should use transactions)
    const orderResult = await pool.query(
      `INSERT INTO "Order" (id, "orderNumber", "customerId", "orderDate", "sourceType", status, subtotal, "vatAmount", "totalAmount", notes, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, "orderNumber", status, "totalAmount", "orderDate", "sourceType"`,
      [orderNumber, body.customerId, new Date(body.orderDate), 'DETAILED', 'NEW', subtotal, vatAmount, totalAmount, body.notes || '']
    )

    const orderId = orderResult.rows[0].id

    // Insert order items
    for (const item of items) {
      await pool.query(
        `INSERT INTO "OrderItem" (id, "orderId", "branchId", "productId", "productName", quantity, "unitPrice", subtotal, "vatRate", "vatAmount", "totalAmount", "sapCode", barcode, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
        [orderId, item.branchId, item.productId, item.productName, item.quantity, item.unitPrice, item.subtotal, item.vatRate, item.vatAmount, item.totalAmount, item.sapCode, item.barcode]
      )
    }

    return NextResponse.json({
      id: orderId,
      orderNumber: orderNumber,
      status: 'NEW',
      totalAmount: totalAmount,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

// Helper function to generate sequential order numbers
function generateOrderNumber(lastOrderNumber?: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`

  if (lastOrderNumber?.startsWith(`ORD-${dateStr}`)) {
    const lastSeq = parseInt(lastOrderNumber.split('-')[2])
    const nextSeq = (lastSeq + 1).toString().padStart(4, '0')
    return `ORD-${dateStr}-${nextSeq}`
  }

  return `ORD-${dateStr}-0001`
}
