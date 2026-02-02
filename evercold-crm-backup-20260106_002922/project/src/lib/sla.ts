import { prisma } from "@/lib/prisma";
import {
  getSecondaryTechnicianForBranch,
} from "./technicians";

export async function getResponseSLAMinutes(
  subcategoryId: string,
  priority: string
): Promise<number> {
  const subcategory = await prisma.issueSubcategory.findUnique({
    where: { id: subcategoryId },
  });

  if (!subcategory) return 1440; // default 24h

  switch (priority) {
    case "CRITICAL":
      return subcategory.slaResponseCritical;
    case "HIGH":
      return subcategory.slaResponseHigh;
    case "NORMAL":
      return subcategory.slaResponseNormal;
    case "LOW":
      return subcategory.slaResponseLow;
    default:
      return 1440;
  }
}

export async function getResolutionSLAMinutes(
  subcategoryId: string,
  priority: string
): Promise<number> {
  const subcategory = await prisma.issueSubcategory.findUnique({
    where: { id: subcategoryId },
  });

  if (!subcategory) return 2880; // default 48h

  switch (priority) {
    case "CRITICAL":
      return subcategory.slaResolutionCritical;
    case "HIGH":
      return subcategory.slaResolutionHigh;
    case "NORMAL":
      return subcategory.slaResolutionNormal;
    case "LOW":
      return subcategory.slaResolutionLow;
    default:
      return 2880;
  }
}

export async function escalateOverdueTickets() {
  // Find all ASSIGNED tickets that haven't gotten a response (firstResponseAt is null)
  const tickets = await prisma.serviceTicket.findMany({
    where: {
      status: "ASSIGNED",
      firstResponseAt: null,
      createdAt: {
        lte: new Date(Date.now() - 1 * 60 * 1000), // At least 1 minute old
      },
    },
    include: {
      subcategory: true,
      branch: true,
      assignedTechnician: true,
    },
  });

  const escalated = [];

  for (const ticket of tickets) {
    const slaMinutes = await getResponseSLAMinutes(
      ticket.subcategoryId,
      ticket.priority
    );
    const slaTimeLimit = new Date(
      ticket.createdAt.getTime() + slaMinutes * 60 * 1000
    );

    if (new Date() > slaTimeLimit) {
      // SLA missed - escalate to secondary
      const secondary = await getSecondaryTechnicianForBranch(ticket.branchId);

      if (secondary) {
        const updated = await prisma.serviceTicket.update({
          where: { id: ticket.id },
          data: {
            assignedTechnicianId: secondary.technician.id,
          },
          include: { assignedTechnician: true, branch: true },
        });
        escalated.push(updated);
      }
    }
  }

  return escalated;
}
