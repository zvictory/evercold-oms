import { prisma } from './src/lib/prisma'

async function main() {
  // Update Korzinka to have VAT
  const result = await prisma.customer.updateMany({
    where: {
      name: {
        contains: 'Korzinka',
        mode: 'insensitive'
      }
    },
    data: {
      hasVat: true
    }
  })

  console.log(`Updated ${result.count} customers (Korzinka) to hasVat=true`)

  // Show all customers with their VAT status
  const customers = await prisma.customer.findMany({
    select: {
      name: true,
      hasVat: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  console.log('\nAll customers VAT status:')
  customers.forEach(c => {
    const vatStatus = c.hasVat ? 'С НДС' : 'Без НДС'
    console.log(`- ${c.name}: ${vatStatus}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
