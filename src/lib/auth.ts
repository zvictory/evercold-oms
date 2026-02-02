import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// Session duration in hours
const SESSION_DURATION_HOURS = 24;

/**
 * Create a new session for user
 * @param userId - User ID to create session for
 * @param durationHours - Session duration in hours (default 24)
 * @returns Session token
 */
export async function createUserSession(
  userId: string,
  durationHours: number = SESSION_DURATION_HOURS
): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + durationHours);

  await prisma.userSession.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Validate session token and return user
 * @param token - Session token to validate
 * @returns User if valid, null if invalid/expired
 */
export async function validateUserSession(token: string) {
  const session = await prisma.userSession.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // Check if session expired
  if (new Date() > session.expiresAt) {
    // Clean up expired session
    await prisma.userSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

/**
 * Delete user session (logout)
 * @param token - Session token to delete
 */
export async function deleteUserSession(token: string): Promise<void> {
  await prisma.userSession.delete({ where: { token } }).catch(() => {});
}

/**
 * Get current user from request
 * Checks Authorization header for Bearer token
 */
export async function getCurrentUser(request?: NextRequest) {
  if (!request) {
    return null;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix
  return await validateUserSession(token);
}

/**
 * Require authenticated user with optional role check
 * Throws AuthError if not authenticated or insufficient permissions
 */
export async function requireUser(
  request: NextRequest,
  allowedRoles?: UserRole[]
) {
  const user = await getCurrentUser(request);

  if (!user || !user.isActive) {
    throw new AuthError('Unauthorized', 401);
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new AuthError('Forbidden: Insufficient permissions', 403);
  }

  return user;
}

/**
 * Convenience: Require ADMIN role
 */
export async function requireAdmin(request: NextRequest) {
  return requireUser(request, [UserRole.ADMIN]);
}

/**
 * Convenience: Require ADMIN or MANAGER role
 */
export async function requireManagerOrAdmin(request: NextRequest) {
  return requireUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
}

/**
 * Wrapper for route handlers with auth
 * Usage: export const GET = withAuth(handler, [UserRole.ADMIN])
 */
export function withAuth(
  handler: (request: NextRequest, context?: any) => Promise<Response>,
  allowedRoles?: UserRole[]
) {
  return async (request: NextRequest, context?: any) => {
    try {
      await requireUser(request, allowedRoles);
      return handler(request, context);
    } catch (error: any) {
      return handleAuthError(error);
    }
  };
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Clean up expired user sessions
 */
export async function cleanExpiredUserSessions(): Promise<number> {
  const result = await prisma.userSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  return result.count;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function handleAuthError(error: any) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  );
}
