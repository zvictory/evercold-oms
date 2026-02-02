import { prisma } from '../src/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  try {
    // Read branch data from JSON file
    const jsonPath = path.join(__dirname, '..', 'korzinka_branches.json')
    const branchesData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

    console.log(`Loaded ${branchesData.length} branches from JSON file\n`)

    // Find Korzinka customer
    const korzinkaCustomer = await prisma.customer.findFirst({
      where: {
        name: {
          contains: 'Korzinka',
          mode: 'insensitive',
        },
      },
    })

    if (!korzinkaCustomer) {
      console.error('❌ Korzinka customer not found!')
      console.log('Creating Korzinka customer...')

      const newCustomer = await prisma.customer.create({
        data: {
          name: 'Korzinka',
          customerCode: 'KORZINKA',
          isActive: true,
        },
      })

      console.log(`✓ Created Korzinka customer (ID: ${newCustomer.id})\n`)

      return updateBranches(newCustomer.id, branchesData)
    }

    console.log(`Found Korzinka customer: ${korzinkaCustomer.name} (ID: ${korzinkaCustomer.id})\n`)

    return updateBranches(korzinkaCustomer.id, branchesData)
  } catch (error) {
    console.error('Fatal error:', error)
    throw error
  }
}

async function updateBranches(customerId: string, branchesData: any[]) {
  let updated = 0
  let created = 0
  let errors = 0

  for (const branch of branchesData) {
    try {
      const existingBranch = await prisma.customerBranch.findUnique({
        where: { branchCode: branch.branchCode },
      })

      if (existingBranch) {
        // Update existing branch
        await prisma.customerBranch.update({
          where: { branchCode: branch.branchCode },
          data: {
            branchName: branch.branchName,
            fullName: branch.fullName,
            deliveryAddress: branch.deliveryAddress,
            region: branch.region,
            city: branch.city,
            operatingHours: branch.operatingHours,
            latitude: branch.latitude,
            longitude: branch.longitude,
          },
        })
        console.log(`✓ Updated: ${branch.fullName}`)
        updated++
      } else {
        // Create new branch
        await prisma.customerBranch.create({
          data: {
            customerId,
            branchCode: branch.branchCode,
            branchName: branch.branchName,
            fullName: branch.fullName,
            deliveryAddress: branch.deliveryAddress || '',
            region: branch.region,
            city: branch.city,
            operatingHours: branch.operatingHours,
            latitude: branch.latitude,
            longitude: branch.longitude,
          },
        })
        console.log(`✓ Created: ${branch.fullName}`)
        created++
      }
    } catch (error: any) {
      console.error(`✗ Error processing ${branch.branchCode}: ${error.message}`)
      errors++
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Summary:`)
  console.log(`  Updated: ${updated}`)
  console.log(`  Created: ${created}`)
  console.log(`  Errors: ${errors}`)
  console.log(`  Total: ${branchesData.length}`)
  console.log(`${'='.repeat(50)}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
