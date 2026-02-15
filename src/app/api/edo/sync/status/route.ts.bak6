import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/edo/sync/status - Get document sync status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const syncId = searchParams.get('syncId');
    const orderId = searchParams.get('orderId');
    const integrationId = searchParams.get('integrationId');

    // Get specific sync record by ID
    if (syncId) {
      const sync = await prisma.edoDocumentSync.findUnique({
        where: { id: syncId },
        include: {
          integration: {
            select: {
              id: true,
              name: true,
              provider: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
        },
      });

      if (!sync) {
        return NextResponse.json({ error: 'Sync record not found' }, { status: 404 });
      }

      return NextResponse.json({ sync });
    }

    // Get sync records by filters
    const where: any = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (integrationId) {
      where.integrationId = integrationId;
    }

    const syncs = await prisma.edoDocumentSync.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 records
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      syncs,
      count: syncs.length,
    });
  } catch (error: any) {
    console.error('EDO status check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
