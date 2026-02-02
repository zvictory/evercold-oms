import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        branches: {
          orderBy: { branchName: 'asc' },
        },
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
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        customerCode: body.customerCode,
        email: body.email || body.contactEmail,
        phone: body.phone || body.contactPhone,
        headquartersAddress: body.headquartersAddress || body.address,
        contractNumber: body.contractNumber,
        contractDate: body.contractDate,
        hasVat: body.hasVat !== undefined ? body.hasVat : false,
        notes: body.notes,
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
