import { NextRequest, NextResponse } from "next/server";
import {
  getTicket,
  updateTicketStatus,
  assignTechnician,
} from "@/lib/tickets";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticket = await getTicket(id);
    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(ticket);
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

    if (body.status) {
      const ticket = await updateTicketStatus(id, body.status);
      return NextResponse.json(ticket);
    }

    if (body.assignedTechnicianId) {
      const ticket = await assignTechnician(id, body.assignedTechnicianId);
      return NextResponse.json(ticket);
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
