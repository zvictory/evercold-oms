import type { DriverStatus, VehicleStatus, VehicleType } from '@prisma/client'

export interface DriverWithAssignment {
  id: string
  name: string
  phone: string
  licenseNumber: string
  status: DriverStatus
  vehicleId: string | null
  plateNumber: string | null
  model: string | null
  type: VehicleType | null
  capacity: number | null
  vehicleStatus: VehicleStatus | null
}

export interface VehicleWithDriver {
  id: string
  plateNumber: string
  model: string
  type: VehicleType
  capacity: number | null
  status: VehicleStatus
  driverId: string | null
  driverName: string | null
}

export interface AssignmentsData {
  drivers: DriverWithAssignment[]
  vehicles: VehicleWithDriver[]
}
