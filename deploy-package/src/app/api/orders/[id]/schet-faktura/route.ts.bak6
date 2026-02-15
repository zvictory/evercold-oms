import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSchetFakturaPDF } from '@/lib/pdf/generateSchetFakturaPDF';
import { InvoiceData } from '@/lib/excel/invoice-types';
import { INVOICE_CONSTANTS } from '@/lib/excel/invoice-template';
import { validateInvoiceData } from '@/lib/excel/invoice-validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const branch = order.orderItems[0]?.branch;
    const branchCode = branch?.branchCode || '00000';
    const branchName = branch?.branchName || 'Unknown Branch';

    const invoiceData: InvoiceData = {
      invoiceNumber: order.invoiceNumber || 0,
      invoiceDate: order.orderDate,
      contractInfo: order.contractInfo || 'к договору № 1 от 02.01.2022',
      orderId: order.orderNumber,
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
        name: order.customer.name || INVOICE_CONSTANTS.DEFAULT_BUYER.NAME,
        address: order.customer.headquartersAddress || INVOICE_CONSTANTS.DEFAULT_BUYER.ADDRESS,
        inn: order.customer.inn || INVOICE_CONSTANTS.DEFAULT_BUYER.INN,
        vatCode: order.customer.vatRegistrationCode || INVOICE_CONSTANTS.DEFAULT_BUYER.VAT_CODE,
        bankAccount: order.customer.bankAccount || INVOICE_CONSTANTS.DEFAULT_BUYER.BANK_ACCOUNT,
        mfo: order.customer.mfo || INVOICE_CONSTANTS.DEFAULT_BUYER.MFO,
        tg: order.customer.tg || INVOICE_CONSTANTS.DEFAULT_BUYER.TG,
      },

      items: order.orderItems.map(item => {
        const invoiceProductName = item.productName.replace(/Ever Cold\s*/gi, '').trim();

        return {
          productName: invoiceProductName,
          catalogCode: INVOICE_CONSTANTS.CATALOG_CODE,
          barcode: item.product?.barcode || item.barcode || '',
          unit: item.product?.unit || 'штук',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate / 100,
        };
      }),
    };

    validateInvoiceData(invoiceData);

    const buffer = await generateSchetFakturaPDF(invoiceData);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="schet-faktura-${order.invoiceNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
