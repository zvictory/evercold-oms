'use client'

import { useState, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Truck } from 'lucide-react'
import { AssignVehicleModal } from './AssignVehicleModal'
import { UnassignConfirmDialog } from './UnassignConfirmDialog'
import { DriverWithAssignment, VehicleWithDriver } from '@/types/assignment'
import { cn, fetchWithAuth } from '@/lib/utils'
import { toast } from 'sonner'

interface AssignmentsTableProps {
  drivers: DriverWithAssignment[]
  vehicles: VehicleWithDriver[]
  onDataRefresh: () => Promise<void>
}

export function AssignmentsTable({
  drivers,
  vehicles,
  onDataRefresh,
}: AssignmentsTableProps) {
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set())
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false)
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const activeDriver = drivers.find(d => d.id === activeDriverId)

  const handleAssignClick = (driverId: string) => {
    setActiveDriverId(driverId)
    setAssignModalOpen(true)
  }

  const handleUnassignClick = (driverId: string) => {
    setActiveDriverId(driverId)
    setUnassignDialogOpen(true)
  }

  const handleAssignVehicle = useCallback(
    async (vehicleId: string) => {
      if (!activeDriverId) return

      setLoading(true)
      try {
        const response = await fetchWithAuth('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId: activeDriverId,
            vehicleId,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to assign vehicle')
        }

        toast.success('Vehicle assigned successfully')
        await onDataRefresh()
        setAssignModalOpen(false)
      } catch (error: any) {
        toast.error(error.message)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [activeDriverId, onDataRefresh]
  )

  const handleUnassignVehicle = useCallback(async () => {
    if (!activeDriverId) return

    setLoading(true)
    try {
      const response = await fetchWithAuth(`/api/assignments/${activeDriverId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unassign vehicle')
      }

      toast.success('Vehicle unassigned successfully')
      await onDataRefresh()
      setUnassignDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [activeDriverId, onDataRefresh])

  const handleBulkUnassign = useCallback(async () => {
    setLoading(true)
    try {
      const promises = Array.from(selectedDrivers).map(driverId =>
      )

      const results = await Promise.all(promises)
      const failed = results.filter(r => !r.ok).length

      if (failed > 0) {
        toast.error(`Failed to unassign ${failed} vehicle(s)`)
      } else {
        toast.success(`${selectedDrivers.size} vehicle(s) unassigned`)
      }

      setSelectedDrivers(new Set())
      await onDataRefresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [selectedDrivers, onDataRefresh])

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedDrivers(new Set(drivers.map(d => d.id)))
    } else {
      setSelectedDrivers(new Set())
    }
  }

  const handleToggleDriver = (driverId: string, checked: boolean) => {
    const newSelected = new Set(selectedDrivers)
    if (checked) {
      newSelected.add(driverId)
    } else {
      newSelected.delete(driverId)
    }
    setSelectedDrivers(newSelected)
  }

  const unassignedVehicles = vehicles.filter(v => !v.driverId)
  const assignedVehicles = vehicles.filter(v => v.driverId)

  return (
    <>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-white p-4 border border-slate-200">
          <p className="text-sm text-slate-600">Total Drivers</p>
          <p className="text-2xl font-bold text-slate-900">{drivers.length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 border border-slate-200">
          <p className="text-sm text-slate-600">Total Vehicles</p>
          <p className="text-2xl font-bold text-slate-900">{vehicles.length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 border border-slate-200">
          <p className="text-sm text-slate-600">Assigned</p>
          <p className="text-2xl font-bold text-emerald-600">{assignedVehicles.length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 border border-slate-200">
          <p className="text-sm text-slate-600">Unassigned</p>
          <p className="text-2xl font-bold text-amber-600">{unassignedVehicles.length}</p>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDrivers.size > 0 && (
        <div className="mb-4 rounded-lg bg-sky-50 border border-sky-200 p-4 flex items-center justify-between">
          <p className="text-sm text-slate-700">
            {selectedDrivers.size} driver(s) selected
          </p>
          <Button
            onClick={handleBulkUnassign}
            disabled={loading}
            variant="destructive"
            size="sm"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Unassign Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 border-slate-100">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedDrivers.size === drivers.length && drivers.length > 0}
                  onCheckedChange={handleToggleAll}
                />
              </TableHead>
              <TableHead className="font-semibold text-slate-900">Driver Name</TableHead>
              <TableHead className="font-semibold text-slate-900">Phone</TableHead>
              <TableHead className="font-semibold text-slate-900">License</TableHead>
              <TableHead className="font-semibold text-slate-900">Current Vehicle</TableHead>
              <TableHead className="font-semibold text-slate-900">Model</TableHead>
              <TableHead className="text-right font-semibold text-slate-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map(driver => (
              <TableRow
                key={driver.id}
                className={cn(
                  'border-slate-100 hover:bg-slate-50/50',
                  selectedDrivers.has(driver.id) && 'bg-sky-50/30'
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedDrivers.has(driver.id)}
                    onCheckedChange={(checked) => handleToggleDriver(driver.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-medium text-slate-900">{driver.name}</TableCell>
                <TableCell className="text-slate-700">{driver.phone}</TableCell>
                <TableCell className="text-slate-600 text-sm">{driver.licenseNumber}</TableCell>
                <TableCell>
                  {driver.plateNumber ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {driver.plateNumber}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500">
                      Unassigned
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-slate-600 text-sm">
                  {driver.model && `${driver.model} ${driver.type}`}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {driver.plateNumber ? (
                    <>
                      <Button
                        onClick={() => handleAssignClick(driver.id)}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        Reassign
                      </Button>
                      <Button
                        onClick={() => handleUnassignClick(driver.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        disabled={loading}
                      >
                        Unassign
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleAssignClick(driver.id)}
                      size="sm"
                      className="bg-sky-600 hover:bg-sky-700"
                      disabled={loading || unassignedVehicles.length === 0}
                    >
                      Assign
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <AssignVehicleModal
        isOpen={assignModalOpen}
        driverName={activeDriver?.name || ''}
        driverId={activeDriverId || ''}
        currentVehicleId={activeDriver?.vehicleId}
        availableVehicles={vehicles}
        onAssign={handleAssignVehicle}
        onClose={() => {
          setAssignModalOpen(false)
          setActiveDriverId(null)
        }}
      />

      <UnassignConfirmDialog
        isOpen={unassignDialogOpen}
        driverName={activeDriver?.name || ''}
        vehiclePlate={activeDriver?.plateNumber || ''}
        loading={loading}
        onConfirm={handleUnassignVehicle}
        onCancel={() => {
          setUnassignDialogOpen(false)
          setActiveDriverId(null)
        }}
      />
    </>
  )
}
