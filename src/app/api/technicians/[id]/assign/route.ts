import { NextRequest, NextResponse } from "next/server";
import { assignTechnicianToBranch } from "@/lib/technicians";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const assignment = await assignTechnicianToBranch({
      technicianId: id,
      branchId: body.branchId,
      isPrimary: body.isPrimary ?? true,
    });
    return NextResponse.json(assignment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
