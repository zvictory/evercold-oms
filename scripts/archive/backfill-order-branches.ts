/**
 * Backfill script to populate missing branchId values in OrderItems
 *
 * This script analyzes existing orders and attempts to link them to branches by:
 * 1. Checking if branches exist for the customer
 * 2. If only one branch exists, link all items to that branch
 * 3. If multiple branches exist, keep as null (requires manual intervention)
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🔍 Starting branch backfill process...\n')

  // Get all orders with null branchId
  const ordersWithNullBranch = await prisma.order.findMany({
    where: {
      orderItems: {
        some: {
          branchId: null
        }
      }
    },
    include: {
      customer: {
        include: {
          branches: true
        }
      },
      orderItems: {
        where: {
          branchId: null
        }
      }
    }
  })

  console.log(`Found ${ordersWithNullBranch.length} orders with items missing branchId\n`)

  let updatedCount = 0
  let skippedCount = 0
  let multibranchCount = 0

  for (const order of ordersWithNullBranch) {
    const customerBranches = order.customer.branches.filter(b => b.isActive)

    console.log(`Order ${order.orderNumber} - Customer: ${order.customer.name}`)
    console.log(`  - ${order.orderItems.length} items without branch`)
    console.log(`  - ${customerBranches.length} active branches for customer`)

    if (customerBranches.length === 0) {
      console.log(`  ⚠️  SKIP: No branches found for customer\n`)
      skippedCount++
      continue
    }

    if (customerBranches.length === 1) {
      // Single branch - safe to auto-assign
      const branch = customerBranches[0]

      await prisma.orderItem.updateMany({
        where: {
          orderId: order.id,
          branchId: null
        },
        data: {
          branchId: branch.id
        }
      })

      console.log(`  ✅ Updated to branch: ${branch.branchCode} - ${branch.branchName}\n`)
      updatedCount++
    } else {
      // Multiple branches - can't auto-assign
      console.log(`  ℹ️  MULTIBRANCH: Customer has ${customerBranches.length} branches:`)
      customerBranches.forEach(b => {
        console.log(`     - ${b.branchCode}: ${b.branchName}`)
      })
      console.log(`  ⚠️  Manual review required\n`)
      multibranchCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`  ✅ Updated: ${updatedCount} orders`)
  console.log(`  ⚠️  Skipped (no branches): ${skippedCount} orders`)
  console.log(`  ℹ️  Needs manual review (multiple branches): ${multibranchCount} orders`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
