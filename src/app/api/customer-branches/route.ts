import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const branches = await prisma.customerBranch.findMany({
      where: { isActive: true },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerCode: true,
          },
        },
      },
      orderBy: { branchCode: "asc" },
    });

    return NextResponse.json(branches);
  } catch (error: any) {
    console.error("Fetch branches error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch branches" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const branch = await prisma.customerBranch.create({
      data: {
        customerId: body.customerId,
        branchName: body.branchName,
        branchCode: body.branchCode,
        fullName: body.fullName,
        deliveryAddress: body.deliveryAddress,
        contactPerson: body.contactPerson,
        phone: body.phone,
        email: body.email,
        latitude: body.latitude,
        longitude: body.longitude,
        region: body.region,
        city: body.city,
        operatingHours: body.operatingHours,
        notes: body.notes,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerCode: true,
          },
        },
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error: any) {
    console.error("Create branch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create branch" },
      { status: 500 }
    );
  }
}
