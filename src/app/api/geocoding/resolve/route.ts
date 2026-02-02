import { NextRequest, NextResponse } from 'next/server';
import nominatimGeocodingService from '@/lib/nominatimGeocodingService';
import type { GeocodingRequest, GeocodingResponse } from '@/types/geocoding';

export async function POST(request: NextRequest) {
  try {
    const body: GeocodingRequest = await request.json();

    // Validate request
    if (!body.address || typeof body.address !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Address is required and must be a string',
        } as GeocodingResponse,
        { status: 400 }
      );
    }

    const address = body.address.trim();
    if (address.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address cannot be empty',
        } as GeocodingResponse,
        { status: 400 }
      );
    }

    // Geocode the address
    const result = await nominatimGeocodingService.geocodeAddress({
      address,
      city: body.city,
    });

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not find location. Try adding more details like street name or city.',
        } as GeocodingResponse,
        { status: 404 }
      );
    }

    // Return successful result
    return NextResponse.json(
      {
        success: true,
        result,
      } as GeocodingResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('[Geocoding API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while geocoding address',
      } as GeocodingResponse,
      { status: 500 }
    );
  }
}
