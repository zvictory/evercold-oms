import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "./telegram-notifications";

export async function generateTicketNumber(): Promise<string> {
  const date = new Date();
  const yearMonth = date.toISOString().slice(0, 7).replace("-", "");

  // Get count of tickets this month
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const count = await prisma.serviceTicket.count({
    where: {
      createdAt: {
        gte: firstDay,
      },
    },
  });

  const sequence = String(count + 1).padStart(5, "0");
  return `TKT-${yearMonth}-${sequence}`;
}

export async function createTicket(data: {
  branchId: string;
  categoryId: string;
  subcategoryId: string;
  description: string;
  priority?: string;
  externalId?: string;
  dispatcherId?: string;
}) {
  // Get branch info for contact details
  const branch = await prisma.customerBranch.findUnique({
    where: { id: data.branchId },
    include: { customer: true },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  const ticketNumber = await generateTicketNumber();

  // Get primary technician for this branch
  const primaryAssignment = await prisma.technicianBranchAssignment.findFirst({
    where: {
      branchId: data.branchId,
      isPrimary: true,
      endDate: null,
    },
    include: { technician: true },
  });

  // Create ticket
  const ticket = await prisma.serviceTicket.create({
    data: {
      ticketNumber,
      externalId: data.externalId,
      branchId: data.branchId,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      description: data.description,
      priority: (data.priority || "NORMAL") as any,
      contactName: branch.contactPerson,
      contactPhone: branch.phone,
      contactRole: "Store Manager",
      assignedTechnicianId: primaryAssignment?.technician.id,
      dispatcherId: data.dispatcherId,
      status: primaryAssignment ? "ASSIGNED" : "NEW",
    },
    include: {
      category: true,
      subcategory: true,
      assignedTechnician: true,
      branch: true,
    },
  });

  // Send notifications
  const dispatcherChatId = process.env.TELEGRAM_DISPATCHER_CHAT_ID;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const chatIds: string[] = [];

  if (dispatcherChatId) chatIds.push(dispatcherChatId);
  if (adminChatId) chatIds.push(adminChatId);

  if (chatIds.length > 0) {
    await sendTelegramNotification({
      type: "ticket_created",
      ticketNumber: ticket.ticketNumber,
      ticketId: ticket.id,
      branchCode: branch.branchCode,
      branchName: branch.branchName,
      priority: ticket.priority,
      description: ticket.description,
      chatIds,
    });
  }

  return ticket;
}

export async function getTicket(ticketId: string) {
  return prisma.serviceTicket.findUnique({
    where: { id: ticketId },
    include: {
      category: true,
      subcategory: true,
      assignedTechnician: true,
      branch: true,
      completion: true,
    },
  });
}

export async function listTickets(filters?: {
  status?: string;
  branchId?: string;
  technicianId?: string;
  priority?: string;
}) {
  return prisma.serviceTicket.findMany({
    where: {
      status: filters?.status as any,
      branchId: filters?.branchId,
      assignedTechnicianId: filters?.technicianId,
      priority: filters?.priority as any,
    },
    include: {
      category: true,
      subcategory: true,
      assignedTechnician: true,
      branch: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  timestamp?: Date
) {
  const data: any = { status };

  if (status === "ASSIGNED" && !timestamp) {
    data.firstResponseAt = new Date();
  } else if (status === "COMPLETED") {
    data.completedAt = new Date();
  } else if (status === "CLOSED") {
    data.closedAt = new Date();
  }

  return prisma.serviceTicket.update({
    where: { id: ticketId },
    data,
    include: {
      category: true,
      subcategory: true,
      assignedTechnician: true,
      branch: true,
    },
  });
}

export async function assignTechnician(
  ticketId: string,
  technicianId: string
) {
  const ticket = await prisma.serviceTicket.update({
    where: { id: ticketId },
    data: {
      assignedTechnicianId: technicianId,
      status: "ASSIGNED",
      firstResponseAt: new Date(),
    },
    include: {
      category: true,
      assignedTechnician: true,
      branch: true,
    },
  });

  // Send notifications
  const technicianChatId = process.env.TELEGRAM_TECHNICIAN_CHAT_ID;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const chatIds: string[] = [];

  if (technicianChatId) chatIds.push(technicianChatId);
  if (adminChatId) chatIds.push(adminChatId);

  if (chatIds.length > 0 && ticket.assignedTechnician) {
    await sendTelegramNotification({
      type: "ticket_assigned",
      ticketNumber: ticket.ticketNumber,
      ticketId: ticket.id,
      branchCode: ticket.branch.branchCode,
      technicianName: ticket.assignedTechnician.name,
      priority: ticket.priority,
      chatIds,
    });
  }

  return ticket;
}

export async function escalateTicket(
  ticketId: string,
  escalatedTechnicianId: string
) {
  const ticket = await prisma.serviceTicket.update({
    where: { id: ticketId },
    data: {
      assignedTechnicianId: escalatedTechnicianId,
      status: "ASSIGNED",
    },
    include: {
      category: true,
      assignedTechnician: true,
      branch: true,
    },
  });

  // Send escalation notifications
  const technicianChatId = process.env.TELEGRAM_TECHNICIAN_CHAT_ID;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const chatIds: string[] = [];

  if (technicianChatId) chatIds.push(technicianChatId);
  if (adminChatId) chatIds.push(adminChatId);

  if (chatIds.length > 0 && ticket.assignedTechnician) {
    await sendTelegramNotification({
      type: "ticket_escalated",
      ticketNumber: ticket.ticketNumber,
      ticketId: ticket.id,
      branchCode: ticket.branch.branchCode,
      technicianName: ticket.assignedTechnician.name,
      chatIds,
    });
  }

  return ticket;
}

export async function completeTicket(ticketId: string) {
  const ticket = await prisma.serviceTicket.update({
    where: { id: ticketId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
    include: {
      category: true,
      assignedTechnician: true,
      branch: true,
    },
  });

  // Send completion notifications
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const dispatcherChatId = process.env.TELEGRAM_DISPATCHER_CHAT_ID;
  const chatIds: string[] = [];

  if (adminChatId) chatIds.push(adminChatId);
  if (dispatcherChatId) chatIds.push(dispatcherChatId);

  if (chatIds.length > 0 && ticket.assignedTechnician) {
    await sendTelegramNotification({
      type: "ticket_completed",
      ticketNumber: ticket.ticketNumber,
      ticketId: ticket.id,
      branchCode: ticket.branch.branchCode,
      technicianName: ticket.assignedTechnician.name,
      chatIds,
    });
  }

  return ticket;
}
