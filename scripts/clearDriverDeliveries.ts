import { prisma } from '../src/lib/prisma';

async function clearDriverDeliveries() {
  try {
    console.log('🔄 Clearing all deliveries and related data...');

    // Delete delivery-related records first (respecting foreign keys)
    const deletedPhotos = await prisma.deliveryPhoto.deleteMany({});
    console.log(`✓ Deleted ${deletedPhotos.count} delivery photos`);

    const deletedChecklists = await prisma.deliveryChecklist.deleteMany({});
    console.log(`✓ Deleted ${deletedChecklists.count} delivery checklists`);

    const deletedItems = await prisma.deliveryItem.deleteMany({});
    console.log(`✓ Deleted ${deletedItems.count} delivery items`);

    const deletedRouteStops = await prisma.routeStop.deleteMany({});
    console.log(`✓ Deleted ${deletedRouteStops.count} route stops`);

    const deletedDeliveries = await prisma.delivery.deleteMany({});
    console.log(`✓ Deleted ${deletedDeliveries.count} deliveries`);

    const deletedRoutes = await prisma.deliveryRoute.deleteMany({});
    console.log(`✓ Deleted ${deletedRoutes.count} delivery routes`);

    console.log('\n✅ All deliveries and related data cleared successfully!');
    console.log('Ready for fresh start 🚀\n');
  } catch (error) {
    console.error('❌ Error clearing deliveries:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDriverDeliveries();
