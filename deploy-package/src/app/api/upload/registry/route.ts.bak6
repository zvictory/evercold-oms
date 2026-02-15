import { NextRequest, NextResponse } from 'next/server'
import { RegistryParser } from '@/lib/services/registry-parser'
import { requireAdmin, handleAuthError } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    // CRITICAL: Only ADMIN can import registry data
    const user = await requireAdmin(req)

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const parser = new RegistryParser()
    const result = await parser.parseAndImport(buffer)

    console.log(`[AUDIT] User ${user.email} (${user.id}) imported registry`)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Registry upload error:', error)
    return handleAuthError(error)
  }
}
