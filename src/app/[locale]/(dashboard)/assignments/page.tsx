import { prisma } from '@/lib/prisma'
import { AssignmentsTable } from '@/components/assignments/AssignmentsTable'
import { DriverWithAssignment, VehicleWithDriver } from '@/types/assignment'

async function getAssignmentsData(): Promise<{
  drivers: DriverWithAssignment[]
  vehicles: VehicleWithDriver[]
}> {
  try {
    // Get drivers with their vehicle assignments
    const drivers = await prisma.driver.findMany({
      include: {
        vehicles: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
            type: true,
            capacity: true,
            status: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Get vehicles with their driver assignments
    const vehicles = await prisma.vehicle.findMany({
      include: {
        driver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { plateNumber: 'asc' },
    })

    // Transform drivers data to match expected type
    // Each driver can have multiple vehicles, so we'll take the first one if available
    const driversData: DriverWithAssignment[] = drivers.map((driver) => {
      const assignedVehicle = driver.vehicles[0]
      return {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        status: driver.status,
        vehicleId: assignedVehicle?.id || null,
        plateNumber: assignedVehicle?.plateNumber || null,
        model: assignedVehicle?.model || null,
        type: assignedVehicle?.type || null,
        capacity: assignedVehicle?.capacity || null,
        vehicleStatus: assignedVehicle?.status || null,
      }
    })

    // Transform vehicles data to match expected type
    const vehiclesData: VehicleWithDriver[] = vehicles.map((vehicle) => ({
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      model: vehicle.model,
      type: vehicle.type,
      capacity: vehicle.capacity,
      status: vehicle.status,
      driverId: vehicle.driver?.id || null,
      driverName: vehicle.driver?.name || null,
    }))

    return {
      drivers: driversData,
      vehicles: vehiclesData,
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
