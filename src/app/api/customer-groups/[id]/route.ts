import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireManagerOrAdmin, handleAuthError } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request)
    const { id } = await params

    const group = await prisma.customerGroup.findUnique({
      where: { id },
      include: {
        customers: {
          select: { id: true, name: true, customerCode: true },
          orderBy: { name: 'asc' },
        },
        priceLists: {
          include: {
            product: {
              select: { id: true, name: true, sapCode: true, unitPrice: true },
            },
          },
          orderBy: { product: { name: 'asc' } },
        },
        _count: {
          select: { customers: true, priceLists: true },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error: any) {
    console.error('Fetch customer group error:', error)
    return handleAuthError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManagerOrAdmin(request)
    const { id } = await params
    const body = await request.json()

    const group = await prisma.customerGroup.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      },
    })

    return NextResponse.json(group)
  } catch (error: any) {
    console.error('Update customer group error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update group' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManagerOrAdmin(request)
    const { id } = await params

    // Soft delete
    await prisma.customerGroup.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete customer group error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete group' },
      { status: 500 }
    )
  }
}
