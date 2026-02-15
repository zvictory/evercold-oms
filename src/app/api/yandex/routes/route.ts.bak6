/**
 * POST /api/yandex/routes
 * Proxy endpoint for Yandex Routes API
 * Fetches a single route with turn-by-turn instructions and traffic data
 */

import { NextRequest, NextResponse } from 'next/server';
import { yandexRoutingService } from '@/lib/yandexRoutingService';

interface RouteRequest {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  includeTraffic?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RouteRequest;
    const { origin, destination, includeTraffic = true } = body;

    // Validate input
    if (!origin || !destination || typeof origin.latitude !== 'number' || typeof origin.longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid origin or destination coordinates' },
        { status: 400 }
      );
    }

    if (typeof destination.latitude !== 'number' || typeof destination.longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid destination coordinates' },
        { status: 400 }
      );
    }

    // Get route from Yandex service
    const route = await yandexRoutingService.getRoute(origin, destination, includeTraffic);

    if (!route) {
      return NextResponse.json(
        { error: 'Failed to fetch route from Yandex Maps' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      route,
    });
  } catch (error) {
    console.error('Error fetching Yandex route:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch route',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
