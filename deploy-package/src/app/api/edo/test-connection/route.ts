import { NextRequest, NextResponse } from 'next/server';
import { EdoService } from '@/lib/edo/service';

// POST /api/edo/test-connection - Test EDO system connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { integrationId } = body;

    if (!integrationId) {
      return NextResponse.json(
        { error: 'integrationId is required' },
        { status: 400 }
      );
    }

    const isConnected = await EdoService.testConnection(integrationId);

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to EDO system',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to connect to EDO system. Please check your credentials.',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('EDO connection test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Connection test failed',
      },
      { status: 500 }
    );
  }
}
