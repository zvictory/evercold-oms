import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/driverAuth';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or request body
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.replace('Bearer ', '');

    if (!token) {
      const body = await request.json();
      token = body.token;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Delete the session
    const deleted = await deleteSession(token);

    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Logged out successfully' : 'Session not found'
    });
  } catch (error) {
    console.error('Driver logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
