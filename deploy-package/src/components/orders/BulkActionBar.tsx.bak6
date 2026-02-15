"use client"

import * as React from "react"
import { X, Trash2, FileDown, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useScopedI18n } from "@/locales/client"
import { BulkAssignmentModal } from "./BulkAssignmentModal"

interface BulkActionBarProps {
  selectedCount: number
  selectedIds?: string[]
  onClearSelection: () => void
  onBulkDelete: () => void
  onBulkInvoice: (separate: boolean) => void
  onAssignComplete?: () => void
}

export function BulkActionBar({
  selectedCount,
  selectedIds = [],
  onClearSelection,
  onBulkDelete,
  onBulkInvoice,
  onAssignComplete
}: BulkActionBarProps) {
  const [separateFiles, setSeparateFiles] = React.useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false)
  const t = useScopedI18n('BulkActions')

  if (selectedCount === 0) return null

  return (
    <div className={cn(
      "bg-sky-50 border border-sky-200 rounded-xl p-4 shadow-sm",
      "flex items-center justify-between gap-4",
      "animate-in slide-in-from-top-2 duration-200"
    )}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
            {selectedCount}
          </div>
          <span className="font-medium text-slate-900">
            {t('selectedOrders', { count: selectedCount })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {selectedCount > 1 && (
          <div className="flex items-center gap-2 mr-4 border-r pr-4 border-sky-200">
            <Switch
              id="separate-files"
              checked={separateFiles}
              onCheckedChange={setSeparateFiles}
              className="data-[state=checked]:bg-sky-600"
            />
            <Label htmlFor="separate-files" className="text-sm text-slate-700 cursor-pointer select-none">
              {t('separateFiles')}
            </Label>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 gap-1.5 text-slate-600 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
          {t('clear')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAssignModalOpen(true)}
          className="h-8 gap-1.5 border-sky-600 text-sky-600 hover:bg-sky-50"
        >
          <Truck className="h-4 w-4" />
          {t('assignToDriver')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkInvoice(selectedCount > 1 ? separateFiles : false)}
          className="h-8 gap-1.5 border-sky-600 text-sky-600 hover:bg-sky-50"
        >
          <FileDown className="h-4 w-4" />
          {t('downloadInvoices')}
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
          className="h-8 gap-1.5 bg-red-600 hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4" />
          {t('deleteSelected')}
        </Button>

        <BulkAssignmentModal
          open={isAssignModalOpen}
          onOpenChange={setIsAssignModalOpen}
          selectedOrderIds={selectedIds}
          onAssignComplete={() => {
            if (onAssignComplete) {
              onAssignComplete()
            }
            onClearSelection()
          }}
        />
      </div>
    </div>
  )
}
