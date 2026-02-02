import { NextRequest, NextResponse } from "next/server";
import {
  approveCompletion,
  rejectCompletion,
  getCompletion,
} from "@/lib/completions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.action) {
      return NextResponse.json(
        { error: "action field is required (approve or reject)" },
        { status: 400 }
      );
    }

    if (body.action === "approve") {
      const completion = await approveCompletion(id);
      return NextResponse.json(completion, { status: 200 });
    }

    if (body.action === "reject") {
      if (!body.reason) {
        return NextResponse.json(
          { error: "reason is required when rejecting" },
          { status: 400 }
        );
      }

      const completion = await rejectCompletion(id, body.reason);
      return NextResponse.json(completion, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid action. Must be 'approve' or 'reject'" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const completion = await getCompletion(id);

    if (!completion) {
      return NextResponse.json(
        { error: "Completion not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(completion, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
