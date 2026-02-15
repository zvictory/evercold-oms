"use server"

import { prisma } from "@/lib/prisma"
import { DeliveryStatus, OrderStatus, RouteStopStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { ActionResponse } from "./index"

/**
 * Complete a delivery with photo proof.
 * Creates DeliveryPhoto, updates Delivery status, Order status, and RouteStop status.
 */
export async function completeDelivery(params: {
    deliveryId: string
    photoUrl: string
    notes?: string
}): Promise<ActionResponse> {
    try {
        const { deliveryId, photoUrl, notes } = params

        if (!deliveryId || !photoUrl) {
            return { success: false, error: "Delivery ID and Photo URL are required" }
        }

        return await prisma.$transaction(async (tx) => {
            // 1. Get Delivery to find Order ID and ensure it exists
            const delivery = await tx.delivery.findUnique({
                where: { id: deliveryId },
                include: {
                    checklist: true,
                    routeStop: true
                }
            })

            if (!delivery) {
                throw new Error("Delivery not found")
            }

            // 2. Ensure DeliveryChecklist exists (create if not)
            let checklistId = delivery.checklist?.id
            if (!checklistId) {
                const newChecklist = await tx.deliveryChecklist.create({
                    data: {
                        deliveryId: deliveryId
                    }
                })
                checklistId = newChecklist.id
            }

            // 3. Create DeliveryPhoto
            await tx.deliveryPhoto.create({
                data: {
                    checklistId: checklistId,
                    photoUrl: photoUrl,
                    photoType: "PROOF_OF_DELIVERY",
                    caption: "Proof of Delivery"
                }
            })

            // 4. Update Delivery status
            await tx.delivery.update({
                where: { id: deliveryId },
                data: {
                    status: DeliveryStatus.DELIVERED,
                    deliveryTime: new Date(),
                    notes: notes ? (delivery.notes ? `${delivery.notes}\n${notes}` : notes) : delivery.notes
                }
            })

            // 5. Update Order status
            if (delivery.orderId) {
                await tx.order.update({
                    where: { id: delivery.orderId },
                    data: {
                        status: OrderStatus.COMPLETED, // Or COMPLETED depending on business logic, DELIVERED seems right for now
                    }
                })
            }

            // 6. Update RouteStop status
            if (delivery.routeStop) {
                await tx.routeStop.update({
                    where: { id: delivery.routeStop.id },
                    data: {
                        status: RouteStopStatus.COMPLETED,
                        completedAt: new Date(),
                        actualArrival: new Date() // Just incase it wasn't set
                    }
                })

                // 7. Advance next stop to EN_ROUTE
                const nextStop = await tx.routeStop.findFirst({
                    where: {
                        routeId: delivery.routeStop.routeId,
                        status: RouteStopStatus.PENDING,
                        stopNumber: { gt: delivery.routeStop.stopNumber }
                    },
                    orderBy: { stopNumber: 'asc' }
                })

                if (nextStop) {
                    await tx.routeStop.update({
                        where: { id: nextStop.id },
                        data: { status: RouteStopStatus.EN_ROUTE }
                    })
                }

                // 8. Auto-complete route if all stops are terminal
                const route = await tx.deliveryRoute.findUnique({
                    where: { id: delivery.routeStop.routeId },
                    include: { stops: true }
                })

                if (route) {
                    const allTerminal = route.stops.every(
                        (stop) => stop.status === 'COMPLETED' || stop.status === 'FAILED' || stop.status === 'SKIPPED'
                    )

                    if (allTerminal) {
                        await tx.deliveryRoute.update({
                            where: { id: route.id },
                            data: {
                                status: 'COMPLETED',
                                actualEndTime: new Date()
                            }
                        })
                    }
                }
            }

            return { success: true, message: "Delivery completed successfully" }
        })
    } catch (error: any) {
        console.error("completeDelivery error:", error)
        return { success: false, error: error.message || "Failed to complete delivery" }
    } finally {
        revalidatePath('/driver')
    }
}
