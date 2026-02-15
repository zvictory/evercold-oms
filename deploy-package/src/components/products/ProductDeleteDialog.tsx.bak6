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

interface Product {
  id: string
  name: string
  sapCode?: string | null
}

interface ProductDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export function ProductDeleteDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
  isDeleting,
}: ProductDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-red-200">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">
              Delete Product
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-slate-600">
            Are you sure you want to delete this product? This action will soft-delete the product from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {product && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">{product.name}</p>
              {product.sapCode && (
                <p className="text-xs font-mono text-slate-500">SAP: {product.sapCode}</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-900">
            <strong>Note:</strong> This product will be hidden from the list but preserved in the database for historical orders and reports.
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
              'Delete Product'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
