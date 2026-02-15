import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch products with customer-specific prices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Fetch all products with their customer-specific prices
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        unitPrice: true,
        unit: true,
        customerPrices: {
          where: { customerId },
          select: { unitPrice: true }
        }
      },
      orderBy: { name: 'asc' },
    });

    // Format the response
    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      unitPrice: p.unitPrice,
      unit: p.unit,
      customerPrice: p.customerPrices[0]?.unitPrice,
    }));

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error('Error fetching customer prices:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Save customer-specific prices
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, prices } = body;

    if (!customerId || !Array.isArray(prices)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Delete all existing customer prices for this customer
    await prisma.customerProductPrice.deleteMany({
      where: { customerId },
    });

    // Create new customer prices
    if (prices.length > 0) {
      await prisma.customerProductPrice.createMany({
        data: prices.map(p => ({
          customerId,
          productId: p.productId,
          unitPrice: p.unitPrice,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      count: prices.length,
    });
  } catch (error: any) {
    console.error('Error saving customer prices:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
