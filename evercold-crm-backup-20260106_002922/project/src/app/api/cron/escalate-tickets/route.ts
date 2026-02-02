import { NextRequest, NextResponse } from "next/server";
import { escalateOverdueTickets } from "@/lib/sla";

// Protect with cron secret - vercel cron sends Authorization header
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const escalated = await escalateOverdueTickets();
    return NextResponse.json({
      success: true,
      escalatedCount: escalated.length,
      escalated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
