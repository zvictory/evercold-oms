import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { productSchema } from '@/lib/validations/product'
import { requireUser, requireManagerOrAdmin, handleAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // All authenticated users can view products
    await requireUser(request)
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        customerPrices: customerId
          ? {
              where: {
                customerId,
              },
            }
          : true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    const productsWithPrices = products.map((product) => {
      const customerPrice = product.customerPrices?.[0]?.unitPrice
      const basePrice = product.unitPrice
      const priceToUse = customerPrice || basePrice
      const priceWithVat = priceToUse * (1 + product.vatRate / 100)

      return {
        ...product,
        currentPrice: priceToUse,
        priceWithVat,
        hasCustomerPrice: !!customerPrice,
      }
    })

    return NextResponse.json(productsWithPrices)
  } catch (error: any) {
    console.error('Fetch products error:', error)
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only ADMIN and MANAGER can create products
    await requireManagerOrAdmin(request)

    const body = await request.json()

    // Validate with Zod
    const validated = productSchema.parse(body)

    const product = await prisma.product.create({
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

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Create product error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const field = (error.meta?.target as string[])?.[0] || 'field'
        return NextResponse.json(
          { error: `${field.toUpperCase()} already exists` },
          { status: 409 }
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
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}
