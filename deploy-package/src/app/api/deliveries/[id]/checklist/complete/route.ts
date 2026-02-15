import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, OrderStatus, DeliveryStatus, RejectionReason, DriverStatus, VehicleStatus } from '@prisma/client';
import { requireDriver, DriverAuthError, handleDriverAuthError } from '@/lib/driverAuth';

interface DeliveryItem {
  orderItemId: string;
  productId: string;
  productName: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  rejectedQuantity: number;
  rejectionReason?: string;
  rejectionNotes?: string;
  unit: string;
  verified: boolean;
}

interface Photo {
  url: string;
  photoType: string;
  caption?: string;
}

interface DeliveryChecklistBody {
  deliveryItems: DeliveryItem[];
  photos: Photo[];
  signatureUrl: string;
  recipientName: string;
  issueCategory?: string;
  notes?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDriver(request);
    const { id: deliveryId } = await params;
    const body = (await request.json()) as DeliveryChecklistBody;

    // Validate input
    if (!deliveryId || !body.deliveryItems || !body.signatureUrl || !body.recipientName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch the delivery with its order and route information
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: true,
        routeStop: true,
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { success: false, error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Verify driver owns this delivery
    if (delivery.driverId !== session.driver.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Delivery belongs to another driver' },
        { status: 403 }
      );
    }

    // Determine delivery status based on items
    const hasIssueCategory = !!body.issueCategory;
    const allItemsRejected = body.deliveryItems.every((item) => item.rejectedQuantity === item.orderedQuantity);
    const someItemsRejected = body.deliveryItems.some((item) => item.rejectedQuantity > 0);

    let deliveryStatus: 'DELIVERED' | 'PARTIALLY_DELIVERED' | 'FAILED';

    if (hasIssueCategory || allItemsRejected) {
      deliveryStatus = 'FAILED';
    } else if (someItemsRejected) {
      deliveryStatus = 'PARTIALLY_DELIVERED';
    } else {
      deliveryStatus = 'DELIVERED';
    }

    // Use transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create DeliveryItem records
      await tx.deliveryItem.createMany({
        data: body.deliveryItems.map((item) => ({
          deliveryId,
          orderItemId: item.orderItemId,
          productId: item.productId,
          productName: item.productName,
          orderedQuantity: item.orderedQuantity,
          deliveredQuantity: item.deliveredQuantity,
          rejectedQuantity: item.rejectedQuantity,
          rejectionReason: item.rejectionReason as RejectionReason,
          rejectionNotes: item.rejectionNotes || null,
          unit: item.unit,
          verified: item.verified,
        })),
      });

      // 2. Create or update DeliveryChecklist
      const checklist = await tx.deliveryChecklist.upsert({
        where: { deliveryId },
        create: {
          deliveryId,
          itemsVerified: true,
          signatureUrl: body.signatureUrl,
          signedBy: body.recipientName,
          signedAt: new Date(),
          issueCategory: body.issueCategory || null,
          notes: body.notes || null,
        },
        update: {
          itemsVerified: true,
          signatureUrl: body.signatureUrl,
          signedBy: body.recipientName,
          signedAt: new Date(),
          issueCategory: body.issueCategory || null,
          notes: body.notes || null,
        },
      });

      // 3. Create DeliveryPhoto records
      if (body.photos.length > 0) {
        await tx.deliveryPhoto.createMany({
          data: body.photos.map((photo) => ({
            checklistId: checklist.id,
            photoUrl: photo.url,
            photoType: photo.photoType,
            caption: photo.caption || null,
          })),
        });
      }

      // 4. Update Delivery status
      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: deliveryStatus,
          deliveryTime: new Date(),
        },
      });

      // 5. Update Order status based on delivery status
      let orderStatus: OrderStatus; // Use OrderStatus enum

      if (deliveryStatus === DeliveryStatus.DELIVERED) {
        orderStatus = OrderStatus.COMPLETED;
      } else if (deliveryStatus === DeliveryStatus.PARTIALLY_DELIVERED) {
        orderStatus = OrderStatus.PARTIAL;
      } else {
        // For FAILED, keep the current order status
        orderStatus = delivery.order.status; // No need for 'as any' if types are aligned
      }

      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: orderStatus },
      });

      // 6. Update RouteStop status if part of a route
      if (delivery.routeStop) {
        const routeStopStatus = deliveryStatus === 'FAILED' ? 'FAILED' : 'COMPLETED';
        await tx.routeStop.update({
          where: { id: delivery.routeStop.id },
          data: { status: routeStopStatus, completedAt: new Date() },
        });

        // 7. Auto-advance to next stop (if not failed)
        if (deliveryStatus !== 'FAILED') {
          const nextStop = await tx.routeStop.findFirst({
            where: {
              routeId: delivery.routeStop.routeId,
              stopNumber: delivery.routeStop.stopNumber + 1,
            },
          });

          if (nextStop) {
            await tx.routeStop.update({
              where: { id: nextStop.id },
              data: { status: 'EN_ROUTE' },
            });
          }
        }
      }

      // 8. Update Vehicle status (if all deliveries in route are complete or if standalone)
      if (!delivery.routeStop) {
        // Standalone delivery - mark driver and vehicle as available
        if (delivery.driverId) {
          await tx.driver.update({
            where: { id: delivery.driverId! },
            data: { status: DriverStatus.ACTIVE },
          });
        }
        if (delivery.vehicleId) {
          await tx.vehicle.update({
            where: { id: delivery.vehicleId! },
            data: { status: VehicleStatus.AVAILABLE },
          });
        }
      } else {
        // Check if all stops in this route are complete
        const route = await tx.deliveryRoute.findUnique({
          where: { id: delivery.routeStop.routeId },
          include: { stops: true },
        });

        if (route) {
          const allComplete = route.stops.every(
            (stop) => stop.status === 'COMPLETED' || stop.status === 'FAILED' || stop.status === 'SKIPPED'
          );

          if (allComplete) {
            await tx.vehicle.update({
              where: { id: delivery.vehicleId! },
              data: { status: VehicleStatus.AVAILABLE },
            });

            // Also update route status
            await tx.deliveryRoute.update({
              where: { id: route.id },
              data: { status: 'COMPLETED' },
            });
          }
        }
      }

      return {
        delivery: updatedDelivery,
        checklist,
      };
    });

    return NextResponse.json({
      success: true,
      deliveryStatus,
      checklist: {
        id: result.checklist.id,
        itemsVerified: result.checklist.itemsVerified,
        photosCount: body.photos.length, // Assuming photosCount is the number of photos submitted
        signedBy: result.checklist.signedBy,
        deliveredAt: result.delivery.deliveryTime, // Use deliveryTime from updatedDelivery
        signedAt: result.checklist.signedAt,
        deliveredItems: body.deliveryItems.reduce((sum, item) => sum + item.deliveredQuantity, 0),
        rejectedItems: body.deliveryItems.reduce((sum, item) => sum + item.rejectedQuantity, 0),
        completedAt: result.checklist.signedAt?.toISOString(), // Use signedAt for completion time
      },
    });
  } catch (error) {
    if (error instanceof DriverAuthError) return handleDriverAuthError(error);
    console.error('Error completing delivery checklist:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to complete delivery checklist' },
      { status: 500 }
    );
  }
}
