#!/usr/bin/env tsx
/**
 * Migration Script: Orphaned Deliveries
 *
 * Finds deliveries that have a driverId assigned but no associated RouteStop.
 * Creates DeliveryRoute and RouteStop records to make them visible in driver dashboard.
 *
 * Usage: npx tsx scripts/migrate-orphaned-deliveries.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OrphanedDelivery {
  id: string;
  driverId: string;
  vehicleId: string | null;
  scheduledDate: Date | null;
  order: {
    orderNumber: string;
  };
}

async function migrateOrphanedDeliveries() {
  try {
    console.log('🔍 Searching for orphaned deliveries...\n');

    // Find deliveries with driverId but no routeStop
    const orphanedDeliveries = await prisma.delivery.findMany({
      where: {
        driverId: { not: null },
        routeStop: null,
        status: { in: ['PENDING', 'IN_TRANSIT'] },
      },
      include: {
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
    });

    if (orphanedDeliveries.length === 0) {
      console.log('✅ No orphaned deliveries found. All deliveries are properly routed!\n');
      return;
    }

    console.log(`📦 Found ${orphanedDeliveries.length} orphaned deliveries\n`);

    // Group deliveries by (driverId, vehicleId, scheduledDate) for efficient route creation
    const grouped = groupDeliveries(orphanedDeliveries);

    console.log(`📋 Will create ${Object.keys(grouped).length} routes\n`);

    let totalRoutesCreated = 0;
    let totalStopsCreated = 0;

    // Create routes for each group
    for (const [groupKey, deliveries] of Object.entries(grouped)) {
      const firstDelivery = deliveries[0];

      if (!firstDelivery.vehicleId) {
        console.log(`⚠️  Skipping deliveries for driver ${firstDelivery.driverId} - no vehicle assigned`);
        continue;
      }

      const scheduledDate = firstDelivery.scheduledDate || new Date();
      const dateStr = scheduledDate.toISOString().split('T')[0];

      console.log(`\n📍 Creating route for driver ${firstDelivery.driverId} on ${dateStr}`);
      console.log(`   Deliveries: ${deliveries.map(d => d.order.orderNumber).join(', ')}`);

      try {
        // Create route with all stops
        const route = await prisma.deliveryRoute.create({
          data: {
            routeName: `Миграция ${dateStr} (${deliveries.length} доставок)`,
            driverId: firstDelivery.driverId,
            vehicleId: firstDelivery.vehicleId,
            scheduledDate,
            status: 'PLANNED',
            optimizationMethod: 'migration',
            notes: 'Автоматически создано миграцией для устранения разорванных связей',
            stops: {
              create: deliveries.map((delivery, index) => ({
                deliveryId: delivery.id,
                stopNumber: index + 1,
                status: 'PENDING',
              })),
            },
          },
          include: {
            stops: true,
          },
        });

        console.log(`   ✅ Created route ${route.id} with ${route.stops.length} stops`);
        totalRoutesCreated++;
        totalStopsCreated += route.stops.length;
      } catch (error) {
        console.error(`   ❌ Failed to create route:`, error);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Routes created: ${totalRoutesCreated}`);
    console.log(`✅ Stops created: ${totalStopsCreated}`);
    console.log(`✅ Orphaned deliveries migrated: ${totalStopsCreated}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Group deliveries by driver, vehicle, and scheduled date
 */
function groupDeliveries(deliveries: OrphanedDelivery[]): Record<string, OrphanedDelivery[]> {
  const groups: Record<string, OrphanedDelivery[]> = {};

  for (const delivery of deliveries) {
    const dateStr = delivery.scheduledDate?.toISOString().split('T')[0] || 'no-date';
    const key = `${delivery.driverId}-${delivery.vehicleId || 'no-vehicle'}-${dateStr}`;

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(delivery);
  }

  return groups;
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration results...\n');

  const remainingOrphaned = await prisma.delivery.count({
    where: {
      driverId: { not: null },
      routeStop: null,
      status: { in: ['PENDING', 'IN_TRANSIT'] },
    },
  });

  if (remainingOrphaned === 0) {
    console.log('✅ Verification passed: No orphaned deliveries remain\n');
  } else {
    console.log(`⚠️  Warning: ${remainingOrphaned} orphaned deliveries still exist\n`);
  }

  const totalRoutes = await prisma.deliveryRoute.count({
    where: {
      optimizationMethod: 'migration',
    },
  });

  console.log(`📋 Migration routes created: ${totalRoutes}\n`);
}

// Run migration
migrateOrphanedDeliveries()
  .then(() => verifyMigration())
  .then(() => {
    console.log('✅ Migration completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
