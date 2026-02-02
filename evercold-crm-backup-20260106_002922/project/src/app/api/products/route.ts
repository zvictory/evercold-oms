import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const product = await prisma.product.create({
      data: {
        name: body.name,
        sapCode: body.sapCode,
        barcode: body.barcode,
        unitPrice: body.unitPrice,
        unit: body.unit || 'ШТ',
        vatRate: body.vatRate || 12,
        description: body.description,
      },
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}
