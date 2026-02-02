import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all orders with items
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        orderItems: true,
        delivery: {
          include: {
            driver: true,
          },
        },
      },
    })

    // Get all deliveries with driver info
    const deliveries = await prisma.delivery.findMany({
      include: {
        driver: true,
        order: {
          include: {
            orderItems: true,
          },
        },
      },
    })

    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)

    // Count orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Count deliveries by status
    const deliveriesByStatus = deliveries.reduce((acc, delivery) => {
      acc[delivery.status] = (acc[delivery.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Driver performance - who delivered more
    const driverStats = deliveries.reduce((acc, delivery) => {
      if (delivery.driver && delivery.status === 'DELIVERED') {
        const driverName = delivery.driver.name
        if (!acc[driverName]) {
          acc[driverName] = {
            name: driverName,
            deliveries: 0,
            revenue: 0,
          }
        }
        acc[driverName].deliveries++
        acc[driverName].revenue += delivery.order.totalAmount
      }
      return acc
    }, {} as Record<string, { name: string; deliveries: number; revenue: number }>)

    const driverPerformance = Object.values(driverStats)
      .sort((a, b) => b.deliveries - a.deliveries)

    // Revenue by customer
    const revenueByCustomer = orders.reduce((acc, order) => {
      const customerName = order.customer.name
      acc[customerName] = (acc[customerName] || 0) + order.totalAmount
      return acc
    }, {} as Record<string, number>)

    // Orders over time (last 30 days) - include all days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Create array of all dates in the last 30 days
    const allDates: Record<string, { count: number; revenue: number }> = {}
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      allDates[dateStr] = { count: 0, revenue: 0 }
    }

    // Fill in actual order data
    const recentOrders = orders.filter(
      order => new Date(order.orderDate) >= thirtyDaysAgo
    )

    recentOrders.forEach(order => {
      const date = new Date(order.orderDate).toISOString().split('T')[0]
      if (allDates[date]) {
        allDates[date].count++
        allDates[date].revenue += order.totalAmount
      }
    })

    const ordersByDate = allDates

    // Top products
    const productStats = orders.flatMap(o => o.orderItems).reduce((acc, item) => {
      if (!acc[item.productName]) {
        acc[item.productName] = { quantity: 0, revenue: 0 }
      }
      acc[item.productName].quantity += item.quantity
      acc[item.productName].revenue += item.totalAmount
      return acc
    }, {} as Record<string, { quantity: number; revenue: number }>)

    return NextResponse.json({
      totalOrders: orders.length,
      totalRevenue,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      ordersByStatus,
      deliveriesByStatus,
      driverPerformance,
      totalDeliveries: deliveries.length,
      completedDeliveries: deliveries.filter(d => d.status === 'DELIVERED').length,
      revenueByCustomer: Object.entries(revenueByCustomer)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, revenue]) => ({ name, revenue })),
      ordersByDate: Object.entries(ordersByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, ...data })),
      topProducts: Object.entries(productStats)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(([name, data]) => ({ name, ...data })),
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
