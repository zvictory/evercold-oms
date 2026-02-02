"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"

interface BulkDeleteProductsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

// Russian pluralization helper
function pluralizeProducts(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${count} товаров`
  }

  if (lastDigit === 1) {
    return `${count} товар`
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} товара`
  }

  return `${count} товаров`
}

export function BulkDeleteProductsDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isDeleting,
}: BulkDeleteProductsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-red-200">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">
              Bulk Delete Products
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-slate-600">
            Are you sure you want to delete {pluralizeProducts(selectedCount)}? This action will soft-delete all selected products from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Selected Products:</span>
            <span className="text-2xl font-bold text-red-600 tabular-nums">
              {selectedCount}
            </span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-900">
            <strong>Note:</strong> These products will be hidden from the list but preserved in the database for historical orders and reports.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deleting...</span>
              </div>
            ) : (
              `Delete ${selectedCount} Products`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
