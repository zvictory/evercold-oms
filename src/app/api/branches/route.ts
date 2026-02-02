import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const branches = await prisma.customerBranch.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { branchName: "asc" },
    });

    const formattedBranches = branches.map((b) => ({
      id: b.id,
      branchCode: b.branchCode,
      branchName: b.branchName,
      customerId: b.customerId,
      customerName: b.customer?.name || "—",
      assignedTechs: 0, // Will be calculated later from assignments
    }));

    return NextResponse.json(formattedBranches);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
