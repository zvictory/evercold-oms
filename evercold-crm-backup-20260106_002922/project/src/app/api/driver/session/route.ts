import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/driverAuth';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // Validate the token
    const session = await validateToken(token);

    if (!session) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      driver: session.driver,
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Session validation failed' },
      { status: 500 }
    );
  }
}
