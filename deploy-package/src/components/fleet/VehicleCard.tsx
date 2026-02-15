"use client"

import { Truck, User, Settings, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface VehicleCardProps {
    id: string
    plateNumber: string
    model: string
    type: string
    status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | string
    driverName?: string | null
    deliveryCount: number
    capacity?: number | null
    currentLoad?: {
        weight: number
        percentage: number
        itemCount: number
    } | null
    onEdit: (id: string) => void
}

export function VehicleCard({
    id,
    plateNumber,
    model,
    type,
    status,
    driverName,
    deliveryCount,
    capacity,
    currentLoad,
    onEdit
}: VehicleCardProps) {

    // Status styling logic
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return {
                    border: 'border-emerald-200',
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-700',
                    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
                    icon: 'text-emerald-500'
                }
            case 'IN_USE':
                return {
                    border: 'border-blue-200',
                    bg: 'bg-blue-50',
                    text: 'text-blue-700',
                    badge: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
                    icon: 'text-blue-500'
                }
            case 'MAINTENANCE':
                return {
                    border: 'border-amber-200',
                    bg: 'bg-amber-50',
                    text: 'text-amber-700',
                    badge: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
                    icon: 'text-amber-500'
                }
            default:
                return {
                    border: 'border-slate-200',
                    bg: 'bg-slate-50',
                    text: 'text-slate-700',
                    badge: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100',
                    icon: 'text-slate-400'
                }
        }
    }

    const styles = getStatusStyles(status)

    return (
        <div className={`group relative bg-white rounded-xl border ${styles.border} shadow-sm transition-all hover:shadow-md overflow-hidden flex flex-col`}>
            {/* Status Stripe */}
            <div className={`absolute top-0 left-0 w-1 h-full ${styles.bg.replace('bg-', 'bg-').replace('50', '500')}`}></div>

            <div className="p-5 flex-1">
                {/* Header */}
                <div className="flex justify-between items-start mb-4 pl-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Truck className={`h-4 w-4 ${styles.icon}`} />
                            <h3 className="text-lg font-bold font-mono text-slate-900 tracking-tight">{plateNumber}</h3>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{model}</p>
                    </div>
                    <Badge variant="outline" className={`${styles.badge} py-0.5 px-2 text-[10px] uppercase tracking-wider font-bold`}>
                        {status.replace('_', ' ')}
                    </Badge>
                </div>

                {/* Content */}
                <div className="space-y-4 pl-2">
                    {/* Driver Info */}
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-slate-100">
                            <AvatarImage src={`https://avatar.vercel.sh/${driverName || 'u'}.png`} />
                            <AvatarFallback className="bg-slate-100 text-slate-500 text-xs">
                                <User className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Assigned Driver</p>
                            <p className={`text-sm font-medium ${driverName ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                                {driverName || 'Unassigned'}
                            </p>
                        </div>
                    </div>

                    {/* Capacity Visual */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-medium text-slate-500">
                            <span>Load Capacity</span>
                            {capacity && currentLoad ? (
                                <span>{currentLoad.weight}kg / {capacity}kg</span>
                            ) : (
                                <span>{capacity ? `${capacity}kg Max` : 'Not Set'}</span>
                            )}
                        </div>
                        <Progress
                            value={currentLoad?.percentage || 0}
                            className="h-1.5 bg-slate-100"
                            indicatorClassName={cn(
                                !currentLoad || currentLoad.percentage === 0 ? 'bg-slate-200' :
                                currentLoad.percentage <= 60 ? 'bg-slate-900' :
                                currentLoad.percentage <= 80 ? 'bg-amber-500' :
                                'bg-red-500'
                            )}
                        />
                        {currentLoad && currentLoad.percentage > 0 && (
                            <p className="text-[10px] text-slate-400">
                                {currentLoad.itemCount} items loaded
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50/50 border-t border-slate-100 px-5 py-3 flex items-center justify-between pl-7">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Settings className="h-3 w-3" />
                    {deliveryCount} Deliveries
                </span>
                <Button variant="ghost" size="sm" onClick={() => onEdit(id)} className="h-7 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
                    <Edit className="h-3 w-3 mr-1.5" />
                    Edit
                </Button>
            </div>
        </div>
    )
}
