import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { prisma } from './prisma';

/**
 * Hash a PIN with bcrypt (10 rounds)
 * @param pin - The PIN to hash (should be 4-6 digits)
 * @returns Promise<string> - The hashed PIN
 */
export async function hashPin(pin: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(pin, saltRounds);
}

/**
 * Verify a PIN against a hash
 * @param pin - The plain text PIN
 * @param hash - The hashed PIN from database
 * @returns Promise<boolean> - True if PIN matches
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Generate a secure session token (UUID v4)
 * @returns string - A unique session token
 */
export function generateToken(): string {
  return randomUUID();
}

/**
 * Validate a session token and return the session if valid
 * @param token - The session token to validate
 * @returns Promise<DriverSession | null> - The session if valid and not expired, null otherwise
 */
export async function validateToken(token: string) {
  if (!token) return null;

  const session = await prisma.driverSession.findUnique({
    where: { token },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          status: true,
          licenseNumber: true,
          licenseExpiry: true,
        },
      },
    },
  });

  if (!session) return null;

  // Check if session has expired
  if (session.expiresAt < new Date()) {
    // Delete expired session
    await prisma.driverSession.delete({ where: { id: session.id } });
    return null;
  }

  return session;
}

/**
 * Create a new driver session
 * @param driverId - The driver's ID
 * @param expiresInHours - Session duration in hours (default: 24)
 * @returns Promise<string> - The generated session token
 */
export async function createSession(
  driverId: string,
  expiresInHours: number = 24
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  await prisma.driverSession.create({
    data: {
      token,
      driverId,
      expiresAt,
    },
  });

  return token;
}

/**
 * Delete a session (logout)
 * @param token - The session token to delete
 * @returns Promise<boolean> - True if session was deleted
 */
export async function deleteSession(token: string): Promise<boolean> {
  try {
    await prisma.driverSession.delete({ where: { token } });
    return true;
  } catch (error) {
    // Session might not exist
    return false;
  }
}

/**
 * Delete all sessions for a driver (logout from all devices)
 * @param driverId - The driver's ID
 * @returns Promise<number> - Number of sessions deleted
 */
export async function deleteAllDriverSessions(driverId: string): Promise<number> {
  const result = await prisma.driverSession.deleteMany({
    where: { driverId },
  });
  return result.count;
}

/**
 * Clean up expired sessions from the database
 * Should be run periodically (e.g., daily cron job)
 * @returns Promise<number> - Number of expired sessions deleted
 */
export async function cleanExpiredSessions(): Promise<number> {
  const result = await prisma.driverSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  return result.count;
}

/**
 * Update driver's last login timestamp
 * @param driverId - The driver's ID
 * @returns Promise<void>
 */
export async function updateLastLogin(driverId: string): Promise<void> {
  await prisma.driver.update({
    where: { id: driverId },
    data: { lastLoginAt: new Date() },
  });
}
