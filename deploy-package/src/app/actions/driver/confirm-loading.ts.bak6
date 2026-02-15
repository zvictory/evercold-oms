"use server"

import { prisma } from "@/lib/prisma"
import { OrderStatus, RouteStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { ActionResponse } from "./index" // Importing type from index.ts we just created

/**
 * Confirm all items received at the warehouse.
 * Updates all orders in the route to SHIPPED and the route to IN_PROGRESS.
 */
export async function confirmLoading(params: {
    routeId: string
}): Promise<ActionResponse> {
    try {
        const { routeId } = params

        if (!routeId) {
            return { success: false, error: "Route ID is required" }
        }

        return await prisma.$transaction(async (tx) => {
            // Get all order IDs for this route
            const route = await tx.deliveryRoute.findUnique({
                where: { id: routeId },
                include: {
                    stops: {
                        include: {
                            delivery: true
                        }
                    }
                }
            })

            if (!route) {
                throw new Error("Route not found")
            }

            const orderIds = route.stops
                .filter(stop => stop.delivery?.orderId)
                .map(stop => stop.delivery!.orderId)

            // 1. Update all Orders to status SHIPPED
            if (orderIds.length > 0) {
                await tx.order.updateMany({
                    where: {
                        id: { in: orderIds }
                    },
                    data: {
                        status: OrderStatus.SHIPPED,
                    }
                })
            }

            // 2. Update the Route status to IN_PROGRESS (acting as IN_TRANSIT)
            await tx.deliveryRoute.update({
                where: { id: routeId },
                data: {
                    status: RouteStatus.IN_PROGRESS,
                    actualStartTime: new Date()
                }
            })

            // 3. Set first stop to EN_ROUTE so BigActionButton shows "Mark Arrived"
            const firstStop = route.stops
                .sort((a, b) => a.stopNumber - b.stopNumber)[0]
            if (firstStop) {
                await tx.routeStop.update({
                    where: { id: firstStop.id },
                    data: { status: 'EN_ROUTE' }
                })
            }

            // 4. Log a history event for each order
            for (const orderId of orderIds) {
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                    select: { notes: true, orderNumber: true }
                })

                const eventLog = `[${new Date().toISOString()}] Driver confirmed cargo loading at warehouse`
                const updatedNotes = order?.notes
                    ? `${eventLog}\n${order.notes}`
                    : eventLog

                await tx.order.update({
                    where: { id: orderId },
                    data: { notes: updatedNotes }
                })
            }

            return { success: true, message: "Loading confirmed and route started." }
        })
    } catch (error: any) {
        console.error("confirmLoading error:", error)
        return { success: false, error: error.message || "Failed to confirm loading" }
    } finally {
        revalidatePath('/driver')
    }
}
