"use client"

import { Separator } from "@/components/ui/separator"
import { useI18n } from '@/locales/client'

interface FleetStatsProps {
    total: number
    available: number
    inUse: number
    maintenance: number
}

export function FleetStatsBar({ total, available, inUse, maintenance }: FleetStatsProps) {
    const t = useI18n()

    return (
        <div className="flex items-center gap-4 text-sm font-medium bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
                <span className="text-slate-500">{t('Fleet.stats.totalFleet')}</span>
                <span className="text-slate-900 font-bold">{total} {t('Fleet.stats.units')}</span>
            </div>

            <Separator orientation="vertical" className="h-4 bg-slate-300" />

            <div className="flex items-center gap-2">
                <span className="text-slate-500">{t('Fleet.stats.available')}</span>
                <span className="text-emerald-600 font-bold">{available} {t('Fleet.stats.units')}</span>
            </div>

            <Separator orientation="vertical" className="h-4 bg-slate-300" />

            <div className="flex items-center gap-2">
                <span className="text-slate-500">{t('Fleet.stats.enRoute')}</span>
                <span className="text-sky-600 font-bold">{inUse} {t('Fleet.stats.units')}</span>
            </div>

            <Separator orientation="vertical" className="h-4 bg-slate-300" />

            <div className="flex items-center gap-2">
                <span className="text-slate-500">{t('Fleet.stats.maintenance')}</span>
                <span className="text-amber-600 font-bold">{maintenance} {t('Fleet.stats.units')}</span>
            </div>
        </div>
    )
}
