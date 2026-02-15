import * as React from "react"
import { cn } from "@/lib/utils"

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
    action?: React.ReactNode
}

export function DashboardCard({ className, title, action, children, ...props }: DashboardCardProps) {
    return (
        <div
            className={cn(
                "bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md",
                className
            )}
            {...props}
        >
            {(title || action) && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    {title && <h3 className="text-sm font-semibold text-slate-700">{title}</h3>}
                    {action && <div className="flex items-center gap-2">{action}</div>}
                </div>
            )}
            <div className="flex-1 p-4">
                {children}
            </div>
        </div>
    )
}
