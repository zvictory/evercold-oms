import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { requireUser, handleAuthError } from '@/lib/auth'

const pool = new Pool({
  connectionString: 'postgresql://zafar@localhost:5432/evercold_crm',
})

export async function GET(request: NextRequest) {
  try {
    // All authenticated users can view driver-vehicle mappings
    await requireUser(request)
    // Get all drivers
    const driversResult = await pool.query(
      `SELECT id, name, phone, "licenseNumber", status, "createdAt" FROM "Driver" ORDER BY name`
    )

    // Get all vehicles
    const vehiclesResult = await pool.query(
      `SELECT id, "plateNumber", model, type, capacity, status, "driverId", "createdAt" FROM "Vehicle" ORDER BY "plateNumber"`
    )

    // Get driver-vehicle assignments
    const assignmentsResult = await pool.query(
      `SELECT d.id, d.name, array_agg(json_build_object(
        'vehicleId', v.id,
        'plateNumber', v."plateNumber",
        'model', v.model
      )) as vehicles
       FROM "Driver" d
       LEFT JOIN "Vehicle" v ON d.id = v."driverId"
       GROUP BY d.id, d.name
       ORDER BY d.name`
    )

    return NextResponse.json({
      drivers: driversResult.rows.map(d => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        licenseNumber: d.licenseNumber,
        status: d.status,
        createdAt: d.createdAt,
      })),
      vehicles: vehiclesResult.rows.map(v => ({
        id: v.id,
        plateNumber: v.plateNumber,
        model: v.model,
        type: v.type,
        capacity: v.capacity,
        status: v.status,
        driverId: v.driverId,
        createdAt: v.createdAt,
      })),
      assignments: assignmentsResult.rows,
      summary: {
        totalDrivers: driversResult.rows.length,
        totalVehicles: vehiclesResult.rows.length,
        assignedVehicles: vehiclesResult.rows.filter((v: any) => v.driverId).length,
        unassignedVehicles: vehiclesResult.rows.filter((v: any) => !v.driverId).length,
      },
    })
  } catch (error: any) {
    console.error('Error fetching drivers and vehicles:', error)
    return handleAuthError(error)
  }
}
