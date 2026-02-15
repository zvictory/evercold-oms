"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ActionResponse } from "./index"
import { RouteStatus, RouteStopStatus, DeliveryStatus } from "@prisma/client"

/**
 * Creates a new DeliveryRoute from a list of standalone delivery IDs and starts it.
 * This is used when a driver has multiple individual orders assigned and starts them as a batch.
 */
export async function startAdHocRoute(params: {
    deliveryIds: string[]
    driverId: string
    vehicleId?: string
}): Promise<ActionResponse> {
    try {
        const { deliveryIds, driverId, vehicleId } = params

        if (!deliveryIds || deliveryIds.length === 0) {
            return { success: false, error: "No deliveries selected" }
        }

        return await prisma.$transaction(async (tx) => {
            // 1. Verify all deliveries exist and belong to driver
            const deliveries = await tx.delivery.findMany({
                where: {
                    id: { in: deliveryIds },
                    driverId: driverId,
                    status: DeliveryStatus.PENDING
                },
                include: {
                    order: true
                }
            })

            if (deliveries.length !== deliveryIds.length) {
                throw new Error("Some deliveries could not be found or are not assigned to you")
            }

            // 2. Get Vehicle if not provided (try to get from first delivery)
            let finalVehicleId = vehicleId
            if (!finalVehicleId) {
                finalVehicleId = deliveries[0].vehicleId || undefined
            }

            // If still no vehicle, we might fail or just picking a default? 
            // For now, let's assume valid data or find any vehicle assigned to driver
            if (!finalVehicleId) {
                const driverVehicle = await tx.vehicle.findFirst({
                    where: { driverId: driverId }
                })
                finalVehicleId = driverVehicle?.id
            }

            if (!finalVehicleId) {
                throw new Error("No vehicle found for this route")
            }

            // 3. Create the Route
            const route = await tx.deliveryRoute.create({
                data: {
                    routeName: `Ad-hoc Route - ${new Date().toLocaleDateString()}`,
                    driverId: driverId,
                    vehicleId: finalVehicleId,
                    scheduledDate: new Date(),
                    status: RouteStatus.IN_PROGRESS,
                    actualStartTime: new Date(),
                }
            })

            // 4. Create RouteStops and Link Deliveries
            for (let i = 0; i < deliveries.length; i++) {
                const delivery = deliveries[i]

                await tx.routeStop.create({
                    data: {
                        routeId: route.id,
                        deliveryId: delivery.id,
                        stopNumber: i + 1,
                        status: RouteStopStatus.PENDING
                    }
                })

                // Update Delivery Status (Delivery becomes IN_TRANSIT)
                await tx.delivery.update({
                    where: { id: delivery.id },
                    data: {
                        status: DeliveryStatus.IN_TRANSIT
                    }
                })

                // Update Order Status (Order becomes SHIPPED)
                if (delivery.orderId) {
                    await tx.order.update({
                        where: { id: delivery.orderId },
                        data: {
                            status: "SHIPPED"
                        }
                    })
                }
            }

            // 5. Set first stop to EN_ROUTE so BigActionButton shows "Mark Arrived"
            const firstStop = await tx.routeStop.findFirst({
                where: { routeId: route.id },
                orderBy: { stopNumber: 'asc' }
            })
            if (firstStop) {
                await tx.routeStop.update({
                    where: { id: firstStop.id },
                    data: { status: RouteStopStatus.EN_ROUTE }
                })
            }

            return { success: true, message: "Route started successfully" }
        })
    } catch (error: any) {
        console.error("startAdHocRoute error:", error)
        return { success: false, error: error.message || "Failed to start route" }
    } finally {
        revalidatePath('/driver')
    }
}
