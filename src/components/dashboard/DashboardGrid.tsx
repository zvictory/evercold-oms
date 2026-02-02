import * as React from "react"
import { cn } from "@/lib/utils"

interface DashboardGridProps extends React.HTMLAttributes<HTMLDivElement> { }

export function DashboardGrid({ className, children, ...props }: DashboardGridProps) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}
