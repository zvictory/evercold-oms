import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SAP_CODES } from '@/lib/constants'
import { format, subDays, startOfDay, isSameDay } from 'date-fns'

/**
 * GET /api/dashboard/revenue-chart
 * Returns 7-day revenue data grouped by product type (3kg vs 1kg ice)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Calculate date range (last 7 days)
    const today = startOfDay(new Date())
    const sevenDaysAgo = subDays(today, 6) // Include today = 7 days total
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // 2. Fetch delivered orders with items
    let deliveries: any[] = []
    try {
      deliveries = await prisma.delivery.findMany({
        where: {
          status: 'DELIVERED',
          deliveryTime: {
            gte: sevenDaysAgo,
            not: null
          }
        },
        include: {
          deliveryItems: {
            include: {
              orderItem: {
                include: {
                  product: true
                }
              }
            }
          }
        }
      })
    } catch (dbError: any) {
      // If delivery query fails (schema mismatch), return empty data
      console.warn('Failed to fetch deliveries, returning empty revenue data:', dbError.message)
      deliveries = []
    }

    // 3. Create map of dates to revenue data
    const revenueByDate = new Map<string, { small: number; large: number }>()

    // Initialize all 7 days with zeros
    for (let i = 0; i < 7; i++) {
      const date = subDays(today, 6 - i)
      const dateKey = format(date, 'yyyy-MM-dd')
      revenueByDate.set(dateKey, { small: 0, large: 0 })
    }

    // 4. Aggregate revenue by date and product type
    for (const delivery of deliveries) {
      if (!delivery.deliveryTime) continue

      const dateKey = format(startOfDay(delivery.deliveryTime), 'yyyy-MM-dd')
      const dayData = revenueByDate.get(dateKey)

      if (!dayData) continue // Skip if outside 7-day range

      for (const item of delivery.deliveryItems) {
        const sapCode = item.orderItem?.product?.sapCode
        const quantity = item.deliveredQuantity
        const unitPrice = item.orderItem?.unitPrice || 0
        const revenue = quantity * unitPrice

        if (sapCode === SAP_CODES.ICE_3KG) {
          dayData.large += revenue
        } else if (sapCode === SAP_CODES.ICE_1KG) {
          dayData.small += revenue
        } else if (sapCode) {
          // Unknown product - log warning but don't fail
          console.warn(`Unknown SAP code in revenue calculation: ${sapCode}`)
        }
      }
    }

    // 5. Format response for chart (sorted chronologically)
    const data = Array.from(revenueByDate.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([dateKey, values], index) => {
        const date = new Date(dateKey)
        const dayName = format(date, 'EEE') // Mon, Tue, Wed...

        return {
          name: dayName,
          small: Math.round(values.small), // Round to whole numbers
          large: Math.round(values.large)
        }
      })

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Revenue chart API error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch revenue data',
        code: 'REVENUE_CHART_ERROR'
      },
      { status: 500 }
    )
  }
}
