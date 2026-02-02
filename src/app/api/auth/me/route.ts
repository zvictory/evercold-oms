
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
}
