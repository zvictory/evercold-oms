import { prisma } from "@/lib/prisma";
import { ApprovalStatus } from "@prisma/client";

interface Part {
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface Photo {
  url: string;
  type: "before" | "after" | "work";
  caption?: string;
}

export async function createCompletion(data: {
  ticketId: string;
  completedBy: string;
  workDescription: string;
  laborHours: number;
  laborCostPerHour: number;
  partsUsed: Part[];
  photos: Photo[];
}) {
  // Verify ticket exists and is in COMPLETED status
  const ticket = await prisma.serviceTicket.findUnique({
    where: { id: data.ticketId },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.status !== "IN_PROGRESS" && ticket.status !== "ASSIGNED") {
    throw new Error(
      `Ticket must be IN_PROGRESS or ASSIGNED to complete. Current status: ${ticket.status}`
    );
  }

  // Calculate costs
  const partsCost = data.partsUsed.reduce((sum, p) => sum + p.total, 0);
  const laborCost = data.laborHours * data.laborCostPerHour;
  const totalCost = partsCost + laborCost;

  const completion = await prisma.serviceCompletion.create({
    data: {
      ticketId: data.ticketId,
      completedBy: data.completedBy,
      completedAt: new Date(),
      workDescription: data.workDescription,
      laborHours: data.laborHours,
      laborCostPerHour: data.laborCostPerHour,
      partsJson: JSON.stringify(data.partsUsed),
      photosJson: JSON.stringify(data.photos),
      partsCost,
      laborCost,
      totalCost,
      approvalStatus: "PENDING",
    },
  });

  // Update ticket status to COMPLETED
  await prisma.serviceTicket.update({
    where: { id: data.ticketId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  return completion;
}

export async function getCompletion(id: string) {
  return prisma.serviceCompletion.findUnique({
    where: { id },
    include: {
      ticket: {
        include: {
          branch: { include: { customer: true } },
          assignedTechnician: true,
        },
      },
      technician: true,
    },
  });
}

export async function listCompletions(filters?: {
  approvalStatus?: ApprovalStatus;
  ticketId?: string;
  completedBy?: string;
}) {
  return prisma.serviceCompletion.findMany({
    where: {
      approvalStatus: filters?.approvalStatus,
      ticketId: filters?.ticketId,
      completedBy: filters?.completedBy,
    },
    include: {
      ticket: {
        include: {
          branch: { include: { customer: true } },
        },
      },
      technician: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveCompletion(id: string) {
  const completion = await prisma.serviceCompletion.findUnique({
    where: { id },
  });

  if (!completion) {
    throw new Error("Completion not found");
  }

  if (completion.approvalStatus !== "PENDING") {
    throw new Error(
      `Can only approve PENDING completions. Current status: ${completion.approvalStatus}`
    );
  }

  const updated = await prisma.serviceCompletion.update({
    where: { id },
    data: { approvalStatus: "APPROVED" },
  });

  // Close the ticket
  await prisma.serviceTicket.update({
    where: { id: completion.ticketId },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  return updated;
}

export async function rejectCompletion(id: string, reason: string) {
  const completion = await prisma.serviceCompletion.findUnique({
    where: { id },
  });

  if (!completion) {
    throw new Error("Completion not found");
  }

  if (completion.approvalStatus !== "PENDING") {
    throw new Error(
      `Can only reject PENDING completions. Current status: ${completion.approvalStatus}`
    );
  }

  const updated = await prisma.serviceCompletion.update({
    where: { id },
    data: {
      approvalStatus: "REJECTED",
      approvalNotes: reason,
    },
  });

  // Revert ticket status back to IN_PROGRESS so technician can correct work
  await prisma.serviceTicket.update({
    where: { id: completion.ticketId },
    data: { status: "IN_PROGRESS" },
  });

  return updated;
}
