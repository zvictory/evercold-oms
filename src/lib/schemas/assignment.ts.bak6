import { z } from 'zod'

export const assignmentSchema = z.object({
  driverId: z.string().cuid('Invalid driver ID'),
  vehicleId: z.string().cuid('Invalid vehicle ID'),
})

export type AssignmentInput = z.infer<typeof assignmentSchema>

export const unassignmentSchema = z.object({
  driverId: z.string().cuid('Invalid driver ID'),
})

export type UnassignmentInput = z.infer<typeof unassignmentSchema>
