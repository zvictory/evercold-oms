import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSchetFakturaPDF } from '@/lib/pdf/generateSchetFakturaPDF';
import { InvoiceData } from '@/lib/excel/invoice-types';
import { INVOICE_CONSTANTS } from '@/lib/excel/invoice-template';
import { validateInvoiceData } from '@/lib/excel/invoice-validation';
import { format } from 'date-fns';

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

    // Generate contract info from stored agreement data or use fallback
    const contractInfo = order.agreementNumber && order.agreementDate
      ? `к договору № ${order.agreementNumber} от ${format(order.agreementDate, 'dd.MM.yyyy')}`
      : (order.contractInfo || 'к договору № 1 от 02.01.2022');

    const invoiceData: InvoiceData = {
      invoiceNumber: order.invoiceNumber || 0,
      invoiceDate: order.orderDate,
      contractInfo,
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

    const dateStr = formatDateForFilename(order.orderDate)
    const customerName = sanitizeCustomerName(order.customer.name)
    const filename = `Invoice_${order.invoiceNumber}_${dateStr}_${customerName}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
