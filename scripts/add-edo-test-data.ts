import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find first order
  const order = await prisma.order.findFirst({
    select: { id: true, orderNumber: true, invoiceNumber: true }
  });

  if (!order) {
    console.log('No orders found in database');
    return;
  }

  console.log('Found order:', order);

  // Create EDO sync record with test data
  const edoSync = await prisma.edoDocumentSync.create({
    data: {
      orderId: order.id,
      edoProvider: 'didox',
      syncStatus: 'SENT',
      documentData: {
        didoxId: '11f0d4dd48a7785c920b1e0008000075',
        roumingId: '6937e4cc3b40e6ee908d6344',
        documentType: 'Стандартный',
        sentStamp: {
          number: '№2022895979',
          timestamp: '2025-12-09T13:58:52Z',
          operatorName: 'NASRITDINOV ZUXRITDIN ERKINOVICH',
          operatorSystem: 'didox.uz',
          ipAddress: '89.236.232.33'
        },
        confirmedStamp: {
          number: '№2020567907',
          timestamp: '2025-12-09T14:36:57Z',
          operatorName: 'USMANOV AZIZBEK MAMUR O\'G\'LI',
          operatorSystem: 'app.hippo.uz',
          ipAddress: '89.249.60.188'
        },
        qrCodeData: 'https://didox.uz/verify/11f0d4dd48a7785c920b1e0008000075'
      }
    }
  });

  console.log('\n✅ EDO test data created successfully!');
  console.log('EDO Sync ID:', edoSync.id);
  console.log('Order Number:', order.orderNumber);
  console.log('\nYou can now test by generating invoice for order:', order.orderNumber);
}

main()
  .then(() => {
    console.log('\n✨ Script completed');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
