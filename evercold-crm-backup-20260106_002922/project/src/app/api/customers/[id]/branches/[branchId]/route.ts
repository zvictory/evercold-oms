import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; branchId: string }> }
) {
  try {
    const { branchId } = await params
    const body = await request.json()

    const branch = await prisma.customerBranch.update({
      where: { id: branchId },
      data: {
        branchName: body.branchName,
        branchCode: body.branchCode,
        fullName: body.fullName || `${body.branchName} (${body.branchCode})`,
        deliveryAddress: body.deliveryAddress || body.address,
        contactPerson: body.contactPerson,
        phone: body.contactPhone || body.phone,
      },
    })

    return NextResponse.json(branch)
  } catch (error: any) {
    console.error('Update branch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update branch' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; branchId: string }> }
) {
  try {
    const { branchId } = await params

    await prisma.customerBranch.delete({
      where: { id: branchId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete branch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete branch' },
      { status: 500 }
    )
  }
}
