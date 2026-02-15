import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, handleAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // All authenticated users can view driver-vehicle mappings
    await requireUser(request)
    
    // Get all drivers
    const drivers = await prisma.driver.findMany({
      orderBy: { name: 'asc' }
    })

    // Get all vehicles
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { plateNumber: 'asc' }
    })

    // Get driver-vehicle assignments
    const driversWithVehicles = await prisma.driver.findMany({
      include: {
        vehicles: true
      },
      orderBy: { name: 'asc' }
    })

    const assignments = driversWithVehicles.map(d => ({
      id: d.id,
      name: d.name,
      vehicles: d.vehicles.map(v => ({
        vehicleId: v.id,
        plateNumber: v.plateNumber,
        model: v.model
      }))
    }))

    return NextResponse.json({
      drivers: drivers.map(d => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        licenseNumber: d.licenseNumber,
        status: d.status,
        createdAt: d.createdAt,
      })),
      vehicles: vehicles.map(v => ({
        id: v.id,
        plateNumber: v.plateNumber,
        model: v.model,
        type: v.type,
        capacity: v.capacity,
        status: v.status,
        driverId: v.driverId,
        createdAt: v.createdAt,
      })),
      assignments,
      summary: {
        totalDrivers: drivers.length,
        totalVehicles: vehicles.length,
        assignedVehicles: vehicles.filter((v) => v.driverId).length,
        unassignedVehicles: vehicles.filter((v) => !v.driverId).length,
      },
    })
  } catch (error: any) {
    console.error('Error fetching drivers and vehicles:', error)
    return handleAuthError(error)
  }
}
