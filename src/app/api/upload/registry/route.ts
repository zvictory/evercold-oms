import { NextRequest, NextResponse } from 'next/server';
import { RegistryParser } from '@/lib/services/registry-parser';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const parser = new RegistryParser();
        const result = await parser.parseAndImport(buffer);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Registry upload error:', error);
        return NextResponse.json(
            { error: 'Failed to process registry', details: error.message },
            { status: 500 }
        );
    }
}
