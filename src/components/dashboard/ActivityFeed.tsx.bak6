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
      {activities.map((item) => {
        const Icon = iconMap[item.icon as keyof typeof iconMap] || FileText

        return (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-slate-50 hover:bg-slate-50/50 transition-colors"
          >
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
              item.color,
              item.border
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 line-clamp-2 md:line-clamp-1">
                {item.message}
              </p>
              <p className="text-xs text-slate-400 mt-1">{item.time}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
