import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { hashPin } from '@/lib/driverAuth'
import { requireUser, requireManagerOrAdmin, handleAuthError } from '@/lib/auth'

const pool = new Pool({
  connectionString: 'postgresql://zafar@localhost:5432/evercold_crm',
})

export async function GET(request: NextRequest) {
  try {
    // All authenticated users can view drivers
    await requireUser(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = `SELECT id, name, phone, email, "licenseNumber", "licenseExpiry", status, notes, "createdAt", "updatedAt" FROM "Driver"`
    const params: any[] = []

    if (status) {
      query += ` WHERE status = $1`
      params.push(status)
    }

    query += ` ORDER BY name ASC`

    const result = await pool.query(query, params)

    // Transform data for response
    const drivers = result.rows.map((driver: any) => ({
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      status: driver.status,
      notes: driver.notes,
      performance: {
        totalDeliveries: 0,
        onTimeDeliveries: 0,
        onTimePercentage: 0,
      },
    }))

    return NextResponse.json({ drivers })
  } catch (error: any) {
    console.error('Fetch drivers error:', error)
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  // Only ADMIN and MANAGER can create drivers
  await requireManagerOrAdmin(request)
  try {
    const body = await request.json()

    // Hash PIN if provided
    let hashedPin = null
    if (body.phonePin && body.phonePin.trim()) {
      hashedPin = await hashPin(body.phonePin)
    }

    const result = await pool.query(
      `INSERT INTO "Driver" (id, name, phone, email, "licenseNumber", "licenseExpiry", status, notes, "phonePin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        body.name,
        body.phone,
        body.email || null,
        body.licenseNumber,
        body.licenseExpiry ? new Date(body.licenseExpiry) : null,
        body.status || 'ACTIVE',
        body.notes || null,
        hashedPin,
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Create driver error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create driver' },
      { status: 500 }
    )
  }
}
