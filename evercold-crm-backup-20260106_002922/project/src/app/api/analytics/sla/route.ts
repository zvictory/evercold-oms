import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tickets = await prisma.serviceTicket.findMany({
      include: { subcategory: true, assignedTechnician: true },
    });

    // Calculate metrics
    const metrics = {
      totalTickets: tickets.length,
      byStatus: {
        NEW: tickets.filter((t) => t.status === "NEW").length,
        ASSIGNED: tickets.filter((t) => t.status === "ASSIGNED").length,
        IN_PROGRESS: tickets.filter((t) => t.status === "IN_PROGRESS").length,
        COMPLETED: tickets.filter((t) => t.status === "COMPLETED").length,
        CLOSED: tickets.filter((t) => t.status === "CLOSED").length,
      },
      avgResponseTime: calculateAvgResponseTime(tickets),
      avgResolutionTime: calculateAvgResolutionTime(tickets),
      slaViolations: calculateSLAViolations(tickets),
      technicianStats: calculateTechnicianStats(tickets),
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function calculateAvgResponseTime(tickets: any[]): number {
  const responded = tickets.filter((t) => t.firstResponseAt);
  if (responded.length === 0) return 0;

  const total = responded.reduce((sum, t) => {
    const diff =
      new Date(t.firstResponseAt).getTime() - new Date(t.createdAt).getTime();
    return sum + diff;
  }, 0);

  return Math.round(total / responded.length / 60000); // minutes
}

function calculateAvgResolutionTime(tickets: any[]): number {
  const resolved = tickets.filter((t) => t.completedAt);
  if (resolved.length === 0) return 0;

  const total = resolved.reduce((sum, t) => {
    const diff =
      new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
    return sum + diff;
  }, 0);

  return Math.round(total / resolved.length / 60000); // minutes
}

function calculateSLAViolations(tickets: any[]): number {
  return tickets.filter((t) => {
    if (!t.subcategory || !t.firstResponseAt) return false;

    const slaMinutes =
      t.priority === "CRITICAL"
        ? t.subcategory.slaResponseCritical
        : t.priority === "HIGH"
        ? t.subcategory.slaResponseHigh
        : t.priority === "NORMAL"
        ? t.subcategory.slaResponseNormal
        : t.subcategory.slaResponseLow;

    const responseTime =
      (new Date(t.firstResponseAt).getTime() -
        new Date(t.createdAt).getTime()) /
      60000;

    return responseTime > slaMinutes;
  }).length;
}

function calculateTechnicianStats(tickets: any[]): any[] {
  const stats: Record<string, any> = {};

  tickets.forEach((t) => {
    if (t.assignedTechnician) {
      const id = t.assignedTechnician.id;
      if (!stats[id]) {
        stats[id] = {
          name: t.assignedTechnician.name,
          total: 0,
          completed: 0,
          avgResponseTime: 0,
        };
      }
      stats[id].total++;
      if (t.status === "CLOSED") stats[id].completed++;
    }
  });

  return Object.values(stats);
}
