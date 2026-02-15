import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

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
    const { checklistId, contentType } = body;
    // Generate a new ID if one isn't provided (which it won't be from the new frontend)
    const photoId = body.photoId || uuidv4();

    // Validate inputs
    if (!checklistId || !contentType) {
      return NextResponse.json(
        { error: 'Missing checklistId or contentType' },
        { status: 400 }
      );
    }

    // In production, this would generate a presigned URL from Cloudflare R2
    // For now, return a local upload endpoint mock that accepts PUT

    // We'll use a local API route that acts as the "bucket"
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const uploadUrl = `${baseUrl}/api/photos/upload?id=${photoId}&checklistId=${checklistId}&type=${encodeURIComponent(contentType)}`;
    // Match the path logic in upload/route.ts
    const ext = contentType.split('/')[1] || 'jpg';
    const publicUrl = `/delivery-photos/${checklistId}/${photoId}.${ext}`;

    return NextResponse.json(
      {
        success: true,
        uploadUrl, // The URL to PUT the file to
        url: publicUrl, // The resulting public URL (mocked)
        photoId
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
