"use client"
// Note: This file is meant to be a Server Action file, but the directive is "use server".
// I will correct this below.

"use server"

import { prisma } from "@/lib/prisma"
import { OrderStatus, SourceType, Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"

export type ActionResponse<T = any> = {
    success: boolean
    message?: string
    data?: T
    error?: any
}

/**
 * Get Orders with pagination, filtering, and search.
 */
export async function getOrders(params: {
    page?: number
    pageSize?: number
    status?: OrderStatus
    branchId?: string
    dateFrom?: string
    dateTo?: string
    search?: string
}): Promise<ActionResponse<{ orders: any[], total: number }>> {
    try {
        const {
            page = 1,
            pageSize = 10,
            status,
            branchId,
            dateFrom,
            dateTo,
            search
        } = params

        const skip = (page - 1) * pageSize

        const where: Prisma.OrderWhereInput = {}

        if (status) where.status = status
        if (branchId) {
            where.orderItems = {
                some: { branchId }
            }
        }

        if (dateFrom || dateTo) {
            where.orderDate = {}
            if (dateFrom) where.orderDate.gte = new Date(dateFrom)
            if (dateTo) where.orderDate.lte = new Date(dateTo)
        }

        if (search) {
            where.OR = [
                { orderNumber: { contains: search } },
                {
                    customer: {
                        name: { contains: search }
                    }
                },
                {
                    orderItems: {
                        some: {
                            branch: {
                                branchName: { contains: search }
                            }
                        }
                    }
                }
            ]
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    customer: {
                        select: { name: true, customerCode: true }
                    },
                    orderItems: {
                        include: {
                            branch: {
                                select: { branchName: true, branchCode: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize
            }),
            prisma.order.count({ where })
        ])

        return { success: true, data: { orders, total } }
    } catch (error: any) {
        console.error("getOrders error:", error)
        return { success: false, error: error.message || "Failed to fetch orders" }
    }
}

/**
 * Create or Update Order with transactional item management.
 */
export async function upsertOrder(params: {
    orderId?: string
    customerId: string
    branchId: string // Used for creating OrderItems if shared
    orderDate: Date | string
    orderNumber?: string
    items: Array<{
        productId: string
        quantity: number
        price?: number // Optional: allows override from form
        vatRate?: number
        sapCode?: string
        barcode?: string
    }>
    notes?: string
}): Promise<ActionResponse> {
    try {
        return await prisma.$transaction(async (tx) => {
            const { orderId, customerId, branchId, orderDate, orderNumber, items, notes } = params

            // 1. Fetch Products with customer-specific pricing
            const productIds = items.map(i => i.productId)
            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
                include: {
                    customerPrices: {
                        where: { customerId }
                    }
                }
            })

            // 2. Create product map with customer-specific prices
            const productMap = new Map(
                products.map(p => {
                    const customerPrice = p.customerPrices[0]?.unitPrice
                    return [p.id, {
                        ...p,
                        currentPrice: customerPrice || p.unitPrice
                    }]
                })
            )

            // 3. Calculations
            let subtotal = 0
            let vatAmount = 0
            const orderItemsToCreate = items.map(item => {
                const product = productMap.get(item.productId)
                if (!product) throw new Error(`Product ${item.productId} not found`)

                // Use price from form if provided (manual override), otherwise use currentPrice
                const unitPrice = item.price !== undefined ? item.price : product.currentPrice
                const lineSubtotal = unitPrice * item.quantity
                const productVatRate = item.vatRate !== undefined ? item.vatRate : product.vatRate
                const lineVat = lineSubtotal * (productVatRate / 100)

                subtotal += lineSubtotal
                vatAmount += lineVat

                return {
                    productId: product.id,
                    productName: product.name,
                    sapCode: item.sapCode || product.sapCode,
                    barcode: item.barcode || product.barcode,
                    quantity: item.quantity,
                    unitPrice: unitPrice,
                    subtotal: lineSubtotal,
                    vatRate: productVatRate,
                    vatAmount: lineVat,
                    totalAmount: lineSubtotal + lineVat,
                    branchId: branchId
                }
            })

            const totalAmount = subtotal + vatAmount

            let finalOrder

            if (orderId) {
                // Update
                // Delete existing items
                await tx.orderItem.deleteMany({ where: { orderId } })

                finalOrder = await tx.order.update({
                    where: { id: orderId },
                    data: {
                        orderDate: new Date(orderDate),
                        subtotal,
                        vatAmount,
                        totalAmount,
                        notes,
                        orderItems: {
                            create: orderItemsToCreate
                        }
                    }
                })
            } else {
                // Create
                const finalOrderNumber = orderNumber || `ORD-${Date.now()}`

                finalOrder = await tx.order.create({
                    data: {
                        orderNumber: finalOrderNumber,
                        orderDate: new Date(orderDate),
                        customerId,
                        status: OrderStatus.NEW,
                        subtotal,
                        vatAmount,
                        totalAmount,
                        notes,
                        sourceType: SourceType.DETAILED,
                        orderItems: {
                            create: orderItemsToCreate
                        }
                    }
                })
            }

            revalidatePath('/orders')
            return { success: true, data: finalOrder }
        })
    } catch (error: any) {
        console.error("upsertOrder error:", error)
        return { success: false, error: error.message || "Failed to upsert order" }
    }
}

/**
 * Update Order Status with workflow validation.
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<ActionResponse> {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true }
        })

        if (!order) return { success: false, message: "Order not found" }

        // Workflow Validation
        const statusPriority: Record<OrderStatus, number> = {
            [OrderStatus.NEW]: 0,
            [OrderStatus.CONFIRMED]: 1,
            [OrderStatus.PICKING]: 2,
            [OrderStatus.PACKING]: 3,
            [OrderStatus.READY]: 4,
            [OrderStatus.SHIPPED]: 5,
            [OrderStatus.PARTIAL]: 6,
            [OrderStatus.COMPLETED]: 7,
            [OrderStatus.INVOICED]: 8,
            [OrderStatus.PAID]: 8,
            [OrderStatus.CANCELLED]: -1,
        }

        if (statusPriority[order.status] >= 7 && statusPriority[newStatus] < 7 && newStatus !== OrderStatus.CANCELLED) {
            return { success: false, message: "Cannot revert completed or paid orders" }
        }

        const data: Prisma.OrderUpdateInput = { status: newStatus }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data
        })

        revalidatePath('/orders')
        return { success: true, data: updatedOrder }
    } catch (error: any) {
        console.error("updateOrderStatus error:", error)
        return { success: false, error: error.message || "Failed to update status" }
    }
}

/**
 * Delete Order with protection for active/completed orders.
 */
export async function deleteOrder(orderId: string): Promise<ActionResponse> {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true }
        })

        if (!order) return { success: false, message: "Order not found" }

        const protectedStatuses: OrderStatus[] = [
            OrderStatus.SHIPPED,
            OrderStatus.PARTIAL,
            OrderStatus.COMPLETED,
            OrderStatus.INVOICED,
            OrderStatus.PAID
        ]

        if (protectedStatuses.includes(order.status)) {
            return { success: false, message: `Cannot delete order in ${order.status} state` }
        }

        await prisma.order.delete({
            where: { id: orderId }
        })

        revalidatePath('/orders')
        return { success: true, message: "Order deleted successfully" }
    } catch (error: any) {
        console.error("deleteOrder error:", error)
        return { success: false, error: error.message || "Failed to delete order" }
    }
}
