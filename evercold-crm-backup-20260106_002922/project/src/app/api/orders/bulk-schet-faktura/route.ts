import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';
import { TemplateInvoiceFormatter } from '@/lib/excel/template-invoice-formatter';
import { InvoiceData } from '@/lib/excel/invoice-types';
import { INVOICE_CONSTANTS } from '@/lib/excel/invoice-template';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'Order IDs are required' }, { status: 400 });
    }

    // Fetch all orders
    let orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
            branch: true,
          },
        },
      },
      orderBy: { orderDate: 'asc' }, // Sort by date for consistent ordering
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }

    // Generate invoice numbers for orders that don't have them
    const ordersNeedingInvoiceNumbers = orders.filter(o => !o.invoiceNumber);

    if (ordersNeedingInvoiceNumbers.length > 0) {
      // Get the last invoice number
      const lastInvoice = await prisma.order.findFirst({
        where: { invoiceNumber: { not: null } },
        orderBy: { invoiceNumber: 'desc' },
      });

      let nextInvoiceNumber = (lastInvoice?.invoiceNumber || 0) + 1;

      // Update orders with invoice numbers
      const updatePromises = ordersNeedingInvoiceNumbers.map(async (order) => {
        const invoiceNumber = nextInvoiceNumber++;
        return prisma.order.update({
          where: { id: order.id },
          data: { invoiceNumber },
          include: {
            customer: true,
            orderItems: {
              include: {
                product: true,
                branch: true,
              },
            },
          },
        });
      });

      const updatedOrders = await Promise.all(updatePromises);

      // Merge updated orders back into the orders array
      orders = orders.map(order => {
        const updated = updatedOrders.find(u => u.id === order.id);
        return updated || order;
      });
    }

    // Create single workbook for all invoices
    const workbook = new ExcelJS.Workbook();
    const formatter = new TemplateInvoiceFormatter(workbook);

    // Prepare invoice data for bulk generation
    const invoices = orders.map(order => {
      // Extract branch data from first order item
      const branch = order.orderItems[0]?.branch;
      const branchCode = branch?.branchCode || '00000';
      const branchName = branch?.branchName || 'Unknown Branch';

      // Map data to InvoiceData format
      const invoiceData: InvoiceData = {
        invoiceNumber: order.invoiceNumber || 0,
        invoiceDate: order.orderDate,
        contractInfo: order.contractInfo || 'к договору № 1 от 02.01.2022',
        branchCode,
        branchName,

        supplier: {
          name: INVOICE_CONSTANTS.SUPPLIER.NAME,
          address: INVOICE_CONSTANTS.SUPPLIER.ADDRESS,
          inn: INVOICE_CONSTANTS.SUPPLIER.INN,
          vatCode: INVOICE_CONSTANTS.SUPPLIER.VAT_CODE,
          bankAccount: INVOICE_CONSTANTS.SUPPLIER.BANK_ACCOUNT,
          mfo: INVOICE_CONSTANTS.SUPPLIER.MFO,
          tg: INVOICE_CONSTANTS.SUPPLIER.TG,
        },

        buyer: {
          name: order.customer.name,
          address: order.customer.headquartersAddress || '',
          inn: order.customer.inn || '',
          vatCode: order.customer.vatRegistrationCode || '',
          bankAccount: order.customer.bankAccount || '',
          mfo: order.customer.mfo || '',
          tg: order.customer.tg || '',
        },

        items: order.orderItems.map(item => {
          // Transform product name for invoice (remove "Ever Cold")
          const invoiceProductName = item.productName.replace(/Ever Cold\s*/gi, '').trim();

          return {
            productName: invoiceProductName,
            catalogCode: INVOICE_CONSTANTS.CATALOG_CODE,
            barcode: item.product?.barcode || item.barcode || '',
            unit: item.product?.unit || 'штук',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate / 100, // Convert 15 to 0.15
          };
        }),
      };

      return { data: invoiceData, branchCode, branchName };
    });

    // Generate all invoices using template formatter
    const buffer = await formatter.generateBulk(invoices);

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="bulk-schet-faktura-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating bulk invoices:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
