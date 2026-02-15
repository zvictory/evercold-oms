import { prisma } from '../src/lib/prisma'

async function main() {
  const branchCount = await prisma.customerBranch.count()
  const customerCount = await prisma.customer.count()

  console.log(`Total Customers: ${customerCount}`)
  console.log(`Total CustomerBranches: ${branchCount}`)

  if (branchCount > 0) {
    const samples = await prisma.customerBranch.findMany({
      take: 10,
      include: {
        customer: {
          select: { name: true }
        }
      }
    })

    console.log('\nSample branches:')
    samples.forEach(b => {
      console.log(`  - ${b.branchCode}: ${b.branchName} (Customer: ${b.customer.name})`)
    })
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
