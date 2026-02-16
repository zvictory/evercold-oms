import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { parsePurchaseOrderFile, extractBranchCode } from '@/lib/parsers/purchase-order-parser';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customOrderDateStr = formData.get('customOrderDate') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}_${file.name}`;
    const filepath = join(process.cwd(), 'public', 'uploads', filename);
    await writeFile(filepath, buffer);

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

    // Parse purchase order file
    const parsedOrders = await parsePurchaseOrderFile(filepath);

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

        // Find or create customer
        // First try to find by name or customerCode
        const potentialCustomerCode = parsedOrder.customerName.substring(0, 20).toUpperCase().replace(/\s+/g, '_');

        let customer = await prisma.customer.findFirst({
          where: {
            OR: [
              { name: { contains: parsedOrder.customerName } },
              { customerCode: potentialCustomerCode },
            ]
          },
          select: {
            id: true,
            name: true,
            customerCode: true,
            hasVat: true,
            taxStatus: true,
          },
        });

        if (!customer) {
          // Create new customer from uploaded file
          customer = await prisma.customer.create({
            data: {
              name: parsedOrder.customerName,
              customerCode: potentialCustomerCode,
              isActive: true,
            },
          });
        }

        // Create order
        const order = await prisma.order.create({
          data: {
            orderNumber: parsedOrder.orderNumber,
            orderDate: customOrderDate || receivedDate,
            customerId: customer.id,
            sourceType: 'DETAILED',
            subtotal: 0, // Will be updated after items
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
            // Find product by material code (SAP code) - must exist
            const product = await prisma.product.findFirst({
              where: { sapCode: item.materialCode },
              include: {
                customerPrices: {
                  where: { customerId: customer.id },
                },
              },
            });

            if (!product) {
              errors.push(`Product not found: ${item.materialCode} - ${item.productDescription}. Please add it to the products list first.`);
              continue;
            }

            // Find or create branch
            let branch = null;
            if (item.branchCode) {
              // First try exact match with branch code (e.g., K023)
              branch = await prisma.customerBranch.findFirst({
                where: {
                  OR: [
                    { branchCode: item.branchCode },
                    { oldBranchCode: item.branchCode },
                  ],
                },
              });

              // If no branch found, create it
              if (!branch) {
                branch = await prisma.customerBranch.create({
                  data: {
                    customerId: customer.id,
                    branchCode: item.branchCode,
                    branchName: item.branchName || item.branchCode,
                    fullName: `${customer.name} - ${item.branchName || item.branchCode}`,
                    isActive: true,
                  },
                });
              }
            } else if (item.branchName) {
              // Try to find by name
              const branchCode = extractBranchCode(item.branchName);
              if (branchCode) {
                branch = await prisma.customerBranch.findFirst({
                  where: {
                    OR: [
                      { branchName: { contains: branchCode } },
                      { branchCode: { contains: branchCode } },
                      { oldBranchCode: { contains: branchCode } },
                    ],
                  },
                });

                // If no branch found, create it
                if (!branch) {
                  branch = await prisma.customerBranch.create({
                    data: {
                      customerId: customer.id,
                      branchCode: branchCode,
                      branchName: item.branchName,
                      fullName: `${customer.name} - ${item.branchName}`,
                      isActive: true,
                    },
                  });
                }
              }
            }

            // Calculate prices
            const customerPrice = product.customerPrices?.[0]?.unitPrice;
            const unitPrice = customerPrice || product.unitPrice || 0;
            const vatRate = customer.taxStatus === 'VAT_PAYER' ? (product.vatRate || 12) : 0;
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
      message: `Successfully processed ${ordersCreated} orders with ${itemsCreated} items${
        ordersSkipped > 0 ? `, skipped ${ordersSkipped} duplicates` : ''
      }`,
      ordersCreated,
      ordersSkipped,
      itemsCreated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process file' },
      { status: 500 }
    );
  }
}
