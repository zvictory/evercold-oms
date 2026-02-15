"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { GripVertical, MapPin, Package, Clock, Truck } from "lucide-react"

const unassignedOrders = [
    {
        id: "ORD-2505",
        branch: "Korzinka Chilanzar",
        region: "Chilanzar District",
        weight: 1200,
        time: "10:30 AM",
        priority: "high"
    },
    {
        id: "ORD-2506",
        branch: "Korzinka Qatortol",
        region: "Chilanzar District",
        weight: 850,
        time: "10:45 AM",
        priority: "normal"
    },
    {
        id: "ORD-2508",
        branch: "Korzinka Integro",
        region: "Chilanzar District",
        weight: 2000,
        time: "11:15 AM",
        priority: "normal"
    },
    {
        id: "ORD-2502",
        branch: "Korzinka Sergeli",
        region: "Sergeli District",
        weight: 500,
        time: "09:00 AM",
        priority: "low"
    },
    {
        id: "ORD-2503",
        branch: "Korzinka Sputnik",
        region: "Sergeli District",
        weight: 1500,
        time: "09:30 AM",
        priority: "normal"
    }
]

export function LogisticsSidebar() {
    const t = useTranslations("Logistics")

    return (
        <div className="flex flex-col h-full border-r border-slate-200 bg-white w-full">
            <div className="p-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">{t("sidebar.unassignedOrders")}</h2>
                <p className="text-sm text-slate-500">{t("sidebar.dragToAssign")}</p>
                <div className="mt-4 flex gap-2">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 rounded-md">
                        {t("sidebar.ordersCount", { count: unassignedOrders.length })}
                    </Badge>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 rounded-md">
                        6,050 kg Total
                    </Badge>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Group 1: Chilanzar */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
                            {t("sidebar.branchDistrict", { name: "Chilanzar", count: "3" })}
                        </h3>
                        <div className="space-y-3">
                            {unassignedOrders.filter(o => o.region.includes('Chilanzar')).map((order) => (
                                <div
                                    key={order.id}
                                    className="group relative bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:border-sky-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                                >
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100">
                                        <GripVertical className="h-4 w-4" />
                                    </div>
                                    <div className="pl-6">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-slate-900 text-sm">{order.branch}</span>
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">{order.id}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {order.time}</span>
                                            <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {order.weight} kg</span>
                                        </div>
                                        {order.priority === 'high' && (
                                            <Badge className="bg-orange-50 text-orange-700 border-orange-100 h-5 text-[10px]">{t("sidebar.highPriority")}</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Group 2: Sergeli */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
                            {t("sidebar.branchDistrict", { name: "Sergeli", count: "2" })}
                        </h3>
                        <div className="space-y-3">
                            {unassignedOrders.filter(o => o.region.includes('Sergeli')).map((order) => (
                                <div
                                    key={order.id}
                                    className="group relative bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:border-sky-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                                >
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100">
                                        <GripVertical className="h-4 w-4" />
                                    </div>
                                    <div className="pl-6">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-slate-900 text-sm">{order.branch}</span>
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">{order.id}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {order.time}</span>
                                            <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {order.weight} kg</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-slate-200 bg-slate-50">
                <Button variant="outline" className="w-full gap-2 border-dashed border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 bg-transparent">
                    <Truck className="h-4 w-4" /> {t("sidebar.autoAssignAll")}
                </Button>
            </div>
        </div>
    )
}
