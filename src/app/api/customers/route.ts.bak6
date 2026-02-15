import { NextRequest, NextResponse } from 'next/server'
import { requireUser, requireManagerOrAdmin, handleAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // All authenticated users can view customers
    await requireUser(request)

    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        customerCode: true,
        email: true,
        phone: true,
        headquartersAddress: true,
        contractNumber: true,
        contractDate: true,
        hasVat: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            branches: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(customers)
  } catch (error: any) {
    console.error('Fetch customers error:', error)
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only ADMIN and MANAGER can create customers
    await requireManagerOrAdmin(request)

    const body = await request.json()

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        customerCode: body.customerCode,
        email: body.email || body.contactEmail || null,
        phone: body.phone || body.contactPhone || null,
        headquartersAddress: body.headquartersAddress || body.address || null,
        contractNumber: body.contractNumber || null,
        contractDate: body.contractDate || null,
        hasVat: body.hasVat !== undefined ? body.hasVat : false,
        notes: body.notes || null,
      },
    })

    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    )
  }
}
