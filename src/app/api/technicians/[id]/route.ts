import { NextRequest, NextResponse } from "next/server";
import {
  getTechnician,
  updateTechnicianLocation,
} from "@/lib/technicians";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const technician = await getTechnician(id);
    if (!technician) {
      return NextResponse.json(
        { error: "Technician not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(technician);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.latitude !== undefined && body.longitude !== undefined) {
      const technician = await updateTechnicianLocation(
        id,
        body.latitude,
        body.longitude
      );
      return NextResponse.json(technician);
    }

    return NextResponse.json(
      { error: "No valid update provided" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
