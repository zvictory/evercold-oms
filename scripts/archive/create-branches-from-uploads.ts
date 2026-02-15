/**
 * Create CustomerBranches by parsing all uploaded Excel files
 */

import { prisma } from '../src/lib/prisma'
import { parsePurchaseOrderFile } from '../src/lib/parsers/purchase-order-parser'
import { readdirSync } from 'fs'
import { join } from 'path'

async function main() {
  console.log('📁 Scanning uploaded files...\n')

  const uploadDir = 'public/uploads'
  const files = readdirSync(uploadDir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'))

  console.log(`Found ${files.length} files\n`)

  // Collect all unique branches
  const branchMap = new Map<string, { branchCode: string; branchName: string; customerName: string }>()

  for (const file of files.slice(0, 5)) { // Process first 5 files for testing
    try {
      console.log(`Parsing: ${file}`)
      const filepath = join(uploadDir, file)
      const orders = await parsePurchaseOrderFile(filepath)

      orders.forEach(order => {
        order.items.forEach(item => {
          if (item.branchCode && item.branchName) {
            branchMap.set(item.branchCode, {
              branchCode: item.branchCode,
              branchName: item.branchName,
              customerName: order.customerName
            })
          }
        })
      })
    } catch (error: any) {
      console.log(`  ⚠️  Failed: ${error.message}`)
    }
  }

  console.log(`\n📊 Found ${branchMap.size} unique branches\n`)

  // Find or create customer
  const customerName = 'Korzinka'
  let customer = await prisma.customer.findFirst({
    where: {
      name: { contains: customerName, mode: 'insensitive' }
    }
  })

  if (!customer) {
    console.log(`Creating customer: ${customerName}`)
    customer = await prisma.customer.create({
      data: {
        name: customerName,
        customerCode: 'KORZINKA',
        isActive: true
      }
    })
  } else {
    console.log(`Using existing customer: ${customer.name} (ID: ${customer.id})`)
  }

  // Create branches
  let created = 0
  let skipped = 0

  for (const [code, branch] of branchMap) {
    try {
      // Check if already exists
      const existing = await prisma.customerBranch.findFirst({
        where: { branchCode: code }
      })

      if (existing) {
        console.log(`  ⏭️  ${code}: Already exists`)
        skipped++
        continue
      }

      await prisma.customerBranch.create({
        data: {
          customerId: customer.id,
          branchCode: branch.branchCode,
          branchName: branch.branchName,
          fullName: `${customer.name} - ${branch.branchName}`,
          isActive: true
        }
      })

      console.log(`  ✅ ${code}: ${branch.branchName}`)
      created++
    } catch (error: any) {
      console.log(`  ❌ ${code}: ${error.message}`)
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`  ✅ Created: ${created} branches`)
  console.log(`  ⏭️  Skipped: ${skipped} branches`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
