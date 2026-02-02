import { prisma } from '@/lib/prisma'
import * as fs from 'fs'

async function exportData() {
  try {
    console.log('🚀 Exporting production data...\n')

    const statements: string[] = []

    // Export all data from each table
    const tables = [
      { name: 'Customer', prisma: prisma.customer },
      { name: 'CustomerBranch', prisma: prisma.customerBranch },
      { name: 'Product', prisma: prisma.product },
      { name: 'Driver', prisma: prisma.driver },
      { name: 'Vehicle', prisma: prisma.vehicle },
      { name: 'Order', prisma: prisma.order },
      { name: 'OrderItem', prisma: prisma.orderItem },
      { name: 'Delivery', prisma: prisma.delivery },
      { name: 'Assignment', prisma: prisma.assignment },
      { name: 'IssueCategory', prisma: prisma.issueCategory },
    ]

    for (const table of tables) {
      const data = await table.prisma.findMany()
      console.log(`✅ ${table.name}: ${data.length} records`)

      if (data.length > 0) {
        const firstRow = data[0]
        const columns = Object.keys(firstRow)
          .map((col) => `"${col}"`)
          .join(',')

        for (const row of data) {
          const values = Object.values(row)
            .map((val) => {
              if (val === null) return 'NULL'
              if (typeof val === 'string')
                return `'${val.replace(/'/g, "''")}'`
              if (typeof val === 'boolean') return val ? 'true' : 'false'
              if (val instanceof Date)
                return `'${val.toISOString()}'`
              if (typeof val === 'object')
                return `'${JSON.stringify(val).replace(/'/g, "''")}'`
              return val
            })
            .join(',')

          statements.push(
            `INSERT INTO "${table.name}" (${columns}) VALUES (${values});`
          )
        }
      }
    }

    const sql = statements.join('\n')
    fs.writeFileSync(
      '/tmp/evercold-production-data.sql',
      sql
    )

    console.log(`\n✅ Export complete!`)
    console.log(`📊 Total statements: ${statements.length}`)
    console.log(`📝 File: /tmp/evercold-production-data.sql`)
    console.log(`📦 Size: ${(sql.length / 1024).toFixed(2)} KB`)

    await prisma.$disconnect()
  } catch (error: any) {
    console.error('❌ Export failed:', error.message)
    await prisma.$disconnect()
    process.exit(1)
  }
}

exportData()
