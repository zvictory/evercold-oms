import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface UnifiedStatusBadgeProps {
  orderStatus: string
  deliveryStatus?: string | null
  scheduledDate?: string | Date | null
  className?: string
}

/**
 * Unified Status Badge - Displays Order Status + Delivery Status
 *
 * Consolidates order and delivery status into a single visual component
 * with emoji icons for quick recognition.
 *
 * @example
 * <UnifiedStatusBadge
 *   orderStatus="CONFIRMED"
 *   deliveryStatus="IN_TRANSIT"
 *   scheduledDate="2026-01-28"
 * />
 */
export function UnifiedStatusBadge({
  orderStatus,
  deliveryStatus,
  scheduledDate,
  className
}: UnifiedStatusBadgeProps) {
  // Order Status Configuration
  const orderStatusConfig: Record<string, { icon: string; label: string; className: string }> = {
    NEW: {
      icon: '🆕',
      label: 'Новый',
      className: 'bg-blue-50 text-blue-700 border-blue-100'
    },
    CONFIRMED: {
      icon: '✅',
      label: 'Подтверждён',
      className: 'bg-purple-50 text-purple-700 border-purple-100'
    },
    PICKING: {
      icon: '📋',
      label: 'Сборка',
      className: 'bg-amber-50 text-amber-700 border-amber-100'
    },
    PACKING: {
      icon: '📦',
      label: 'Упаковка',
      className: 'bg-orange-50 text-orange-700 border-orange-100'
    },
    READY: {
      icon: '✔️',
      label: 'Готов',
      className: 'bg-cyan-50 text-cyan-700 border-cyan-100'
    },
    SHIPPED: {
      icon: '🚚',
      label: 'Отгружен',
      className: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    },
    PARTIAL: {
      icon: '⚠️',
      label: 'Частичный',
      className: 'bg-yellow-50 text-yellow-700 border-yellow-100'
    },
    COMPLETED: {
      icon: '✅',
      label: 'Завершён',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    DELIVERED: {
      icon: '✅',
      label: 'Доставлен',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    INVOICED: {
      icon: '🧾',
      label: 'Счёт выставлен',
      className: 'bg-teal-50 text-teal-700 border-teal-100'
    },
    PAID: {
      icon: '💰',
      label: 'Оплачен',
      className: 'bg-green-50 text-green-700 border-green-100'
    },
    CANCELLED: {
      icon: '❌',
      label: 'Отменён',
      className: 'bg-red-50 text-red-700 border-red-100'
    }
  }

  // Delivery Status Configuration
  const deliveryStatusConfig = {
    PENDING: {
      icon: '⏳',
      label: 'Ожидает',
      className: 'bg-amber-50 text-amber-700 border-amber-100'
    },
    IN_TRANSIT: {
      icon: '🚚',
      label: 'В пути',
      className: 'bg-blue-50 text-blue-700 border-blue-100'
    },
    DELIVERED: {
      icon: '✅',
      label: 'Доставлен',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    FAILED: {
      icon: '❌',
      label: 'Не доставлен',
      className: 'bg-red-50 text-red-700 border-red-100'
    }
  }

  // Smart status merging logic - show only what we can determine
  let displayStatus: { icon: string; label: string; className: string }
  let showDate = false

  // Priority 1: Delivery failed
  if (deliveryStatus === 'FAILED') {
    displayStatus = deliveryStatusConfig['FAILED']
    showDate = true
  }
  // Priority 2: Cancelled order
  else if (orderStatus === 'CANCELLED') {
    displayStatus = orderStatusConfig['CANCELLED']
  }
  // Priority 3: Delivered (show only once)
  else if (orderStatus === 'DELIVERED' || orderStatus === 'COMPLETED' || deliveryStatus === 'DELIVERED') {
    displayStatus = {
      icon: '✅',
      label: 'Доставлен',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    }
    showDate = true
  }
  // Priority 4: In transit (driver started delivery)
  else if (deliveryStatus === 'IN_TRANSIT') {
    displayStatus = deliveryStatusConfig['IN_TRANSIT']
    showDate = true
  }
  // Priority 5: Assigned (has delivery/driver but not started)
  else if (deliveryStatus === 'PENDING') {
    displayStatus = {
      icon: '👤',
      label: 'Назначен',
      className: 'bg-sky-50 text-sky-700 border-sky-100'
    }
    showDate = true
  }
  // Priority 6: Order status (NEW, CONFIRMED, PICKING, etc.)
  else {
    displayStatus = orderStatusConfig[orderStatus] || {
      icon: '📄',
      label: orderStatus,
      className: 'bg-slate-50 text-slate-700 border-slate-100'
    }
    showDate = !!scheduledDate
  }

  // Format date if needed
  const formattedDate = (showDate && scheduledDate)
    ? format(new Date(scheduledDate), 'dd/MM/yyyy')
    : null

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Single Unified Status Badge */}
      <Badge
        variant="outline"
        className={cn(
          "px-2 py-0.5 text-[11px] font-bold w-fit",
          "transition-all duration-200",
          displayStatus.className
        )}
      >
        <span className="mr-1">{displayStatus.icon}</span>
        {displayStatus.label}
      </Badge>

      {/* Scheduled Date (if applicable) */}
      {formattedDate && (
        <span className="text-[10px] text-slate-400 font-medium">
          📅 {formattedDate}
        </span>
      )}
    </div>
  )
}
