import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        branches: {
          orderBy: { branchName: 'asc' },
        },
        productPrices: {
          include: {
            product: true,
          },
        },
        orders: {
          orderBy: { orderDate: 'desc' },
          take: 10,
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Fetch customer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer' },
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

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        customerCode: body.customerCode,
        email: body.email,
        phone: body.phone,
        headquartersAddress: body.headquartersAddress,
        contractNumber: body.contractNumber,
        hasVat: body.hasVat !== undefined ? body.hasVat : undefined,
        taxStatus: body.taxStatus || undefined,
        customerGroupId: body.customerGroupId !== undefined ? body.customerGroupId : undefined,
      },
    })

    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Update customer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
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

    await prisma.customer.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete customer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
