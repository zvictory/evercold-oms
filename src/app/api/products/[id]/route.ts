import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { productSchema } from '@/lib/validations/product'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        customerPrices: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Fetch product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
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

    // Validate with Zod
    const validated = productSchema.parse(body)

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: validated.name,
        sapCode: validated.sapCode || null,
        barcode: validated.barcode || null,
        sku: validated.sku || null,
        unitPrice: validated.unitPrice,
        unit: validated.unit,
        vatRate: validated.vatRate,
        description: validated.description || null,
        nationalCatalogCode: validated.nationalCatalogCode || null,
        nationalCatalogName: validated.nationalCatalogName || null,
      },
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Update product error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const field = (error.meta?.target as string[])?.[0] || 'field'
        return NextResponse.json(
          { error: `${field.toUpperCase()} already exists` },
          { status: 409 }
        )
      }
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors?.[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
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

    // Soft delete by setting isActive = false
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete product error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
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
