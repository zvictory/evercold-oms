'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

interface UnassignConfirmDialogProps {
  isOpen: boolean
  driverName: string
  vehiclePlate: string
  loading: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function UnassignConfirmDialog({
  isOpen,
  driverName,
  vehiclePlate,
  loading,
  onConfirm,
  onCancel,
}: UnassignConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unassign Vehicle?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove {vehiclePlate} from {driverName}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-3">
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
            Unassign
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
