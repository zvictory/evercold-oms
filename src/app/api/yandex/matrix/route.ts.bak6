/**
 * POST /api/yandex/matrix
 * Proxy endpoint for Yandex Matrix API
 * Calculates distance and duration matrix for multiple origin-destination pairs
 * Used for route optimization with traffic-aware times
 */

import { NextRequest, NextResponse } from 'next/server';
import { yandexRoutingService } from '@/lib/yandexRoutingService';

interface MatrixRequest {
  origins: Array<{ latitude: number; longitude: number }>;
  destinations: Array<{ latitude: number; longitude: number }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MatrixRequest;
    const { origins, destinations } = body;

    // Validate input
    if (!Array.isArray(origins) || !Array.isArray(destinations)) {
      return NextResponse.json(
        { error: 'Origins and destinations must be arrays' },
        { status: 400 }
      );
    }

    if (origins.length === 0 || destinations.length === 0) {
      return NextResponse.json(
        { error: 'Origins and destinations arrays cannot be empty' },
        { status: 400 }
      );
    }

    // Validate coordinate format
    const validateCoordinates = (coords: any[]) => {
      return coords.every(
        (c) =>
          typeof c.latitude === 'number' &&
          typeof c.longitude === 'number' &&
          c.latitude >= -90 &&
          c.latitude <= 90 &&
          c.longitude >= -180 &&
          c.longitude <= 180
      );
    };

    if (!validateCoordinates(origins) || !validateCoordinates(destinations)) {
      return NextResponse.json(
        { error: 'Invalid coordinate format. Latitude: -90 to 90, Longitude: -180 to 180' },
        { status: 400 }
      );
    }

    // Limit matrix size to prevent excessive API calls
    if (origins.length * destinations.length > 100) {
      return NextResponse.json(
        { error: 'Matrix size too large (max 100 cells). Reduce origins/destinations.' },
        { status: 400 }
      );
    }

    // Get matrix from Yandex service
    const matrix = await yandexRoutingService.getMatrix(origins, destinations);

    if (!matrix) {
      return NextResponse.json(
        { error: 'Failed to fetch matrix from Yandex Maps' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      matrix,
      metadata: {
        originCount: origins.length,
        destinationCount: destinations.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching Yandex matrix:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch matrix',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
