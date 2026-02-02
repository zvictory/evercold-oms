import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://zafar@localhost:5432/evercold_crm',
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = `SELECT id, "plateNumber", model, type, capacity, status, "driverId", notes, "createdAt", "updatedAt" FROM "Vehicle"`
    const params: any[] = []

    if (status) {
      query += ` WHERE status = $1`
      params.push(status)
    }

    query += ` ORDER BY "plateNumber" ASC`

    const result = await pool.query(query, params)

    // Transform data for response
    const vehicles = result.rows.map((vehicle: any) => ({
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      model: vehicle.model,
      type: vehicle.type,
      capacity: vehicle.capacity,
      status: vehicle.status,
      driverId: vehicle.driverId,
      notes: vehicle.notes,
      driver: null,
      currentLoad: {
        weight: 0,
        percentage: 0,
        itemCount: 0,
      },
    }))

    return NextResponse.json({ vehicles })
  } catch (error: any) {
    console.error('Fetch vehicles error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "Vehicle" (id, "plateNumber", model, type, capacity, status, "driverId", notes, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        body.plateNumber,
        body.model,
        body.type || 'VAN',
        body.capacity ? parseFloat(body.capacity) : null,
        body.status || 'AVAILABLE',
        body.driverId || null,
        body.notes || null,
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Create vehicle error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create vehicle' },
      { status: 500 }
    )
  }
}
