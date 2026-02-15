import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'delivery-photos');

/**
 * POST /api/photos/sync
 * Sync offline photos when connection is restored
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoId, checklistId, blob } = body;

    if (!photoId || !checklistId) {
      return NextResponse.json(
        { error: 'Missing photoId or checklistId' },
        { status: 400 }
      );
    }

    // If blob is a base64 string, convert it
    let buffer: Buffer;
    if (typeof blob === 'string') {
      // Remove data URL prefix if present
      const base64 = blob.replace(/^data:image\/[a-z]+;base64,/, '');
      buffer = Buffer.from(base64, 'base64');
    } else {
      buffer = Buffer.from(blob);
    }

    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Create subdirectory for this checklist
    const checklistDir = join(UPLOAD_DIR, checklistId);
    if (!existsSync(checklistDir)) {
      await mkdir(checklistDir, { recursive: true });
    }

    // Generate filename
    const timestamp = Date.now();
    const filename = `${photoId}-${timestamp}.jpg`;
    const filepath = join(checklistDir, filename);

    // Write file
    await writeFile(filepath, buffer);

    // Return public URL
    const publicUrl = `/delivery-photos/${checklistId}/${filename}`;

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error syncing photo:', error);
    return NextResponse.json(
      { error: 'Failed to sync photo' },
      { status: 500 }
    );
  }
}
