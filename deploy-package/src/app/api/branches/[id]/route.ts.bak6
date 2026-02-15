import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/branches/[id]
 * Fetch a specific branch
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const branch = await prisma.customerBranch.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            name: true,
            customerCode: true,
          },
        },
      },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json({ branch });
  } catch (error: any) {
    console.error('Fetch branch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch branch' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/branches/[id]
 * Update a branch
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const branch = await prisma.customerBranch.update({
      where: { id },
      data: {
        ...(body.branchName !== undefined && { branchName: body.branchName }),
        ...(body.branchCode !== undefined && { branchCode: body.branchCode }),
        ...(body.fullName !== undefined && { fullName: body.fullName }),
        ...(body.deliveryAddress !== undefined && { deliveryAddress: body.deliveryAddress || null }),
        ...(body.contactPerson !== undefined && { contactPerson: body.contactPerson || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.latitude !== undefined && { latitude: body.latitude }),
        ...(body.longitude !== undefined && { longitude: body.longitude }),
        ...(body.region !== undefined && { region: body.region || null }),
        ...(body.city !== undefined && { city: body.city || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ branch });
  } catch (error: any) {
    console.error('Update branch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update branch' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/branches/[id]
 * Delete a branch
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if branch has associated order items
    const orderItems = await prisma.orderItem.findFirst({
      where: { branchId: id },
    });

    if (orderItems) {
      return NextResponse.json(
        {
          error: 'Cannot delete branch with existing orders. Please deactivate it instead.',
        },
        { status: 400 }
      );
    }

    await prisma.customerBranch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete branch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete branch' },
      { status: 500 }
    );
  }
}
