import { prisma } from '../src/lib/prisma'

async function main() {
  const total = await prisma.orderItem.count()
  const withBranch = await prisma.orderItem.count({
    where: { branchId: { not: null } }
  })

  console.log(`✅ Total OrderItems: ${total}`)
  console.log(`✅ OrderItems WITH branchId: ${withBranch}`)
  console.log(`❌ OrderItems WITHOUT branchId: ${total - withBranch}`)
  console.log(`📊 Percentage with branch: ${((withBranch / total) * 100).toFixed(1)}%`)

  // Sample some orders with their branch info
  const sampleOrders = await prisma.order.findMany({
    take: 5,
    include: {
      orderItems: {
        include: {
          branch: {
            select: {
              branchCode: true,
              branchName: true
            }
          }
        }
      }
    }
  })

  console.log(`\n📋 Sample orders:`)
  sampleOrders.forEach(order => {
    const branch = order.orderItems[0]?.branch
    console.log(`  ${order.orderNumber}: ${branch?.branchCode} - ${branch?.branchName || 'No branch'}`)
  })
}

main().then(() => process.exit(0))
