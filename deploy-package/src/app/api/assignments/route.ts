import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireManagerOrAdmin, handleAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // All authenticated users can view assignments
    await requireUser(request)
    
    // Get all drivers with their current vehicle assignments
    const drivers = await prisma.driver.findMany({
      include: {
        vehicles: true
      },
      orderBy: { name: 'asc' }
    })

    const formattedDrivers = drivers.map(d => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      licenseNumber: d.licenseNumber,
      status: d.status,
      vehicleId: d.vehicles[0]?.id || null,
      plateNumber: d.vehicles[0]?.plateNumber || null,
      model: d.vehicles[0]?.model || null,
      type: d.vehicles[0]?.type || null,
      capacity: d.vehicles[0]?.capacity || null,
      vehicleStatus: d.vehicles[0]?.status || null
    }))

    // Get all vehicles with their assignments
    const vehicles = await prisma.vehicle.findMany({
      include: {
        driver: true
      },
      orderBy: { plateNumber: 'asc' }
    })

    const formattedVehicles = vehicles.map(v => ({
      id: v.id,
      plateNumber: v.plateNumber,
      model: v.model,
      type: v.type,
      capacity: v.capacity,
      status: v.status,
      driverId: v.driverId,
      driverName: v.driver?.name || null
    }))

    return NextResponse.json({
      drivers: formattedDrivers,
      vehicles: formattedVehicles,
    })
  } catch (error: any) {
    console.error('Error fetching assignments:', error)
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only ADMIN and MANAGER can manage assignments
    await requireManagerOrAdmin(request)

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
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true, status: true }
    })
    
    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }
    if (driver.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Driver is not active' },
        { status: 400 }
      )
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, plateNumber: true, status: true, driverId: true }
    })
    
    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }
    
    // In our Prisma schema, VehicleStatus doesn't have OUT_OF_SERVICE (it has MAINTENANCE)
    // We'll check for MAINTENANCE or just skip this specific legacy check if it's not in the enum
    if (vehicle.status === 'MAINTENANCE') {
      return NextResponse.json(
        { error: 'Vehicle is in maintenance' },
        { status: 400 }
      )
    }

    // Check if vehicle is already assigned to this driver
    if (vehicle.driverId === driverId) {
      return NextResponse.json(
        { error: 'Vehicle is already assigned to this driver' },
        { status: 400 }
      )
    }

    // Assign vehicle to driver
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { driverId }
    })

    return NextResponse.json(
      {
        success: true,
        message: `Vehicle ${vehicle.plateNumber} assigned to driver`,
        vehicle: updatedVehicle,
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
