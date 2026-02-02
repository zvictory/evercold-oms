import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params
    const body = await request.json()

    // Check if branch with this branchCode already exists
    const existingBranch = await prisma.customerBranch.findUnique({
      where: { branchCode: body.branchCode },
    })

    if (existingBranch) {
      return NextResponse.json(
        { error: `Филиал с кодом "${body.branchCode}" уже существует` },
        { status: 409 }
      )
    }

    const branch = await prisma.customerBranch.create({
      data: {
        customerId,
        branchName: body.branchName,
        branchCode: body.branchCode,
        fullName: body.fullName || `${body.branchName} (${body.branchCode})`,
        deliveryAddress: body.deliveryAddress || body.address,
        contactPerson: body.contactPerson,
        phone: body.contactPhone || body.phone,
        latitude: body.latitude,
        longitude: body.longitude,
      },
    })

    return NextResponse.json(branch)
  } catch (error: any) {
    console.error('Create branch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create branch' },
      { status: 500 }
    )
  }
}
