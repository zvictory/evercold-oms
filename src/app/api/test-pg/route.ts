import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET() {
  const connectionString = 'postgresql://zafar@localhost:5432/evercold_crm'
  const pool = new Pool({
    connectionString,
  })

  try {
    const result = await pool.query('SELECT current_database() as database')
    const db = result.rows[0].database

    await pool.end()

    return NextResponse.json({
      success: true,
      database: db,
      connectionString: connectionString,
    })
  } catch (error: any) {
    await pool.end().catch(() => {})
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
