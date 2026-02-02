import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

// Mock user for development until full Auth is implemented
const MOCK_USER = {
    id: "mock-admin-id",
    name: "Dev Admin",
    email: "admin@example.com",
    role: "ADMIN" as UserRole,
    isActive: true,
};

export async function getCurrentUser() {
    // TODO: Replace with real session lookup
    // e.g., verify JWT from cookies or header
    return MOCK_USER;
}

export async function requireUser(allowedRoles?: UserRole[]) {
    const user = await getCurrentUser();

    if (!user || !user.isActive) {
        throw new AuthError("Unauthorized", 401);
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        throw new AuthError("Forbidden: Insufficient permissions", 403);
    }

    return user;
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
        return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
