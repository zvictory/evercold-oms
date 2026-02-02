import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://zafar@localhost:5432/evercold_crm',
})

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT id, name, "customerCode", email, phone, "headquartersAddress", "contractNumber", "contractDate", "hasVat", notes, "createdAt", "updatedAt" FROM "Customer" ORDER BY name ASC`
    )

    const customers = result.rows.map((customer: any) => ({
      ...customer,
      branches: [],
      _count: {
        orders: 0,
        branches: 0,
      },
    }))

    return NextResponse.json(customers)
  } catch (error: any) {
    console.error('Fetch customers error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "Customer" (id, name, "customerCode", email, phone, "headquartersAddress", "contractNumber", "contractDate", "hasVat", notes, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        body.name,
        body.customerCode,
        body.email || body.contactEmail || null,
        body.phone || body.contactPhone || null,
        body.headquartersAddress || body.address || null,
        body.contractNumber || null,
        body.contractDate || null,
        body.hasVat !== undefined ? body.hasVat : false,
        body.notes || null,
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    )
  }
}
