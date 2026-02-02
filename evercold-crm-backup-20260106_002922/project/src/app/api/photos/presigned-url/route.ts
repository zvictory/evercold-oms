import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/photos/presigned-url
 * Get presigned URL for uploading photo to cloud storage
 *
 * In production, this would integrate with Cloudflare R2 via API
 * For now, returns a fallback local upload endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoId, checklistId, contentType } = body;

    // Validate inputs
    if (!photoId || !checklistId) {
      return NextResponse.json(
        { error: 'Missing photoId or checklistId' },
        { status: 400 }
      );
    }

    // In production, this would generate a presigned URL from Cloudflare R2
    // For now, return a local upload endpoint
    // The client will upload to this endpoint and we'll handle storage

    const presignedUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/photos/upload?id=${photoId}&checklistId=${checklistId}&type=${encodeURIComponent(contentType)}`;

    return NextResponse.json(
      {
        success: true,
        presignedUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
}
