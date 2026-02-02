import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'delivery-photos');

/**
 * PUT /api/photos/upload
 * Handle photo upload from delivery checklist
 * Used as fallback when cloud storage is unavailable
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('id');
    const checklistId = searchParams.get('checklistId');

    if (!photoId || !checklistId) {
      return NextResponse.json(
        { error: 'Missing photoId or checklistId' },
        { status: 400 }
      );
    }

    // Get file data
    const buffer = await request.arrayBuffer();

    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Create subdirectory for this checklist
    const checklistDir = join(UPLOAD_DIR, checklistId);
    if (!existsSync(checklistDir)) {
      await mkdir(checklistDir, { recursive: true });
    }

    // Generate filename with timestamp and extension
    const timestamp = Date.now();
    const filename = `${photoId}-${timestamp}.jpg`;
    const filepath = join(checklistDir, filename);

    // Write file
    await writeFile(filepath, new Uint8Array(buffer));

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
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/photos/[photoId]
 * Delete a photo
 */
export async function DELETE(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const photoId = pathname.split('/').pop();

    if (!photoId) {
      return NextResponse.json(
        { error: 'Missing photo ID' },
        { status: 400 }
      );
    }

    // In a real implementation, delete from cloud storage
    // For now, just acknowledge the request
    // Photos in public directory will be cleaned up separately

    return NextResponse.json(
      {
        success: true,
        message: 'Photo marked for deletion',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
