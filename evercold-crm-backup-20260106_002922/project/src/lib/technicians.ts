import { prisma } from "@/lib/prisma";

export async function createTechnician(data: {
  name: string;
  phone: string;
  email?: string;
}) {
  return prisma.technician.create({
    data,
  });
}

export async function getTechnician(id: string) {
  return prisma.technician.findUnique({
    where: { id },
    include: {
      branchAssignments: { include: { branch: true } },
      assignedTickets: true,
    },
  });
}

export async function listTechnicians() {
  return prisma.technician.findMany({
    include: {
      branchAssignments: { include: { branch: true } },
    },
  });
}

export async function updateTechnicianLocation(
  id: string,
  latitude: number,
  longitude: number
) {
  return prisma.technician.update({
    where: { id },
    data: {
      latitude,
      longitude,
      lastLocationUpdate: new Date(),
    },
  });
}

export async function assignTechnicianToBranch(data: {
  technicianId: string;
  branchId: string;
  isPrimary: boolean;
}) {
  return prisma.technicianBranchAssignment.create({
    data,
    include: {
      technician: true,
      branch: true,
    },
  });
}

export async function getPrimaryTechnicianForBranch(branchId: string) {
  return prisma.technicianBranchAssignment.findFirst({
    where: {
      branchId,
      isPrimary: true,
      endDate: null,
    },
    include: { technician: true },
  });
}

export async function getSecondaryTechnicianForBranch(branchId: string) {
  return prisma.technicianBranchAssignment.findFirst({
    where: {
      branchId,
      isPrimary: false,
      endDate: null,
    },
    include: { technician: true },
  });
}
