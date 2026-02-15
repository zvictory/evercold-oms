import { NextResponse } from 'next/server'
// import { Pool } from 'pg' // DISABLED FOR MYSQL
import { formatDistanceToNow } from 'date-fns'

/* DISABLED FOR MYSQL - const pool = new Pool({
  connectionString: "postgresql://..." */ // DISABLED FOR MYSQL
// }) DISABLED FOR MYSQL

export async function GET() {
  return NextResponse.json({ message: 'Legacy route disabled for MySQL migration' })
  /*
  try {
    const today = new Date()
    // ... rest of the code
  } catch (error: any) {
    // ...
  }
  */
}
