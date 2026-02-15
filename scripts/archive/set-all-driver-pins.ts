/**
 * Set all driver PINs to "1234"
 */

import { prisma } from '../src/lib/prisma'
import { hashPin } from '../src/lib/driverAuth'

async function main() {
  console.log('🔐 Setting all driver PINs to "1234"...\n')

  // Hash the PIN
  const hashedPin = await hashPin('1234')

  // Get all drivers
  const drivers = await prisma.driver.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      phonePin: true
    }
  })

  console.log(`Found ${drivers.length} drivers\n`)

  let updated = 0
  let alreadySet = 0

  for (const driver of drivers) {
    if (driver.phonePin) {
      console.log(`  ✅ ${driver.name} (${driver.phone}): Updating PIN`)
      await prisma.driver.update({
        where: { id: driver.id },
        data: { phonePin: hashedPin }
      })
      updated++
    } else {
      console.log(`  🆕 ${driver.name} (${driver.phone}): Setting PIN`)
      await prisma.driver.update({
        where: { id: driver.id },
        data: { phonePin: hashedPin }
      })
      updated++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`  ✅ Updated: ${updated} drivers`)
  console.log(`\n🔑 All driver PINs are now set to: 1234`)
  console.log(`\n⚠️  Security Note: Consider changing these PINs to unique values in production!`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
