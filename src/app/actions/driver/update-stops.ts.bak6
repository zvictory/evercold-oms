"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ActionResponse } from "./index"

/**
 * Update the order of stops in a route.
 * Updates the stopNumber for each stop based on the provided array order.
 */
export async function updateStopOrder(params: {
    routeId: string
    stopIds: string[]
}): Promise<ActionResponse> {
    try {
        const { routeId, stopIds } = params

        if (!routeId || !stopIds || stopIds.length === 0) {
            return { success: false, error: "Route ID and Stop IDs are required" }
        }

        return await prisma.$transaction(async (tx) => {
            // Verify route exists
            const route = await tx.deliveryRoute.findUnique({
                where: { id: routeId }
            })

            if (!route) {
                throw new Error("Route not found")
            }

            // Update each stop with new stopNumber
            // We do this in a loop within transaction
            for (let i = 0; i < stopIds.length; i++) {
                const stopId = stopIds[i]
                await tx.routeStop.update({
                    where: {
                        id: stopId,
                        routeId: routeId // Ensure stop belongs to this route
                    },
                    data: {
                        stopNumber: i + 1 // 1-based indexing for user friendly display
                    }
                })
            }

            return { success: true, message: "Stop order updated successfully" }
        })
    } catch (error: any) {
        console.error("updateStopOrder error:", error)
        return { success: false, error: error.message || "Failed to update stop order" }
    } finally {
        revalidatePath('/driver')
    }
}
