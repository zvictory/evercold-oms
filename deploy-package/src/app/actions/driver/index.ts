"use server"

import { prisma } from "@/lib/prisma"
import { OrderStatus, RouteStatus } from "@prisma/client"
import { confirmReceiptSchema } from "@/lib/validations/receipt"
import { revalidatePath } from "next/cache"

export type ActionResponse<T = any> = {
    success: boolean
    message?: string
    data?: T
    error?: any
}

/**
 * Confirm all items received at the warehouse.
 * Updates all orders to SHIPPED and the route to IN_PROGRESS.
 */
export async function confirmReceipt(params: {
    routeId: string
    orderIds: string[]
}): Promise<ActionResponse> {
    try {
        const validated = confirmReceiptSchema.parse({
            ...params,
            confirmedAt: new Date()
        })

        return await prisma.$transaction(async (tx) => {
            // 1. Update all Orders to status SHIPPED
            await tx.order.updateMany({
                where: {
                    id: { in: validated.orderIds }
                },
                data: {
                    status: OrderStatus.SHIPPED,
                }
            })

            // 2. Update the Route status to IN_PROGRESS (acting as IN_TRANSIT)
            await tx.deliveryRoute.update({
                where: { id: validated.routeId },
                data: {
                    status: RouteStatus.IN_PROGRESS,
                    actualStartTime: new Date()
                }
            })

            // 3. Log a TimelineEvent for each order
            // Note: TimelineEvent model is not present in schema.prisma.
            // Logging to Order notes as a fallback.
            for (const orderId of validated.orderIds) {
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                    select: { notes: true, orderNumber: true }
                })
                
                const eventLog = `[${new Date().toISOString()}] Driver confirmed receipt at warehouse`
                const updatedNotes = order?.notes 
                    ? `${eventLog}\n${order.notes}`
                    : eventLog

                await tx.order.update({
                    where: { id: orderId },
                    data: { notes: updatedNotes }
                })
            }

            return { success: true, message: "Receipt confirmed and route started." }
        })
    } catch (error: any) {
        console.error("confirmReceipt error:", error)
        return { success: false, error: error.message || "Failed to confirm receipt" }
    } finally {
        revalidatePath('/driver')
    }
}
