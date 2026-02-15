import { useI18n } from '@/locales/client';
import { cn, resolveDisplayBranch } from '@/lib/utils';
import { CheckCircle2, Lock, Package, Clock } from 'lucide-react';

interface TimelineProps {
  stops: any[];
  currentStopId: string;
  onStopClick?: (stop: any) => void;
}

export function RouteTimeline({ stops, currentStopId, onStopClick }: TimelineProps) {
  const t = useI18n();

  // Sort stops by stopNumber
  const sortedStops = [...stops].sort((a, b) => a.stopNumber - b.stopNumber);
  const currentIndex = sortedStops.findIndex(s => s.id === currentStopId);

  return (
    <div className="space-y-0 relative pb-20">
      <h3 className="font-bold text-slate-900 mb-4 px-1">{t('Driver.dashboard.remainingStops')}</h3>

      {/* Vertical Line */}
      <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-slate-200 z-0" />

      {sortedStops.map((stop, index) => {
        const isCompleted = stop.status === 'COMPLETED' || stop.status === 'SKIPPED' || stop.status === 'FAILED';
        const isCurrent = stop.id === currentStopId;
        const isFuture = index > (currentIndex === -1 ? sortedStops.length : currentIndex);
        const isLocked = isFuture;
        const isClickable = !isLocked && onStopClick;

        return (
          <div
            key={stop.id}
            className={cn(
              "relative z-10 mb-4 pl-14 transition-all",
              isLocked && "opacity-50 grayscale",
              isClickable && "cursor-pointer"
            )}
            onClick={() => isClickable && onStopClick(stop)}
          >
            {/* Timeline Node */}
            <div className={cn(
              "absolute left-3 top-3 -translate-x-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white",
              isCompleted ? "border-emerald-500 bg-emerald-50" :
              isCurrent ? "border-sky-600 bg-sky-600 shadow-lg scale-110" :
              "border-slate-300 bg-slate-100"
            )}>
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : isCurrent ? (
                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
              ) : (
                <span className="text-xs font-bold text-slate-400">{stop.stopNumber}</span>
              )}
            </div>

            {/* Card Content */}
            <div className={cn(
              "bg-white rounded-xl p-4 border shadow-sm transition-all",
              isCurrent ? "border-sky-200 ring-2 ring-sky-100" : "border-slate-200",
              isLocked && "bg-slate-50 border-slate-100"
            )}>
              <div className="flex justify-between items-start mb-1">
                <span className={cn(
                  "text-sm font-bold",
                  isCurrent ? "text-sky-900" : "text-slate-900"
                )}>
                  {stop.delivery.order.customer.name}
                </span>
                {isLocked && <Lock className="h-3 w-3 text-slate-400" />}
                {isCompleted && <span className="text-xs font-bold text-emerald-600">{t('Driver.timeline.done')}</span>}
              </div>
              {stop.delivery.order.orderItems[0]?.branch?.branchName && (
                <p className="text-xs text-slate-400 truncate">{resolveDisplayBranch(
                  stop.delivery.order.orderItems[0].branch.branchName,
                  stop.delivery.order.customer.name,
                  stop.delivery.order.customer._count?.branches
                )}</p>
              )}

              <p className="text-xs text-slate-500 mb-2 truncate">
                {stop.delivery.order.orderItems[0]?.branch?.deliveryAddress || stop.delivery.order.customer.address}
              </p>

              <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {stop.delivery.order.orderItems.length} {t('Driver.stopDetail.items')}
                </span>
                {stop.estimatedArrival && (
                   <span className="flex items-center gap-1">
                     <Clock className="h-3 w-3" />
                     {new Date(stop.estimatedArrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
