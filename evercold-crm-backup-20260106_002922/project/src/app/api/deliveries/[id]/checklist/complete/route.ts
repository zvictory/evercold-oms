import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/deliveries/[id]/checklist/complete
 * Submit completed delivery checklist with item-level verification
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deliveryId } = await params;

    const body = await request.json();
    const {
      deliveryItems, // NEW: item-level delivered/rejected quantities
      photos,
      signatureUrl,
      recipientName,
      issueCategory,
      notes,
    } = body;

    // Validate signature is present
    if (!signatureUrl) {
      return NextResponse.json(
        { error: 'Signature is required' },
        { status: 400 }
      );
    }

    // Validate delivery items
    if (!deliveryItems || deliveryItems.length === 0) {
      return NextResponse.json(
        { error: 'Delivery items are required' },
        { status: 400 }
      );
    }

    // Validate quantities
    for (const item of deliveryItems) {
      if (item.deliveredQuantity + item.rejectedQuantity !== item.orderedQuantity) {
        return NextResponse.json(
          { error: `Сумма доставленного и отклоненного должна равняться заказанному для ${item.productName}` },
          { status: 400 }
        );
      }

      if (item.deliveredQuantity < 0 || item.rejectedQuantity < 0) {
        return NextResponse.json(
          { error: `Количество не может быть отрицательным для ${item.productName}` },
          { status: 400 }
        );
      }

      if (item.rejectedQuantity > 0 && !item.rejectionReason) {
        return NextResponse.json(
          { error: `Укажите причину отклонения для ${item.productName}` },
          { status: 400 }
        );
      }

      if (item.rejectionReason === 'OTHER' && !item.rejectionNotes?.trim()) {
        return NextResponse.json(
          { error: `Опишите причину отклонения для ${item.productName}` },
          { status: 400 }
        );
      }
    }

    // Get existing delivery
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        checklist: true,
        order: {
          include: {
            orderItems: true,
          },
        },
        routeStop: true,
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Determine delivery status based on rejections
    const hasRejections = deliveryItems.some((i: any) => i.rejectedQuantity > 0);
    const allRejected = deliveryItems.every((i: any) => i.deliveredQuantity === 0);
    const hasIssue = !!issueCategory;

    let deliveryStatus: 'DELIVERED' | 'PARTIALLY_DELIVERED' | 'FAILED';
    if (hasIssue || allRejected) {
      deliveryStatus = 'FAILED';
    } else if (hasRejections) {
      deliveryStatus = 'PARTIALLY_DELIVERED';
    } else {
      deliveryStatus = 'DELIVERED';
    }

    // Create DeliveryItem records
    await prisma.deliveryItem.createMany({
      data: deliveryItems.map((item: any) => ({
        deliveryId,
        orderItemId: item.orderItemId,
        productId: item.productId,
        productName: item.productName,
        orderedQuantity: item.orderedQuantity,
        deliveredQuantity: item.deliveredQuantity,
        rejectedQuantity: item.rejectedQuantity,
        rejectionReason: item.rejectionReason || null,
        rejectionNotes: item.rejectionNotes || null,
        unit: item.unit,
        verified: true,
      })),
    });

    // Update or create checklist
    const checklist = await prisma.deliveryChecklist.upsert({
      where: { deliveryId },
      update: {
        itemsVerified: deliveryItems.every((item: any) => item.verified),
        verifiedItems: JSON.stringify(deliveryItems), // Keep for backward compatibility
        signatureUrl,
        signedBy: recipientName,
        signedAt: new Date(),
        issueCategory: issueCategory || null,
        notes: notes || null,
      },
      create: {
        deliveryId,
        itemsVerified: deliveryItems.every((item: any) => item.verified),
        verifiedItems: JSON.stringify(deliveryItems),
        signatureUrl,
        signedBy: recipientName,
        signedAt: new Date(),
        issueCategory: issueCategory || null,
        notes: notes || null,
      },
    });

    // Add photos
    if (photos && photos.length > 0) {
      await Promise.all(
        photos.map((photo: any) =>
          prisma.deliveryPhoto.create({
            data: {
              checklistId: checklist.id,
              photoUrl: photo.url,
              photoType: photo.type || null,
              caption: photo.caption || null,
            },
          })
        )
      );
    }

    // Update delivery status
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: deliveryStatus,
        deliveryTime: new Date(),
      },
    });

    // Update order status
    let orderStatus: 'PARTIAL' | 'COMPLETED' | undefined;
    if (deliveryStatus === 'FAILED') {
      // Keep current status for failed deliveries
      orderStatus = undefined;
    } else if (deliveryStatus === 'PARTIALLY_DELIVERED') {
      orderStatus = 'PARTIAL';
    } else {
      orderStatus = 'COMPLETED';
    }

    if (orderStatus && delivery.order) {
      await prisma.order.update({
        where: { id: delivery.order.id },
        data: { status: orderStatus },
      });
    }

    // Update RouteStop status if delivery is part of a route
    if (delivery.routeStop) {
      const hasIssues = hasIssue || allRejected;

      await prisma.routeStop.update({
        where: { id: delivery.routeStop.id },
        data: {
          status: hasIssues ? 'FAILED' : 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Auto-advance to next stop if completed successfully
      if (!hasIssues) {
        const nextStop = await prisma.routeStop.findFirst({
          where: {
            routeId: delivery.routeStop.routeId,
            status: 'PENDING',
            stopNumber: {
              gt: delivery.routeStop.stopNumber,
            },
          },
          orderBy: {
            stopNumber: 'asc',
          },
        });

        if (nextStop) {
          await prisma.routeStop.update({
            where: { id: nextStop.id },
            data: { status: 'EN_ROUTE' },
          });
        }
      }
    }

    // Log rejections for admin notification (future enhancement)
    if (hasRejections) {
      console.log(
        `[PARTIAL DELIVERY] Delivery ${deliveryId}: ${deliveryItems.filter((i: any) => i.rejectedQuantity > 0).length} items rejected`
      );
    }

    return NextResponse.json(
      {
        success: true,
        deliveryStatus,
        checklist: {
          id: checklist.id,
          itemsVerified: checklist.itemsVerified,
          photosCount: photos?.length || 0,
          signedBy: recipientName,
          deliveredItems: deliveryItems.filter((i: any) => i.deliveredQuantity > 0).length,
          rejectedItems: deliveryItems.filter((i: any) => i.rejectedQuantity > 0).length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error completing checklist:', error);
    return NextResponse.json(
      { error: 'Failed to complete checklist', details: (error as Error).message },
      { status: 500 }
    );
  }
}
