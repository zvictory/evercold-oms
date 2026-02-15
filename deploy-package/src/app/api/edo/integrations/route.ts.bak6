import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/edo/integrations - List all integrations
export async function GET() {
  try {
    const integrations = await prisma.edoIntegration.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        provider: true,
        apiUrl: true,
        isActive: true,
        lastSyncAt: true,
        syncInterval: true,
        autoSync: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive fields
        apiKey: false,
        apiSecret: false,
        username: false,
        password: false,
      },
    });

    return NextResponse.json({ integrations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/edo/integrations - Create new integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const integration = await prisma.edoIntegration.create({
      data: {
        name: body.name,
        provider: body.provider,
        apiUrl: body.apiUrl,
        apiKey: body.apiKey,
        apiSecret: body.apiSecret,
        username: body.username,
        password: body.password,
        organizationId: body.organizationId,
        isActive: body.isActive ?? true,
        syncInterval: body.syncInterval ?? 3600,
        autoSync: body.autoSync ?? false,
      },
    });

    return NextResponse.json({ integration });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
