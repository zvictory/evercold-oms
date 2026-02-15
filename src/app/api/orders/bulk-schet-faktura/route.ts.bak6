import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSchetFakturaPDF, generateBulkSchetFakturaPDF } from '@/lib/pdf/generateSchetFakturaPDF';
import { InvoiceData } from '@/lib/excel/invoice-types';
import { INVOICE_CONSTANTS } from '@/lib/excel/invoice-template';
import { validateInvoiceData } from '@/lib/excel/invoice-validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderIds, separate } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'Order IDs are required' }, { status: 400 });
    }

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
      orderBy: { orderDate: 'asc' },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }

    const ordersNeedingInvoiceNumbers = orders.filter(o => !o.invoiceNumber);

    if (ordersNeedingInvoiceNumbers.length > 0) {
      const lastInvoice = await prisma.order.findFirst({
        where: { invoiceNumber: { not: null } },
        orderBy: { invoiceNumber: 'desc' },
      });

      let nextInvoiceNumber = (lastInvoice?.invoiceNumber || 0) + 1;

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
      orders = orders.map(order => {
        const updated = updatedOrders.find(u => u.id === order.id);
        return updated || order;
      });
    }

    // Collect all invoice data
    const allInvoiceData: InvoiceData[] = [];

    for (const order of orders) {
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
      allInvoiceData.push(invoiceData);
    }

    // If separate files requested, create ZIP
    if (separate) {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < allInvoiceData.length; i++) {
        const invoiceData = allInvoiceData[i];
        const buffer = await generateSchetFakturaPDF(invoiceData);
        const filename = `schet-faktura-${invoiceData.orderId || invoiceData.invoiceNumber}.pdf`;
        zip.file(filename, buffer);
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      return new NextResponse(zipBuffer as any, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="schet-faktura-${new Date().toISOString().split('T')[0]}.zip"`,
        },
      });
    }

    // Otherwise, generate multi-page PDF with all invoices
    const buffer = await generateBulkSchetFakturaPDF(allInvoiceData);

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bulk-schet-faktura-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating bulk invoices:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
