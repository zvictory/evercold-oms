import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireManagerOrAdmin, handleAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireUser(request)

    const groups = await prisma.customerGroup.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            customers: true,
            priceLists: true,
          },
        },
      },
    })

    return NextResponse.json(groups)
  } catch (error: any) {
    console.error('Fetch customer groups error:', error)
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireManagerOrAdmin(request)

    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    const group = await prisma.customerGroup.create({
      data: {
        name: body.name.trim(),
        description: body.description || null,
        sortOrder: body.sortOrder ?? 0,
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error: any) {
    console.error('Create customer group error:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A group with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create customer group' },
      { status: 500 }
    )
  }
}
