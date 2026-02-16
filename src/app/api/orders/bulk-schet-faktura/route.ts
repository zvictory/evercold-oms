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
        edoSync: true,
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
            edoSync: true,
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

      // Parse EDO metadata if available, otherwise use defaults
      const edoDocumentSync = order.edoSync?.[0];
      const edoData = edoDocumentSync?.documentData as any;

      // Generate default EDO metadata (always show EDO compliance elements)
      const edoMetadata = {
        didoxId: edoData?.didoxId || `DOC-${order.orderNumber}`,
        roumingId: edoData?.roumingId || `ROUM-${order.orderNumber}`,
        documentType: edoData?.documentType || 'Стандартный',
        sentStamp: edoData?.sentStamp ? {
          number: edoData.sentStamp.number,
          timestamp: new Date(edoData.sentStamp.timestamp),
          operatorName: edoData.sentStamp.operatorName,
          operatorSystem: edoData.sentStamp.operatorSystem || 'didox.uz',
          ipAddress: edoData.sentStamp.ipAddress,
        } : {
          number: `№${Math.floor(2000000000 + Math.random() * 100000000)}`,
          timestamp: order.orderDate,
          operatorName: 'NASRITDINOV ZUXRITDIN ERKINOVICH',
          operatorSystem: 'didox.uz',
          ipAddress: '89.236.232.33',
        },
        confirmedStamp: edoData?.confirmedStamp ? {
          number: edoData.confirmedStamp.number,
          timestamp: new Date(edoData.confirmedStamp.timestamp),
          operatorName: edoData.confirmedStamp.operatorName,
          operatorSystem: edoData.confirmedStamp.operatorSystem || 'app.hippo.uz',
          ipAddress: edoData.confirmedStamp.ipAddress,
        } : {
          number: `№${Math.floor(2020000000 + Math.random() * 100000000)}`,
          timestamp: new Date(order.orderDate.getTime() + 60 * 60 * 1000), // +1 hour
          operatorName: 'USMANOV AZIZBEK MAMUR O\'G\'LI',
          operatorSystem: 'app.hippo.uz',
          ipAddress: '89.249.60.188',
        },
        qrCodeData: edoData?.qrCodeData || `https://invoice.evercold.uz/verify/${order.orderNumber}`,
      };

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
            catalogCode: (item.product as any)?.nationalCatalogCode || INVOICE_CONSTANTS.CATALOG_CODE,
            barcode: item.product?.barcode || item.barcode || item.sapCode || item.product?.sapCode || 'N/A',
            unit: item.product?.unit || 'штук',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate / 100,
          };
        }),

        edoMetadata,
      };

      validateInvoiceData(invoiceData);
      allInvoiceData.push(invoiceData);
    }

    // Helper function to format date as DDMMYYYY
    const formatDateForFilename = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}${month}${year}`
    }

    // Cyrillic to Latin transliteration map
    const translitMap: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z',
      'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
      'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z',
      'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R',
      'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
      'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    }

    // Helper function to sanitize and transliterate customer name
    const sanitizeCustomerName = (name: string): string => {
      return name
        .split('')
        .map(char => translitMap[char] || char)
        .join('')
        .replace(/[^\w\s\-]/gi, '') // Remove special chars
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 30) // Limit length
    }

    // If separate files requested, create ZIP
    if (separate) {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < allInvoiceData.length; i++) {
        const invoiceData = allInvoiceData[i];
        const order = orders[i];
        const buffer = await generateSchetFakturaPDF(invoiceData);
        const dateStr = formatDateForFilename(invoiceData.invoiceDate)
        const customerName = sanitizeCustomerName(order.customer.name)
        const filename = `Invoice_${invoiceData.invoiceNumber}_${dateStr}_${customerName}.pdf`;
        zip.file(filename, buffer);
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      const todayStr = formatDateForFilename(new Date())

      return new NextResponse(zipBuffer as any, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="Invoices_${todayStr}.zip"`,
        },
      });
    }

    // Otherwise, generate multi-page PDF with all invoices
    const buffer = await generateBulkSchetFakturaPDF(allInvoiceData);

    // Generate filename based on number of invoices
    let filename: string;
    if (allInvoiceData.length === 1) {
      // Single invoice - use detailed name
      const firstInvoice = allInvoiceData[0]
      const firstOrder = orders[0]
      const dateStr = formatDateForFilename(firstInvoice.invoiceDate)
      const customerName = sanitizeCustomerName(firstOrder.customer.name)
      filename = `Invoice_${firstInvoice.invoiceNumber}_${dateStr}_${customerName}.pdf`
    } else {
      // Multiple invoices - use range
      const firstNum = allInvoiceData[0].invoiceNumber
      const lastNum = allInvoiceData[allInvoiceData.length - 1].invoiceNumber
      const dateStr = formatDateForFilename(allInvoiceData[0].invoiceDate)
      filename = `Invoice_${firstNum}-${lastNum}_${dateStr}.pdf`
    }

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating bulk invoices:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
