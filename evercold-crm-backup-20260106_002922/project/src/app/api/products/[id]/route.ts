import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        sapCode: body.sapCode,
        barcode: body.barcode,
        unitPrice: body.unitPrice,
        unit: body.unit,
        vatRate: body.vatRate,
        description: body.description,
        isActive: body.isActive,
      },
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.customerId) {
      const customerPrice = await prisma.customerProductPrice.upsert({
        where: {
          customerId_productId: {
            customerId: body.customerId,
            productId: id,
          },
        },
        create: {
          customerId: body.customerId,
          productId: id,
          unitPrice: body.unitPrice,
        },
        update: {
          unitPrice: body.unitPrice,
        },
      })

      return NextResponse.json(customerPrice)
    }

    return NextResponse.json({ error: 'customerId required' }, { status: 400 })
  } catch (error: any) {
    console.error('Set customer price error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set customer price' },
      { status: 500 }
    )
  }
}
