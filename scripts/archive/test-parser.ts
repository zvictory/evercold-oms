import { parsePurchaseOrderFile } from '../src/lib/parsers/purchase-order-parser'

async function main() {
  const testFile = 'public/uploads/1765620143941_Реестр заказов (1).xls'

  console.log(`Testing parser on: ${testFile}\n`)

  try {
    const orders = await parsePurchaseOrderFile(testFile)

    console.log(`Parsed ${orders.length} orders\n`)

    // Show first 3 orders with details
    orders.slice(0, 3).forEach((order, idx) => {
      console.log(`Order ${idx + 1}: ${order.orderNumber}`)
      console.log(`  Customer: ${order.customerName}`)
      console.log(`  Items: ${order.items.length}`)

      // Show first 2 items
      order.items.slice(0, 2).forEach((item, itemIdx) => {
        console.log(`    Item ${itemIdx + 1}:`)
        console.log(`      Material: ${item.materialCode}`)
        console.log(`      Product: ${item.productDescription}`)
        console.log(`      BranchCode: "${item.branchCode || '(empty)'}"`)
        console.log(`      BranchName: "${item.branchName || '(empty)'}"`)
        console.log(`      Quantity: ${item.quantity}`)
      })

      console.log()
    })
  } catch (error: any) {
    console.error('Parser error:', error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
