/**
 * Smart backfill: Parse uploaded files to find the correct branch for each order
 */

import { prisma } from '../src/lib/prisma'
import { parsePurchaseOrderFile } from '../src/lib/parsers/purchase-order-parser'
import { readdirSync } from 'fs'
import { join } from 'path'

async function main() {
  console.log('📁 Building order -> branch mapping from uploaded files...\n')

  const uploadDir = 'public/uploads'
  const files = readdirSync(uploadDir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'))

  // Map: orderNumber -> { branchCode, branchName }
  const orderBranchMap = new Map<string, { branchCode: string; branchName: string }>()

  for (const file of files) {
    try {
      const filepath = join(uploadDir, file)
      const orders = await parsePurchaseOrderFile(filepath)

      orders.forEach(order => {
        // Each order should have items with the same branch (since they're from the same order)
        const firstItem = order.items[0]
        if (firstItem?.branchCode && firstItem?.branchName) {
          orderBranchMap.set(order.orderNumber, {
            branchCode: firstItem.branchCode,
            branchName: firstItem.branchName
          })
        }
      })
    } catch (error: any) {
      console.log(`  ⚠️  Skipping ${file}: ${error.message}`)
    }
  }

  console.log(`Found branch info for ${orderBranchMap.size} orders\n`)

  // Get all orders with null branchId
  const ordersToFix = await prisma.order.findMany({
    where: {
      orderItems: {
        some: {
          branchId: null
        }
      }
    },
    include: {
      orderItems: {
        where: {
          branchId: null
        }
      }
    }
  })

  console.log(`Found ${ordersToFix.length} orders needing fixes\n`)

  let updated = 0
  let notFound = 0

  for (const order of ordersToFix) {
    const branchInfo = orderBranchMap.get(order.orderNumber)

    if (!branchInfo) {
      console.log(`  ⚠️  ${order.orderNumber}: Branch info not found in uploaded files`)
      notFound++
      continue
    }

    // Find the branch by code
    const branch = await prisma.customerBranch.findFirst({
      where: {
        OR: [
          { branchCode: branchInfo.branchCode },
          { oldBranchCode: branchInfo.branchCode }
        ]
      }
    })

    if (!branch) {
      console.log(`  ❌ ${order.orderNumber}: Branch ${branchInfo.branchCode} not found in database`)
      notFound++
      continue
    }

    // Update all items in this order
    await prisma.orderItem.updateMany({
      where: {
        orderId: order.id,
        branchId: null
      },
      data: {
        branchId: branch.id
      }
    })

    console.log(`  ✅ ${order.orderNumber}: Linked to ${branch.branchCode} - ${branch.branchName}`)
    updated++
  }

  console.log(`\n📊 Summary:`)
  console.log(`  ✅ Updated: ${updated} orders`)
  console.log(`  ❌ Not found: ${notFound} orders`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
