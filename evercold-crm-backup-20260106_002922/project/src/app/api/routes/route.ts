import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/routes
 * Fetch all delivery routes with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const driverId = searchParams.get('driverId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) {
        where.scheduledDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.scheduledDate.lte = new Date(endDate);
      }
    }

    const routes = await prisma.deliveryRoute.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
          },
        },
        stops: {
          select: {
            id: true,
            stopNumber: true,
            status: true,
          },
          orderBy: {
            stopNumber: 'asc',
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });

    return NextResponse.json({ routes });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}
