import { NextRequest, NextResponse } from "next/server";
import { createCompletion } from "@/lib/completions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.completedBy) {
      return NextResponse.json(
        { error: "completedBy (technician ID) is required" },
        { status: 400 }
      );
    }

    if (!body.workDescription) {
      return NextResponse.json(
        { error: "workDescription is required" },
        { status: 400 }
      );
    }

    if (
      typeof body.laborHours !== "number" ||
      typeof body.laborCostPerHour !== "number"
    ) {
      return NextResponse.json(
        { error: "laborHours and laborCostPerHour must be numbers" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.partsUsed)) {
      return NextResponse.json(
        { error: "partsUsed must be an array" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.photos)) {
      return NextResponse.json(
        { error: "photos must be an array" },
        { status: 400 }
      );
    }

    const completion = await createCompletion({
      ticketId: id,
      completedBy: body.completedBy,
      workDescription: body.workDescription,
      laborHours: body.laborHours,
      laborCostPerHour: body.laborCostPerHour,
      partsUsed: body.partsUsed,
      photos: body.photos,
    });

    return NextResponse.json(completion, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
