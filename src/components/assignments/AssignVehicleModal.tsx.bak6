'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Truck } from 'lucide-react'
import { VehicleWithDriver } from '@/types/assignment'
import { cn } from '@/lib/utils'

interface AssignVehicleModalProps {
  isOpen: boolean
  driverName: string
  driverId: string
  currentVehicleId?: string | null
  availableVehicles: VehicleWithDriver[]
  onAssign: (vehicleId: string) => Promise<void>
  onClose: () => void
}

export function AssignVehicleModal({
  isOpen,
  driverName,
  driverId,
  currentVehicleId,
  availableVehicles,
  onAssign,
  onClose,
}: AssignVehicleModalProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAssign = async () => {
    if (!selectedVehicleId) return

    setLoading(true)
    setError(null)

    try {
      await onAssign(selectedVehicleId)
      setSelectedVehicleId(null)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to assign vehicle')
    } finally {
      setLoading(false)
    }
  }

  const isReassigning = !!currentVehicleId
  const unassignedVehicles = availableVehicles.filter(v => !v.driverId)
  const selectedVehicle = availableVehicles.find(v => v.id === selectedVehicleId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isReassigning ? 'Reassign Vehicle' : 'Assign Vehicle'} to {driverName}
          </DialogTitle>
          <DialogDescription>
            {isReassigning
              ? `Currently assigned to: ${availableVehicles.find(v => v.id === currentVehicleId)?.plateNumber}`
              : 'Select a vehicle to assign to this driver'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto space-y-2">
            {unassignedVehicles.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No unassigned vehicles available
              </div>
            ) : (
              unassignedVehicles.map(vehicle => (
                <button
                  key={vehicle.id}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className={cn(
                    'w-full rounded-lg border-2 p-4 text-left transition-all',
                    selectedVehicleId === vehicle.id
                      ? 'border-sky-600 bg-sky-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{vehicle.plateNumber}</p>
                      <p className="text-sm text-slate-600">
                        {vehicle.model} {vehicle.type}
                        {vehicle.capacity && ` • ${vehicle.capacity}kg`}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        vehicle.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      {vehicle.status}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>

          {selectedVehicle && (
            <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 text-sm">
              <p className="text-slate-700">
                <Truck className="inline h-4 w-4 mr-2 text-sky-600" />
                Selected: <span className="font-semibold">{selectedVehicle.plateNumber}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedVehicleId || loading}
            className="bg-sky-600 hover:bg-sky-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isReassigning ? 'Reassign Vehicle' : 'Assign Vehicle'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
