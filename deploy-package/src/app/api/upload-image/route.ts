import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { parseImageFile } from '@/lib/parsers/image-parser';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customOrderDateStr = formData.get('customOrderDate') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (PNG, JPG, BMP, TIFF)' },
        { status: 400 }
      );
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}_${file.name}`;
    const filepath = join(process.cwd(), 'public', 'uploads', filename);
    await writeFile(filepath, buffer);

    console.log('Processing image with OCR...');

    // Parse custom date
    const receivedDate = new Date();
    let customOrderDate: Date | null = null;
    if (customOrderDateStr) {
      const [datePart, timePart] = customOrderDateStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      if (timePart) {
        const [hours, minutes] = timePart.split(':').map(Number);
        customOrderDate = new Date(year, month - 1, day, hours, minutes, 0);
      } else {
        customOrderDate = new Date(year, month - 1, day, 12, 0, 0);
      }
    }

    // Parse image using OCR
    let parsedOrders;
    try {
      parsedOrders = await parseImageFile(filepath);
      console.log(`OCR extracted ${parsedOrders.length} orders`);
    } catch (ocrError: any) {
      console.error('OCR error:', ocrError);
      return NextResponse.json(
        {
          error: `Failed to extract data from image: ${ocrError.message}`,
          suggestion: 'Please ensure the image is clear and contains the table with columns: Документ закупки, Материал, Краткий текст, Имя завода, Количество заказа',
        },
        { status: 400 }
      );
    }

    let ordersCreated = 0;
    let ordersSkipped = 0;
    let itemsCreated = 0;
    let errors: string[] = [];

    // Create email record
    const email = await prisma.email.create({
      data: {
        receivedDate,
        attachmentFilename: filename,
        processed: true,
        processedAt: new Date(),
      },
    });

    // Process each order
    for (const parsedOrder of parsedOrders) {
      try {
        // Check if order already exists
        const existingOrder = await prisma.order.findUnique({
          where: { orderNumber: parsedOrder.orderNumber },
        });

        if (existingOrder) {
          ordersSkipped++;
          continue;
        }

        // Find customer (default to Korzinka)
        const customer = await prisma.customer.findFirst({
          where: { name: { contains: parsedOrder.customerName } },
        });

        if (!customer) {
          errors.push(`Customer not found: ${parsedOrder.customerName}`);
          continue;
        }

        // Create order
        const order = await prisma.order.create({
          data: {
            orderNumber: parsedOrder.orderNumber,
            orderDate: customOrderDate || receivedDate,
            customerId: customer.id,
            sourceType: 'DETAILED',
            subtotal: 0,
            vatAmount: 0,
            totalAmount: 0,
            emailId: email.id,
          },
        });

        let orderSubtotal = 0;
        let orderVatAmount = 0;
        let orderTotalAmount = 0;

        // Process each item
        for (const item of parsedOrder.items) {
          try {
            // Find or create product by material code (SAP code)
            let product = await prisma.product.findFirst({
              where: { sapCode: item.materialCode },
              include: {
                customerPrices: {
                  where: { customerId: customer.id },
                },
              },
            });

            if (!product) {
              // Create new product
              product = await prisma.product.create({
                data: {
                  name: item.productDescription,
                  sapCode: item.materialCode,
                  unitPrice: 0,
                  unit: 'ШТ',
                  vatRate: 12,
                },
                include: {
                  customerPrices: {
                    where: { customerId: customer.id },
                  },
                },
              });
            }

            // Find branch
            let branch = null;
            if (item.branchName) {
              // Extract branch code (remove "Korzinka - " prefix)
              const branchCode = item.branchName.replace(/^Korzinka\s*-\s*/i, '').trim();
              branch = await prisma.customerBranch.findFirst({
                where: {
                  OR: [
                    { branchName: { contains: branchCode } },
                    { branchCode: { contains: branchCode } },
                    { oldBranchCode: { contains: branchCode } },
                  ],
                },
              });
            }

            // Calculate prices
            const customerPrice = product.customerPrices?.[0]?.unitPrice;
            const unitPrice = customerPrice || product.unitPrice || 0;
            const vatRate = product.vatRate || 12;
            const subtotal = item.quantity * unitPrice;
            const vatAmount = (subtotal * vatRate) / 100;
            const totalAmount = subtotal + vatAmount;

            orderSubtotal += subtotal;
            orderVatAmount += vatAmount;
            orderTotalAmount += totalAmount;

            // Create order item
            await prisma.orderItem.create({
              data: {
                orderId: order.id,
                branchId: branch?.id,
                productId: product.id,
                productName: item.productDescription,
                sapCode: item.materialCode,
                quantity: item.quantity,
                unitPrice,
                subtotal,
                vatRate,
                vatAmount,
                totalAmount,
              },
            });

            itemsCreated++;
          } catch (itemError: any) {
            errors.push(`Error processing item ${item.materialCode}: ${itemError.message}`);
          }
        }

        // Update order totals
        await prisma.order.update({
          where: { id: order.id },
          data: {
            subtotal: orderSubtotal,
            vatAmount: orderVatAmount,
            totalAmount: orderTotalAmount,
          },
        });

        ordersCreated++;
      } catch (orderError: any) {
        errors.push(`Error processing order ${parsedOrder.orderNumber}: ${orderError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${ordersCreated} orders with ${itemsCreated} items from image${
        ordersSkipped > 0 ? `, skipped ${ordersSkipped} duplicates` : ''
      }`,
      ordersCreated,
      ordersSkipped,
      itemsCreated,
      extractedOrders: parsedOrders.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}
