import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';
import { requireUser, handleAuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Only Admin and Manager can list users
        await requireUser([UserRole.ADMIN, UserRole.MANAGER]);

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(users);
    } catch (error: any) {
        return handleAuthError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        // Only Admin can create users
        await requireUser([UserRole.ADMIN]);

        const body = await request.json();
        const { name, email, password, role } = body;

        // Basic validation
        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hash(password, 10);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: role as UserRole,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error: any) {
        return handleAuthError(error);
    }
}
