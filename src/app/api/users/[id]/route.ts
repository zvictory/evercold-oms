import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';
import { requireUser, handleAuthError } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Only Admin can update users
        await requireUser([UserRole.ADMIN]);

        const { id } = await params;
        const body = await request.json();
        const { name, email, password, role, isActive } = body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData: any = {
            name,
            email,
            role: role as UserRole,
            isActive,
        };

        // If password provided, hash it
        if (password) {
            updateData.passwordHash = await hash(password, 10);
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error: any) {
        return handleAuthError(error);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Only Admin can delete/deactivate users
        await requireUser([UserRole.ADMIN]);

        const { id } = await params;

        // Soft delete (set isActive to false)
        const deactivatedUser = await prisma.user.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ message: 'User deactivated successfully' });
    } catch (error: any) {
        return handleAuthError(error);
    }
}
