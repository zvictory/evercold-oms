import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TemplateInvoiceFormatter } from '@/lib/excel/template-invoice-formatter';
import { InvoiceData } from '@/lib/excel/invoice-types';
import { INVOICE_CONSTANTS } from '@/lib/excel/invoice-template';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract id from params
    const { id } = await params;
    let order = await prisma.order.findUnique({
      where: { id },
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

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Generate invoice number if not exists
    if (!order.invoiceNumber) {
      const lastInvoice = await prisma.order.findFirst({
        where: { invoiceNumber: { not: null } },
        orderBy: { invoiceNumber: 'desc' },
      });
      const nextInvoiceNumber = (lastInvoice?.invoiceNumber || 0) + 1;

      order = await prisma.order.update({
        where: { id },
        data: { invoiceNumber: nextInvoiceNumber },
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
    }

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

    // Generate Excel using TemplateInvoiceFormatter
    const formatter = new TemplateInvoiceFormatter();
    const buffer = await formatter.generate(invoiceData, branchCode, branchName);

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="schet-faktura-${order.invoiceNumber}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
