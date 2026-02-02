import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subcategories = await prisma.issueSubcategory.findMany({
      where: { categoryId: id },
      include: {
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(subcategories);
  } catch (error: any) {
    console.error("Fetch subcategories error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const subcategory = await prisma.issueSubcategory.create({
      data: {
        categoryId: id,
        name: body.name,
        description: body.description,
        slaResponseCritical: body.slaResponseCritical || 60,
        slaResponseHigh: body.slaResponseHigh || 240,
        slaResponseNormal: body.slaResponseNormal || 1440,
        slaResponseLow: body.slaResponseLow || 2880,
        slaResolutionCritical: body.slaResolutionCritical || 240,
        slaResolutionHigh: body.slaResolutionHigh || 1440,
        slaResolutionNormal: body.slaResolutionNormal || 2880,
        slaResolutionLow: body.slaResolutionLow || 4320,
      },
    });

    return NextResponse.json(subcategory, { status: 201 });
  } catch (error: any) {
    console.error("Create subcategory error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create subcategory" },
      { status: 500 }
    );
  }
}
