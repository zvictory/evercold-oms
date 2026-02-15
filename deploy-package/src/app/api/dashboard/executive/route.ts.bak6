import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatDistanceToNow } from 'date-fns'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    // Execute all queries in parallel using Prisma
    const [
      todaysOrders,
      yesterdaysOrders,
      activeVehicles,
      activeDeliveries,
      totalBranches,
      recentOrders,
      completedDeliveries,
      activeRoutes,
    ] = await Promise.all([
      // Today's orders
      prisma.orderItem.aggregate({
        _sum: { quantity: true },
        where: {
          order: {
            orderDate: { gte: today, lt: tomorrow },
          },
        },
      }),

      // Yesterday's orders
      prisma.orderItem.aggregate({
        _sum: { quantity: true },
        where: {
          order: {
            orderDate: { gte: yesterday, lt: today },
          },
        },
      }),

      // Active vehicles
      prisma.vehicle.count({
        where: { status: { in: ['AVAILABLE', 'IN_USE'] } },
      }),

      // Active deliveries
      prisma.delivery.count({
        where: {
          status: 'IN_TRANSIT',
          updatedAt: { gte: today },
        },
      }),

      // Total active branches
      prisma.customerBranch.count({
        where: { isActive: true },
      }),

      // Recent orders
      prisma.order.findMany({
        where: { createdAt: { gte: twoHoursAgo } },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),

      // Completed deliveries
      prisma.delivery.findMany({
        where: {
          status: 'DELIVERED',
          deliveryTime: { gte: twoHoursAgo },
        },
        include: {
          order: { include: { customer: { select: { name: true } } } },
          driver: { select: { name: true } },
        },
        orderBy: { deliveryTime: 'desc' },
        take: 3,
      }),

      // Active routes
      prisma.deliveryRoute.findMany({
        where: {
          status: 'IN_PROGRESS',
          actualStartTime: { gte: today },
        },
        include: {
          driver: { select: { name: true } },
          vehicle: { select: { plateNumber: true } },
        },
        orderBy: { actualStartTime: 'desc' },
        take: 2,
      }),
    ])

    // Calculate metrics
    const todaysVolume = todaysOrders._sum.quantity || 0
    const yesterdaysVolume = yesterdaysOrders._sum.quantity || 0
    const volumeChange = yesterdaysVolume > 0
      ? ((todaysVolume - yesterdaysVolume) / yesterdaysVolume) * 100
      : 0

    const fleetPercentage = activeVehicles > 0
      ? (activeDeliveries / activeVehicles) * 100
      : 0

    // Count branches served today
    const servedBranches = await prisma.orderItem.findMany({
      distinct: ['branchId'],
      where: {
        branchId: { not: null },
        order: {
          orderDate: { gte: today, lt: tomorrow },
        },
      },
      select: { branchId: true },
    })

    const coveragePercentage = totalBranches > 0
      ? (servedBranches.length / totalBranches) * 100
      : 0

    // Build activity feed
    const activities: any[] = []

    // Add orders
    recentOrders.forEach((order) => {
      activities.push({
        id: `order-${order.id}`,
        type: 'order',
        message: `Order #${order.orderNumber} created`,
        timestamp: order.createdAt,
        icon: 'FileText',
        color: 'text-indigo-500 bg-indigo-50',
        border: 'border-indigo-100',
      })
    })

    // Add deliveries
    completedDeliveries.forEach((delivery) => {
      activities.push({
        id: `delivery-${delivery.id}`,
        type: 'delivery',
        message: `Delivery completed to ${delivery.order.customer.name}`,
        timestamp: delivery.deliveryTime,
        icon: 'Truck',
        color: 'text-sky-500 bg-sky-50',
        border: 'border-sky-100',
      })
    })

    // Add routes
    activeRoutes.forEach((route) => {
      activities.push({
        id: `route-${route.id}`,
        type: 'success',
        message: `Route "${route.routeName}" started by ${route.driver?.name || 'Unknown'}`,
        timestamp: route.actualStartTime,
        icon: 'CheckCircle2',
        color: 'text-emerald-500 bg-emerald-50',
        border: 'border-emerald-100',
      })
    })

    // Sort and format
    const recentActivity = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map((activity) => ({
        ...activity,
        time: formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }),
      }))

    return NextResponse.json({
      todaysVolume: {
        total: todaysVolume,
        comparison: yesterdaysVolume,
        change: volumeChange,
      },
      activeFleet: {
        active: activeDeliveries,
        total: activeVehicles,
        percentage: fleetPercentage,
      },
      branchCoverage: {
        served: servedBranches.length,
        total: totalBranches,
        percentage: coveragePercentage,
      },
      recentActivity,
    })
  } catch (error: any) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
