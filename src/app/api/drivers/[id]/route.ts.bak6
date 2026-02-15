import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPin } from '@/lib/driverAuth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        vehicles: true,
        deliveries: {
          include: {
            order: {
              include: {
                customer: true,
              },
            },
            vehicle: true,
          },
          orderBy: { scheduledDate: 'desc' },
          take: 20,
        },
      },
    })

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    return NextResponse.json(driver)
  } catch (error: any) {
    console.error('Fetch driver error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch driver' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Hash PIN if provided (only update if not empty)
    const updateData: any = {
      name: body.name,
      phone: body.phone,
      email: body.email,
      licenseNumber: body.licenseNumber,
      licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : null,
      status: body.status,
      notes: body.notes,
    }

    // Only update PIN if a new one is provided
    if (body.phonePin && body.phonePin.trim()) {
      updateData.phonePin = await hashPin(body.phonePin)
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(driver)
  } catch (error: any) {
    console.error('Update driver error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update driver' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.driver.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete driver error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete driver' },
      { status: 500 }
    )
  }
}
