import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://zafar@localhost:5432/evercold_crm',
})

export async function GET(request: NextRequest) {
  try {
    // Get all drivers with their current vehicle assignments
    const driversResult = await pool.query(
      `SELECT
        d.id,
        d.name,
        d.phone,
        d."licenseNumber",
        d.status,
        v.id as "vehicleId",
        v."plateNumber",
        v.model,
        v.type,
        v.capacity,
        v.status as "vehicleStatus"
       FROM "Driver" d
       LEFT JOIN "Vehicle" v ON d.id = v."driverId"
       ORDER BY d.name`
    )

    // Get all vehicles with their assignments
    const vehiclesResult = await pool.query(
      `SELECT
        v.id,
        v."plateNumber",
        v.model,
        v.type,
        v.capacity,
        v.status,
        d.id as "driverId",
        d.name as "driverName"
       FROM "Vehicle" v
       LEFT JOIN "Driver" d ON v."driverId" = d.id
       ORDER BY v."plateNumber"`
    )

    return NextResponse.json({
      drivers: driversResult.rows,
      vehicles: vehiclesResult.rows,
    })
  } catch (error: any) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { driverId, vehicleId } = body

    // Validation
    if (!driverId || !vehicleId) {
      return NextResponse.json(
        { error: 'driverId and vehicleId are required' },
        { status: 400 }
      )
    }

    // Check if driver exists and is active
    const driverCheck = await pool.query(
      `SELECT id, status FROM "Driver" WHERE id = $1`,
      [driverId]
    )
    if (driverCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }
    if (driverCheck.rows[0].status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Driver is not active' },
        { status: 400 }
      )
    }

    // Check if vehicle exists
    const vehicleCheck = await pool.query(
      `SELECT id, "plateNumber", status, "driverId" FROM "Vehicle" WHERE id = $1`,
      [vehicleId]
    )
    if (vehicleCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }
    if (vehicleCheck.rows[0].status === 'OUT_OF_SERVICE') {
      return NextResponse.json(
        { error: 'Vehicle is out of service' },
        { status: 400 }
      )
    }

    // Check if vehicle is already assigned to this driver
    if (vehicleCheck.rows[0].driverId === driverId) {
      return NextResponse.json(
        { error: 'Vehicle is already assigned to this driver' },
        { status: 400 }
      )
    }

    // Assign vehicle to driver
    const result = await pool.query(
      `UPDATE "Vehicle" SET "driverId" = $1 WHERE id = $2 RETURNING *`,
      [driverId, vehicleId]
    )

    return NextResponse.json(
      {
        success: true,
        message: `Vehicle ${vehicleCheck.rows[0].plateNumber} assigned to driver`,
        vehicle: result.rows[0],
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create assignment' },
      { status: 500 }
    )
  }
}
