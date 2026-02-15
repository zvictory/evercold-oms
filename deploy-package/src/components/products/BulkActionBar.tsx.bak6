"use client"

import { Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface BulkActionBarProps {
  selectedCount: number
  onClearSelection: () => void
  onBulkDelete: () => void
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 px-6 py-4 flex items-center gap-6">
        {/* Selection Counter */}
        <div className="flex items-center gap-3">
          <Badge className="bg-sky-600 hover:bg-sky-600 text-white px-3 py-1.5 text-sm font-bold">
            {selectedCount}
          </Badge>
          <span className="text-sm font-medium">
            {selectedCount === 1 ? 'product selected' : 'products selected'}
          </span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-700" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-slate-300 hover:text-white hover:bg-slate-800 h-9 gap-2"
          >
            <X className="h-4 w-4" />
            Clear Selection
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkDelete}
            className="text-red-400 hover:text-red-300 hover:bg-red-950 h-9 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      </div>
    </div>
  )
}
