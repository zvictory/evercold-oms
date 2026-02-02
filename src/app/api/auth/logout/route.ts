import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    let token = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = request.cookies.get('authToken')?.value;
    }

    if (token) {
      // Delete session from database
      await prisma.userSession.deleteMany({
        where: { token },
      }).catch(() => {});
    }

    // Return success response
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Also clear the auth cookie if it exists
    response.cookies.set('authToken', '', {
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
