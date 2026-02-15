import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const { driverId } = await params

    // Check if driver has an assignment
    const vehicle = await prisma.vehicle.findFirst({
      where: { driverId },
      select: { id: true, plateNumber: true }
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Driver has no vehicle assignment' },
        { status: 404 }
      )
    }

    // Unassign vehicle
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { driverId: null }
    })

    return NextResponse.json(
      {
        success: true,
        message: `Vehicle ${vehicle.plateNumber} unassigned`,
        vehicle: updatedVehicle,
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
