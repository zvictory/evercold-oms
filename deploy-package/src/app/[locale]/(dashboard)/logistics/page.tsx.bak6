import { LogisticsSidebar } from "@/components/logistics/LogisticsSidebar"
import { LogisticsMap } from "@/components/logistics/LogisticsMap"

export default function LogisticsPage() {
    return (
        <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-50">
            {/* Left Sidebar (30% width on large screens) */}
            <div className="w-[350px] lg:w-[400px] shrink-0 h-full overflow-hidden border-r border-slate-200 shadow-sm z-20 relative">
                <LogisticsSidebar />
            </div>

            {/* Map Area (Remaining space) */}
            <div className="flex-1 h-full relative bg-slate-100">
                <LogisticsMap />
            </div>
        </div>
    )
}
