# Executive Dashboard Real Data Design

**Date:** 2026-01-28
**Status:** Approved
**Purpose:** Replace dummy data on Executive Dashboard with real database metrics

---

## Overview

Convert the Executive Dashboard (`/src/app/page.tsx`) from hardcoded demo data to real-time metrics fetched from the database. The dashboard displays operational KPIs: today's volume, active fleet, branch coverage, service health, and recent activity.

---

## Current State

**Problems:**
- All metrics are hardcoded static values
- Activity feed shows fake events with fake timestamps
- No connection to actual operational data
- Misleading for stakeholders viewing the dashboard

**Affected Components:**
- `/src/app/page.tsx` - Main dashboard page with hardcoded metrics
- `/src/components/dashboard/ActivityFeed.tsx` - Static activity list

---

## Design

### 1. API Architecture

**New Endpoint:** `GET /api/dashboard/executive`

Single endpoint returns all dashboard metrics in one request to minimize latency and database load.

**Response Structure:**
```typescript
{
  todaysVolume: {
    total: number,        // Sum of OrderItem.quantity from today
    comparison: number,   // Yesterday's volume for comparison
    change: number        // Percentage change vs yesterday
  },
  activeFleet: {
    active: number,       // Deliveries with IN_TRANSIT status today
    total: number,        // Vehicles with AVAILABLE or IN_USE status
    percentage: number    // active/total * 100
  },
  branchCoverage: {
    served: number,       // Unique branchIds from today's orders
    total: number,        // Active branches (isActive = true)
    percentage: number    // served/total * 100
  },
  serviceHealth: {
    critical: number,     // Critical tickets past SLA response time
    tickets: Array<{      // Details for display
      ticketNumber: string,
      branchName: string,
      createdAt: Date,
      hoursOverdue: number
    }>
  },
  recentActivity: Array<{
    id: string,
    type: 'order' | 'delivery' | 'ticket' | 'route',
    message: string,
    timestamp: Date,
    icon: string,
    color: string
  }>
}
```

**Benefits:**
- Single API call = faster page load
- All calculations server-side
- Easy to cache if needed
- Consistent data (all metrics from same moment)

---

### 2. Data Fetching Implementation

**File:** `/src/app/api/dashboard/executive/route.ts`

#### Today's Volume Calculation

```typescript
// Get today's date range (00:00:00 to 23:59:59 local time)
const today = new Date()
today.setHours(0, 0, 0, 0)
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

// Sum quantities from order items where order.orderDate is today
const todaysOrders = await prisma.order.findMany({
  where: {
    orderDate: { gte: today, lt: tomorrow }
  },
  include: { orderItems: true }
})

const todaysVolume = todaysOrders
  .flatMap(o => o.orderItems)
  .reduce((sum, item) => sum + item.quantity, 0)

// Get yesterday's volume for comparison
const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)

const yesterdaysOrders = await prisma.order.findMany({
  where: {
    orderDate: { gte: yesterday, lt: today }
  },
  include: { orderItems: true }
})

const yesterdaysVolume = yesterdaysOrders
  .flatMap(o => o.orderItems)
  .reduce((sum, item) => sum + item.quantity, 0)

const change = yesterdaysVolume > 0
  ? ((todaysVolume - yesterdaysVolume) / yesterdaysVolume) * 100
  : 0
```

**Metric:** Shows total product units shipped today (e.g., "1,250 units")

---

#### Active Fleet Calculation

```typescript
// Count deliveries currently in transit
const activeDeliveries = await prisma.delivery.count({
  where: {
    status: 'IN_TRANSIT',
    updatedAt: { gte: today } // Only today's active deliveries
  }
})

// Count total available/in-use vehicles
const totalVehicles = await prisma.vehicle.count({
  where: {
    status: { in: ['AVAILABLE', 'IN_USE'] }
  }
})

const percentage = totalVehicles > 0
  ? (activeDeliveries / totalVehicles) * 100
  : 0
```

**Metric:** Shows "12 / 31" trucks currently en route

---

#### Branch Coverage Calculation

```typescript
// Get unique branches that received orders today
const branchesServedToday = await prisma.orderItem.findMany({
  where: {
    order: {
      orderDate: { gte: today, lt: tomorrow }
    },
    branchId: { not: null }
  },
  distinct: ['branchId'],
  select: { branchId: true }
})

const served = branchesServedToday.length

// Count total active branches
const totalBranches = await prisma.customerBranch.count({
  where: { isActive: true }
})

const percentage = totalBranches > 0
  ? (served / totalBranches) * 100
  : 0
```

**Metric:** Shows "28/31 branches served" (92%)

---

### 3. Service Health Implementation

#### Critical Overdue Tickets

```typescript
const now = new Date()

// Get critical tickets past their SLA response time
const criticalTickets = await prisma.serviceTicket.findMany({
  where: {
    priority: 'CRITICAL',
    status: { not: 'RESOLVED' },
    createdAt: {
      // Default slaResponseCritical is 60 minutes
      // Tickets created > 60 min ago are overdue
      lt: new Date(now.getTime() - 60 * 60 * 1000)
    }
  },
  include: {
    branch: { select: { branchName: true, branchCode: true } },
    subcategory: {
      select: {
        name: true,
        slaResponseCritical: true,
        category: { select: { name: true } }
      }
    }
  },
  orderBy: { createdAt: 'asc' } // Oldest first (most overdue)
})

// Calculate hours overdue for each ticket
const ticketsWithOverdue = criticalTickets.map(ticket => {
  const slaMinutes = ticket.subcategory?.slaResponseCritical || 60
  const deadlineTime = new Date(ticket.createdAt.getTime() + slaMinutes * 60 * 1000)
  const hoursOverdue = Math.max(0, (now.getTime() - deadlineTime.getTime()) / (1000 * 60 * 60))

  return {
    ticketNumber: ticket.ticketNumber,
    branchName: ticket.branch?.branchName || 'Unknown',
    branchCode: ticket.branch?.branchCode || '',
    createdAt: ticket.createdAt,
    hoursOverdue: Math.round(hoursOverdue * 10) / 10 // Round to 1 decimal
  }
})
```

**Metric:** Shows "3 Critical" tickets > 4h overdue

---

### 4. Recent Activity Feed

#### Mixed Event Stream

Fetch latest events from multiple sources and combine:

```typescript
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

const [newOrders, completedDeliveries, criticalTickets, activeRoutes] =
  await Promise.all([
    // Latest orders created
    prisma.order.findMany({
      where: { createdAt: { gte: twoHoursAgo } },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 3
    }),

    // Recently completed deliveries
    prisma.delivery.findMany({
      where: {
        status: 'DELIVERED',
        deliveryTime: { gte: twoHoursAgo, not: null }
      },
      include: {
        order: { include: { customer: true } },
        driver: true
      },
      orderBy: { deliveryTime: 'desc' },
      take: 3
    }),

    // New critical tickets
    prisma.serviceTicket.findMany({
      where: {
        priority: 'CRITICAL',
        createdAt: { gte: twoHoursAgo }
      },
      include: { branch: true },
      orderBy: { createdAt: 'desc' },
      take: 2
    }),

    // Routes started today
    prisma.deliveryRoute.findMany({
      where: {
        status: 'IN_PROGRESS',
        actualStartTime: { gte: today, not: null }
      },
      include: { driver: true, vehicle: true },
      orderBy: { actualStartTime: 'desc' },
      take: 2
    })
  ])

// Transform to unified activity format
const activities: Activity[] = []

// Add order activities
newOrders.forEach(order => {
  activities.push({
    id: `order-${order.id}`,
    type: 'order',
    message: `Order #${order.orderNumber} uploaded via ${order.sourceType === 'REGISTRY' ? 'Registry Import' : 'Email'}`,
    timestamp: order.createdAt,
    icon: 'FileText',
    color: 'text-indigo-500 bg-indigo-50',
    border: 'border-indigo-100'
  })
})

// Add delivery activities
completedDeliveries.forEach(delivery => {
  activities.push({
    id: `delivery-${delivery.id}`,
    type: 'delivery',
    message: `Driver ${delivery.driver?.name || 'Unknown'} completed delivery to ${delivery.order.customer.name}`,
    timestamp: delivery.deliveryTime!,
    icon: 'Truck',
    color: 'text-sky-500 bg-sky-50',
    border: 'border-sky-100'
  })
})

// Add ticket activities
criticalTickets.forEach(ticket => {
  activities.push({
    id: `ticket-${ticket.id}`,
    type: 'alert',
    message: `Critical Ticket ${ticket.ticketNumber} created for Branch ${ticket.branch?.branchCode}`,
    timestamp: ticket.createdAt,
    icon: 'AlertCircle',
    color: 'text-red-500 bg-red-50',
    border: 'border-red-100'
  })
})

// Add route activities
activeRoutes.forEach(route => {
  activities.push({
    id: `route-${route.id}`,
    type: 'success',
    message: `Route "${route.routeName}" started by ${route.driver.name}`,
    timestamp: route.actualStartTime!,
    icon: 'CheckCircle2',
    color: 'text-emerald-500 bg-emerald-50',
    border: 'border-emerald-100'
  })
})

// Sort by timestamp (most recent first) and take top 10
const recentActivity = activities
  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  .slice(0, 10)
  .map(activity => ({
    ...activity,
    // Format relative time
    time: formatDistanceToNow(activity.timestamp, { addSuffix: true })
  }))
```

**Display:** Shows latest 10 events from all sources, sorted by time

---

### 5. Frontend Implementation

#### Dashboard Page Updates

**File:** `/src/app/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'

interface DashboardData {
  todaysVolume: {
    total: number
    comparison: number
    change: number
  }
  activeFleet: {
    active: number
    total: number
    percentage: number
  }
  branchCoverage: {
    served: number
    total: number
    percentage: number
  }
  serviceHealth: {
    critical: number
    tickets: Array<any>
  }
  recentActivity: Array<any>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard/executive')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setData(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error || !data) {
    return <ErrorDisplay error={error} />
  }

  return (
    <div className="space-y-6">
      {/* Header stays the same */}

      <DashboardGrid>
        {/* Today's Volume - REAL DATA */}
        <DashboardCard className="col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Today's Volume</span>
            <Badge variant={data.todaysVolume.change >= 0 ? "success" : "destructive"}>
              <TrendingUp className="h-3 w-3" />
              {data.todaysVolume.change >= 0 ? '+' : ''}{data.todaysVolume.change.toFixed(1)}%
            </Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {data.todaysVolume.total.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-slate-500">units</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Vs. {data.todaysVolume.comparison.toLocaleString()} units yesterday
          </p>
        </DashboardCard>

        {/* Active Fleet - REAL DATA */}
        <DashboardCard className="col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Active Fleet</span>
            <Truck className="h-4 w-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{data.activeFleet.active}</span>
            <span className="text-lg text-slate-400">/ {data.activeFleet.total}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full"
              style={{ width: `${data.activeFleet.percentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">Trucks currently en route</p>
        </DashboardCard>

        {/* Branch Coverage - REAL DATA */}
        <DashboardCard className="col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Branch Coverage</span>
            <Store className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {data.branchCoverage.percentage.toFixed(0)}%
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {data.branchCoverage.served}/{data.branchCoverage.total} branches served today
          </p>
        </DashboardCard>

        {/* Service Health - REAL DATA */}
        <DashboardCard
          className={cn(
            "col-span-1",
            data.serviceHealth.critical > 0 && "border-red-100 bg-red-50/10"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Service Health</span>
            {data.serviceHealth.critical > 0 && (
              <Badge variant="destructive" className="animate-pulse">Action Req</Badge>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-3xl font-bold",
              data.serviceHealth.critical > 0 ? "text-red-600" : "text-emerald-600"
            )}>
              {data.serviceHealth.critical}
            </span>
            <span className="text-sm font-medium text-slate-500">Critical</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {data.serviceHealth.critical > 0
              ? "Open tickets past SLA deadline"
              : "All tickets within SLA"}
          </p>
        </DashboardCard>

        {/* Live Route Map - Keep as placeholder */}

        {/* Recent Activity - REAL DATA */}
        <DashboardCard title="Recent Activity" className="col-span-1 md:col-span-1 lg:col-span-1 row-span-2">
          <ActivityFeed activities={data.recentActivity} />
        </DashboardCard>
      </DashboardGrid>
    </div>
  )
}
```

---

#### ActivityFeed Component Updates

**File:** `/src/components/dashboard/ActivityFeed.tsx`

```typescript
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Truck, AlertCircle, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface Activity {
  id: string
  type: 'delivery' | 'order' | 'alert' | 'success'
  message: string
  time: string
  icon: string
  color: string
  border: string
}

interface ActivityFeedProps {
  activities: Activity[]
}

const iconMap = {
  Truck,
  FileText,
  AlertCircle,
  CheckCircle2
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p className="text-sm">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = iconMap[activity.icon as keyof typeof iconMap]

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-slate-50 hover:bg-slate-50/50 transition-colors"
          >
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
              activity.color,
              activity.border
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 line-clamp-2 md:line-clamp-1">
                {activity.message}
              </p>
              <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

---

### 6. Loading & Error States

**Loading Skeleton:**
```typescript
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
```

**Error Display:**
```typescript
function ErrorDisplay({ error }: { error: string | null }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Failed to load dashboard
        </h3>
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    </div>
  )
}
```

---

## Files to Create

1. `/src/app/api/dashboard/executive/route.ts` - New API endpoint
2. `/src/lib/utils/dashboard.ts` - Helper functions for calculations

## Files to Modify

1. `/src/app/page.tsx` - Replace hardcoded values with API data
2. `/src/components/dashboard/ActivityFeed.tsx` - Accept activities prop
3. `/src/components/dashboard/DashboardCard.tsx` - May need className prop

---

## Testing Strategy

### Manual Testing

1. **Empty Database Test:**
   - Clear all orders/deliveries
   - Verify dashboard shows "0" gracefully
   - No division by zero errors

2. **Data Population Test:**
   - Add orders for today
   - Verify volume increases
   - Check yesterday comparison works

3. **Real-time Updates:**
   - Open dashboard
   - Create new order in another tab
   - Wait 30 seconds, verify count updates

4. **Edge Cases:**
   - Test with single branch
   - Test with 100% coverage
   - Test with 0 vehicles
   - Test with all tickets resolved

### Database Verification Scripts

```bash
# Check today's volume
node scripts/check-todays-orders.js

# Check active deliveries
node scripts/check-active-fleet.js

# Check branch coverage
node scripts/check-branch-coverage.js

# Check critical tickets
node scripts/check-critical-tickets.js
```

---

## Performance Considerations

**Query Optimization:**
- Use `include` carefully (only fetch needed relations)
- Add database indexes on frequently queried fields:
  - `Order.orderDate`
  - `Delivery.status`
  - `Delivery.updatedAt`
  - `ServiceTicket.priority`
  - `ServiceTicket.status`

**Caching Strategy (Future):**
- Consider Redis cache with 30s TTL
- Invalidate on writes to relevant tables
- Would reduce database load for multiple users

**Current Approach:**
- Direct database queries
- Frontend auto-refresh every 30s
- Acceptable for current user count
- Monitor performance as users scale

---

## Migration Notes

**No Database Migrations Required:**
- Uses existing schema
- No new tables or columns needed
- Pure read-only queries

**Rollback Plan:**
- Keep original hardcoded values in git history
- Can revert `/src/app/page.tsx` if issues arise
- API endpoint is new, can be deleted without affecting other pages

---

## Success Criteria

✅ Dashboard displays real data from database
✅ All metrics update automatically every 30 seconds
✅ Loading states show during data fetch
✅ Error states handle API failures gracefully
✅ No performance degradation (< 500ms API response)
✅ Works correctly with empty database
✅ Activity feed shows diverse event types
✅ Comparison percentages calculated correctly

---

## Future Enhancements

1. **Date Range Selector:** Allow viewing metrics for different dates
2. **Drill-Down Links:** Click metrics to see detailed views
3. **Export Reports:** Download dashboard data as PDF/CSV
4. **Real-time WebSocket:** Push updates instead of polling
5. **Custom Alerts:** Notify when critical thresholds exceeded
6. **Historical Trends:** Show 7-day or 30-day trend charts
