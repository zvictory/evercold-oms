import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const { orderIds } = await request.json()

    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json({ error: 'No orders selected' }, { status: 400 })
    }

    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
            branch: true,
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    })

    // Create Excel workbook
    const workbook = XLSX.utils.book_new()

    // Orders Summary Sheet
    const summaryData = orders.map((order) => ({
      'Order Number': order.orderNumber,
      'Date': new Date(order.orderDate).toLocaleDateString('en-GB'),
      'Customer': order.customer.name,
      'Customer Code': order.customer.customerCode || '',
      'Status': order.status,
      'Source Type': order.sourceType,
      'Subtotal (сўм)': order.subtotal,
      'VAT (сўм)': order.vatAmount,
      'Total (сўм)': order.totalAmount,
      'Contract Info': order.contractInfo || '',
    }))

    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Orders Summary')

    // Order Items Detail Sheet
    const itemsData: any[] = []
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        itemsData.push({
          'Order Number': order.orderNumber,
          'Order Date': new Date(order.orderDate).toLocaleDateString('en-GB'),
          'Customer': order.customer.name,
          'Branch': item.branch?.branchName || '',
          'Branch Code': item.branch?.branchCode || '',
          'Product': item.productName,
          'SAP Code': item.sapCode || '',
          'Barcode': item.barcode || '',
          'Quantity': item.quantity,
          'Unit': item.product.unit,
          'Unit Price (сўм)': item.unitPrice,
          'Subtotal (сўм)': item.subtotal,
          'VAT Rate (%)': item.vatRate,
          'VAT Amount (сўм)': item.vatAmount,
          'Total (сўм)': item.totalAmount,
        })
      })
    })

    const itemsSheet = XLSX.utils.json_to_sheet(itemsData)
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Order Items')

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const filename = `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export orders' },
      { status: 500 }
    )
  }
}
