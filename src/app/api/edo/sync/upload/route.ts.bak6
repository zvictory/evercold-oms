import { NextRequest, NextResponse } from 'next/server';
import { EdoService } from '@/lib/edo/service';

// POST /api/edo/sync/upload - Upload order to EDO system
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, integrationId } = body;

    if (!orderId || !integrationId) {
      return NextResponse.json(
        { error: 'orderId and integrationId are required' },
        { status: 400 }
      );
    }

    const result = await EdoService.syncOrderToEdo(orderId, integrationId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        syncId: result.syncId,
        externalId: result.externalId,
        message: 'Order successfully uploaded to EDO system',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('EDO upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
