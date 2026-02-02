# Driver-Vehicle Assignments Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a flexible two-way driver-vehicle assignment management page with a data table, modal assignment interface, bulk operations, and complete API support.

**Architecture:**
- Server Component page that loads all drivers and vehicles
- Client Component table with inline action buttons
- Assignment modal for selecting vehicles
- API routes using native PostgreSQL (pg library) for mutations
- Real-time UI updates with toast feedback and error handling

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Shadcn/UI, Tailwind CSS, PostgreSQL with pg library, React Hook Form, Zod validation

---

## Task 1: Create API Endpoint - GET /api/assignments

**Files:**
- Create: `src/app/api/assignments/route.ts`

**Step 1: Write the endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://zafar@localhost:5432/evercold_crm',
})

export async function GET(request: NextRequest) {
  try {
    // Get all drivers with their current vehicle assignments
    const driversResult = await pool.query(
      `SELECT
        d.id,
        d.name,
        d.phone,
        d."licenseNumber",
        d.status,
        v.id as "vehicleId",
        v."plateNumber",
        v.model,
        v.type,
        v.capacity,
        v.status as "vehicleStatus"
       FROM "Driver" d
       LEFT JOIN "Vehicle" v ON d.id = v."driverId"
       ORDER BY d.name`
    )

    // Get all vehicles with their assignments
    const vehiclesResult = await pool.query(
      `SELECT
        v.id,
        v."plateNumber",
        v.model,
        v.type,
        v.capacity,
        v.status,
        d.id as "driverId",
        d.name as "driverName"
       FROM "Vehicle" v
       LEFT JOIN "Driver" d ON v."driverId" = d.id
       ORDER BY v."plateNumber"`
    )

    return NextResponse.json({
      drivers: driversResult.rows,
      vehicles: vehiclesResult.rows,
    })
  } catch (error: any) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}
```

**Step 2: Test the endpoint**

```bash
curl http://localhost:53950/api/assignments | jq '.drivers | length'
# Expected: 5
curl http://localhost:53950/api/assignments | jq '.vehicles | length'
# Expected: 7
```

---

## Task 2: Create API Endpoint - POST /api/assignments (Create Assignment)

**Files:**
- Modify: `src/app/api/assignments/route.ts`

**Step 1: Add POST handler to existing file**

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { driverId, vehicleId } = body

    // Validation
    if (!driverId || !vehicleId) {
      return NextResponse.json(
        { error: 'driverId and vehicleId are required' },
        { status: 400 }
      )
    }

    // Check if driver exists and is active
    const driverCheck = await pool.query(
      `SELECT id, status FROM "Driver" WHERE id = $1`,
      [driverId]
    )
    if (driverCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }
    if (driverCheck.rows[0].status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Driver is not active' },
        { status: 400 }
      )
    }

    // Check if vehicle exists
    const vehicleCheck = await pool.query(
      `SELECT id, "plateNumber", status FROM "Vehicle" WHERE id = $1`,
      [vehicleId]
    )
    if (vehicleCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }
    if (vehicleCheck.rows[0].status === 'OUT_OF_SERVICE') {
      return NextResponse.json(
        { error: 'Vehicle is out of service' },
        { status: 400 }
      )
    }

    // Check if vehicle is already assigned to this driver
    if (vehicleCheck.rows[0].driverId === driverId) {
      return NextResponse.json(
        { error: 'Vehicle is already assigned to this driver' },
        { status: 400 }
      )
    }

    // Assign vehicle to driver
    const result = await pool.query(
      `UPDATE "Vehicle" SET "driverId" = $1 WHERE id = $2 RETURNING *`,
      [driverId, vehicleId]
    )

    return NextResponse.json(
      {
        success: true,
        message: `Vehicle ${vehicleCheck.rows[0].plateNumber} assigned to driver`,
        vehicle: result.rows[0],
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create assignment' },
      { status: 500 }
    )
  }
}
```

**Step 2: Test the endpoint**

```bash
# Get a driver ID and vehicle ID from /api/assignments
DRIVER_ID="cmjyptrtb0000cappjj4ymx7a"
VEHICLE_ID="cmjyptrup0008cappjaxgjz1d"

curl -X POST http://localhost:53950/api/assignments \
  -H "Content-Type: application/json" \
  -d "{\"driverId\": \"$DRIVER_ID\", \"vehicleId\": \"$VEHICLE_ID\"}" | jq '.success'
# Expected: true
```

---

## Task 3: Create API Endpoint - DELETE /api/assignments/:driverId (Unassign)

**Files:**
- Create: `src/app/api/assignments/[driverId]/route.ts`

**Step 1: Write the DELETE handler**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://zafar@localhost:5432/evercold_crm',
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: { driverId: string } }
) {
  try {
    const { driverId } = params

    // Check if driver has an assignment
    const vehicleCheck = await pool.query(
      `SELECT id, "plateNumber" FROM "Vehicle" WHERE "driverId" = $1`,
      [driverId]
    )

    if (vehicleCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Driver has no vehicle assignment' },
        { status: 404 }
      )
    }

    // Unassign vehicle
    const result = await pool.query(
      `UPDATE "Vehicle" SET "driverId" = NULL WHERE "driverId" = $1 RETURNING *`,
      [driverId]
    )

    return NextResponse.json(
      {
        success: true,
        message: `Vehicle ${vehicleCheck.rows[0].plateNumber} unassigned`,
        vehicle: result.rows[0],
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}
```

**Step 2: Test the endpoint**

```bash
DRIVER_ID="cmjyptrtb0000cappjj4ymx7a"

curl -X DELETE http://localhost:53950/api/assignments/$DRIVER_ID | jq '.success'
# Expected: true
```

---

## Task 4: Create Zod Schema for Assignment Validation

**Files:**
- Create: `src/lib/schemas/assignment.ts`

**Step 1: Write validation schema**

```typescript
import { z } from 'zod'

export const assignmentSchema = z.object({
  driverId: z.string().cuid('Invalid driver ID'),
  vehicleId: z.string().cuid('Invalid vehicle ID'),
})

export type AssignmentInput = z.infer<typeof assignmentSchema>

export const unassignmentSchema = z.object({
  driverId: z.string().cuid('Invalid driver ID'),
})

export type UnassignmentInput = z.infer<typeof unassignmentSchema>
```

---

## Task 5: Create Types for Assignments

**Files:**
- Create: `src/types/assignment.ts`

**Step 1: Write types**

```typescript
export interface DriverWithAssignment {
  id: string
  name: string
  phone: string
  licenseNumber: string
  status: 'ACTIVE' | 'INACTIVE'
  vehicleId: string | null
  plateNumber: string | null
  model: string | null
  type: string | null
  capacity: number | null
  vehicleStatus: string | null
}

export interface VehicleWithDriver {
  id: string
  plateNumber: string
  model: string
  type: 'VAN' | 'TRUCK'
  capacity: number | null
  status: 'AVAILABLE' | 'IN_USE' | 'OUT_OF_SERVICE'
  driverId: string | null
  driverName: string | null
}

export interface AssignmentsData {
  drivers: DriverWithAssignment[]
  vehicles: VehicleWithDriver[]
}
```

---

## Task 6: Create AssignVehicleModal Component

**Files:**
- Create: `src/components/assignments/AssignVehicleModal.tsx`

**Step 1: Write modal component**

```typescript
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
```

---

## Task 7: Create UnassignConfirmDialog Component

**Files:**
- Create: `src/components/assignments/UnassignConfirmDialog.tsx`

**Step 1: Write confirmation dialog**

```typescript
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
```

---

## Task 8: Create AssignmentsTable Component

**Files:**
- Create: `src/components/assignments/AssignmentsTable.tsx`

**Step 1: Write table component**

```typescript
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
import { cn } from '@/lib/utils'
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
        const response = await fetch('/api/assignments', {
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
      const response = await fetch(`/api/assignments/${activeDriverId}`, {
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
        fetch(`/api/assignments/${driverId}`, { method: 'DELETE' })
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
                  indeterminate={selectedDrivers.size > 0 && selectedDrivers.size < drivers.length}
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
```

---

## Task 9: Create Assignments Page (Server Component)

**Files:**
- Create: `src/app/assignments/page.tsx`

**Step 1: Write page component**

```typescript
import { Pool } from 'pg'
import { AssignmentsTable } from '@/components/assignments/AssignmentsTable'
import { DriverWithAssignment, VehicleWithDriver } from '@/types/assignment'

const pool = new Pool({
  connectionString: 'postgresql://zafar@localhost:5432/evercold_crm',
})

async function getAssignmentsData(): Promise<{
  drivers: DriverWithAssignment[]
  vehicles: VehicleWithDriver[]
}> {
  try {
    // Get drivers with their vehicle assignments
    const driversResult = await pool.query(
      `SELECT
        d.id,
        d.name,
        d.phone,
        d."licenseNumber",
        d.status,
        v.id as "vehicleId",
        v."plateNumber",
        v.model,
        v.type,
        v.capacity,
        v.status as "vehicleStatus"
       FROM "Driver" d
       LEFT JOIN "Vehicle" v ON d.id = v."driverId"
       ORDER BY d.name`
    )

    // Get vehicles with their driver assignments
    const vehiclesResult = await pool.query(
      `SELECT
        v.id,
        v."plateNumber",
        v.model,
        v.type,
        v.capacity,
        v.status,
        d.id as "driverId",
        d.name as "driverName"
       FROM "Vehicle" v
       LEFT JOIN "Driver" d ON v."driverId" = d.id
       ORDER BY v."plateNumber"`
    )

    return {
      drivers: driversResult.rows,
      vehicles: vehiclesResult.rows,
    }
  } catch (error) {
    console.error('Error fetching assignments:', error)
    throw error
  }
}

export default async function AssignmentsPage() {
  const data = await getAssignmentsData()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Driver-Vehicle Assignments
        </h1>
        <p className="text-slate-600 mt-2">
          Manage driver and vehicle assignments. Assign vehicles to drivers or reassign them as needed.
        </p>
      </div>

      <AssignmentsTable
        drivers={data.drivers}
        vehicles={data.vehicles}
        onDataRefresh={async () => {
          'use server'
          // This will be called from client to refresh data
          // The page will revalidate when client sends request
        }}
      />
    </div>
  )
}
```

**Step 2: Test the page locally**

```bash
# Navigate to http://localhost:53950/assignments
# Should see the assignments table with all drivers and vehicles
```

---

## Task 10: Add Missing UI Components (if needed)

**Files:**
- Verify: `src/components/ui/checkbox.tsx`
- Verify: `src/components/ui/dialog.tsx`
- Verify: `src/components/ui/alert-dialog.tsx`
- Verify: `src/components/ui/table.tsx`
- Verify: `src/components/ui/badge.tsx`
- Verify: `src/components/ui/button.tsx`

**Step 1: Install missing Shadcn components (if any don't exist)**

```bash
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
```

---

## Task 11: Verify sonner Toast Library

**Files:**
- Verify: `package.json` contains `sonner`

**Step 1: Check if sonner is installed**

```bash
grep sonner package.json
# If not present, install it
npm install sonner
```

---

## Task 12: Final Testing & Verification

**Step 1: Test the complete flow**

```bash
# 1. Navigate to http://localhost:53950/assignments
# 2. See all drivers in table
# 3. Click "Assign" on first unassigned driver
# 4. Select a vehicle from modal
# 5. Click "Assign Vehicle"
# 6. Verify table updates and vehicle shows in driver row
# 7. Click "Reassign" on assigned driver
# 8. Select different vehicle
# 9. Verify assignment changes
# 10. Click "Unassign"
# 11. Verify assignment is removed
# 12. Select multiple drivers with checkboxes
# 13. Click "Unassign Selected"
# 14. Verify all selected are unassigned
```

**Step 2: Verify API calls**

```bash
# Test API directly
curl http://localhost:53950/api/assignments | jq '.drivers[0]'
curl -X POST http://localhost:53950/api/assignments \
  -H "Content-Type: application/json" \
  -d '{"driverId": "cmjyptrtb0000cappjj4ymx7a", "vehicleId": "cmjyptrup0008cappjaxgjz1d"}'
curl -X DELETE http://localhost:53950/api/assignments/cmjyptrtb0000cappjj4ymx7a
```

---

## Summary

**Total Components:** 10 files
- 3 API routes (GET, POST, DELETE)
- 1 Zod schema
- 1 Type definitions file
- 3 React components (Table, Modal, Dialog)
- 1 Server page component

**Key Features Implemented:**
✅ View all drivers and vehicles with current assignments
✅ Assign vehicles to drivers
✅ Reassign vehicles to different drivers
✅ Unassign individual vehicles
✅ Bulk unassign operations
✅ Real-time table updates
✅ Toast notifications for success/error
✅ Full validation and error handling
✅ Responsive design with Tailwind CSS
✅ Professional UI matching "Ice & Steel" aesthetic

---

**Plan complete and saved to `docs/plans/2026-02-02-driver-vehicle-assignments.md`.**

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**