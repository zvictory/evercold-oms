"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardGrid } from "@/components/dashboard/DashboardGrid"
import { DashboardCard } from "@/components/dashboard/DashboardCard"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { ArrowUpRight, TrendingUp, Truck, AlertCircle, MapPin, Store } from "lucide-react"
import { cn, fetchWithAuth } from "@/lib/utils"
import { useI18n } from '@/locales/client'

// Lazy load heavy chart component to improve initial page load
const RevenueChart = dynamic(
  () => import("@/components/dashboard/RevenueChart").then(mod => ({ default: mod.RevenueChart })),
  {
    loading: () => <div className="h-[300px] w-full animate-pulse bg-slate-100 rounded-md" />,
    ssr: false
  }
)

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
  recentActivity: Array<any>
}

export default function DashboardPage() {
  const t = useI18n()
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
      const res = await fetchWithAuth('/api/dashboard/executive', {
      })
      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      const data = await res.json()
      setData(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {t('Dashboard.errorTitle')}
          </h3>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>{t('Dashboard.retry')}</Button>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('Dashboard.title')}</h1>
          <p className="text-slate-500">{t('Dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">{t('Dashboard.exportReport')}</Button>
          <Button>{t('Dashboard.createOrder')}</Button>
        </div>
      </div>

      {/* Bento Grid */}
      <DashboardGrid>
        {/* Metric 1: Today's Volume */}
        <DashboardCard className="col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">{t('Dashboard.metrics.todaysVolume.title')}</span>
            <Badge variant={data.todaysVolume.change >= 0 ? "success" : "destructive"} className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {data.todaysVolume.change >= 0 ? '+' : ''}{data.todaysVolume.change.toFixed(1)}%
            </Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{data.todaysVolume.total.toLocaleString()}</span>
            <span className="text-sm font-medium text-slate-500">{t('Dashboard.metrics.todaysVolume.units')}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{t('Dashboard.metrics.todaysVolume.comparisonPrefix')} {data.todaysVolume.comparison.toLocaleString()} {t('Dashboard.metrics.todaysVolume.comparisonSuffix')}</p>
        </DashboardCard>

        {/* Metric 2: Active Fleet */}
        <DashboardCard className="col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">{t('Dashboard.metrics.activeFleet.title')}</span>
            <Truck className="h-4 w-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{data.activeFleet.active}</span>
            <span className="text-lg text-slate-400">/ {data.activeFleet.total}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full" style={{ width: `${data.activeFleet.percentage}%` }}></div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{t('Dashboard.metrics.activeFleet.description')}</p>
        </DashboardCard>

        {/* Metric 3: Branch Coverage */}
        <DashboardCard className="col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">{t('Dashboard.metrics.branchCoverage.title')}</span>
            <Store className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{data.branchCoverage.percentage.toFixed(0)}%</div>
          <p className="text-xs text-slate-400 mt-1">{t('Dashboard.metrics.branchCoverage.descriptionPrefix') && `${t('Dashboard.metrics.branchCoverage.descriptionPrefix')} `}{data.branchCoverage.served}/{data.branchCoverage.total} {t('Dashboard.metrics.branchCoverage.descriptionSuffix')}</p>
        </DashboardCard>

        {/* Metric 4: Service Health */}
        {/* Widget 1: Live Route Map (Placeholder) */}
        <DashboardCard title={t('Dashboard.widgets.liveRouteMap.title')} action={<Badge variant="outline" className="gap-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div> {t('Dashboard.widgets.liveRouteMap.live')}</Badge>} className="col-span-1 md:col-span-2 lg:col-span-3 min-h-[400px]">
          <div className="h-full w-full bg-slate-100/50 rounded-md flex flex-col items-center justify-center border border-dashed border-slate-200 relative overflow-hidden group">
            {/* Fake Map Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="z-10 text-center">
              <div className="h-16 w-16 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <MapPin className="h-8 w-8 text-sky-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">{t('Dashboard.widgets.liveRouteMap.integrationTitle')}</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">{t('Dashboard.widgets.liveRouteMap.integrationDescription')}</p>
              <Button variant="outline" className="gap-2">
                {t('Dashboard.widgets.liveRouteMap.configureApiKey')} <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DashboardCard>

        {/* Widget 2: Recent Activity Feed */}
        <DashboardCard title={t('Dashboard.widgets.recentActivity.title')} className="col-span-1 md:col-span-1 lg:col-span-1 row-span-2">
          <ActivityFeed activities={data.recentActivity} />
          <div className="mt-4 pt-3 border-t border-slate-50">
            <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:text-slate-900">{t('Dashboard.widgets.recentActivity.viewAllLog')}</Button>
          </div>
        </DashboardCard>

        {/* Widget 3: Revenue Chart */}
        <DashboardCard title={t('Dashboard.widgets.revenueChart.title')} className="col-span-1 md:col-span-2 lg:col-span-3 min-h-[350px]">
          <RevenueChart />
        </DashboardCard>

      </DashboardGrid>
    </div>
  )
}
