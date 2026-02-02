import { NextRequest, NextResponse } from "next/server";
import { createTicket, listTickets } from "@/lib/tickets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const ticket = await createTicket({
      branchId: body.branchId,
      categoryId: body.categoryId,
      subcategoryId: body.subcategoryId,
      description: body.description,
      priority: body.priority,
      externalId: body.externalId,
      dispatcherId: body.dispatcherId,
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tickets = await listTickets({
      status: searchParams.get("status") || undefined,
      branchId: searchParams.get("branchId") || undefined,
      technicianId: searchParams.get("technicianId") || undefined,
      priority: searchParams.get("priority") || undefined,
    });

    return NextResponse.json(tickets);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
