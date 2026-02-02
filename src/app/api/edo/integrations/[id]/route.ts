import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EdoService } from '@/lib/edo/service';

// GET /api/edo/integrations/[id] - Get single integration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const integration = await prisma.edoIntegration.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        provider: true,
        apiUrl: true,
        username: true,
        organizationId: true,
        isActive: true,
        lastSyncAt: true,
        syncInterval: true,
        autoSync: true,
        createdAt: true,
        updatedAt: true,
        // Exclude passwords
        apiKey: false,
        apiSecret: false,
        password: false,
      },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({ integration });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/edo/integrations/[id] - Update integration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const integration = await prisma.edoIntegration.update({
      where: { id },
      data: {
        name: body.name,
        apiUrl: body.apiUrl,
        apiKey: body.apiKey,
        apiSecret: body.apiSecret,
        username: body.username,
        password: body.password,
        organizationId: body.organizationId,
        isActive: body.isActive,
        syncInterval: body.syncInterval,
        autoSync: body.autoSync,
      },
    });

    return NextResponse.json({ integration });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/edo/integrations/[id] - Delete integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.edoIntegration.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
