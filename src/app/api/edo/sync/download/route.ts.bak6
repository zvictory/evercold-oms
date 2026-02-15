import { NextRequest, NextResponse } from 'next/server';
import { EdoService } from '@/lib/edo/service';

// GET /api/edo/sync/download - Download documents from EDO system
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const integrationId = searchParams.get('integrationId');

    if (!integrationId) {
      return NextResponse.json(
        { error: 'integrationId is required' },
        { status: 400 }
      );
    }

    // Parse optional filters
    const filters: {
      fromDate?: Date;
      toDate?: Date;
      documentType?: string;
    } = {};

    const fromDate = searchParams.get('fromDate');
    if (fromDate) {
      filters.fromDate = new Date(fromDate);
    }

    const toDate = searchParams.get('toDate');
    if (toDate) {
      filters.toDate = new Date(toDate);
    }

    const documentType = searchParams.get('documentType');
    if (documentType) {
      filters.documentType = documentType;
    }

    const result = await EdoService.downloadFromEdo(integrationId, filters);

    if (result.success) {
      return NextResponse.json({
        success: true,
        documents: result.documents,
        count: result.documents?.length || 0,
        message: `Downloaded ${result.documents?.length || 0} documents from EDO system`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('EDO download error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
