import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { confirmReceiptSchema } from "@/lib/validations/receipt";
import { requireDriver, handleDriverAuthError, DriverAuthError } from "@/lib/driverAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    const session = await requireDriver(request);
    const { routeId } = await params;
    const body = await request.json();

    // Validate request body
    const validated = confirmReceiptSchema.parse({
      ...body,
      routeId,
    });

    // Check if route exists and belongs to driver
    const route = await prisma.deliveryRoute.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    if (route.driverId !== session.driver.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Bulk update Order statuses to SHIPPED
    await prisma.order.updateMany({
      where: {
        id: { in: validated.orderIds },
      },
      data: {
        status: OrderStatus.SHIPPED,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${validated.orderIds.length} orders updated to SHIPPED`,
    });
  } catch (error: any) {
    if (error instanceof DriverAuthError) return handleDriverAuthError(error);
    
    return NextResponse.json(
      { error: error.message || "Failed to confirm receipt" },
      { status: 400 }
    );
  }
}
