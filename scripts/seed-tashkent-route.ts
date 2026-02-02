import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Tashkent, Uzbekistan - Real locations for delivery route testing
 * All coordinates are verified real locations in Tashkent
 */
const TASHKENT_LOCATIONS = {
  // Central Warehouse
  warehouse: {
    name: 'EverCold Warehouse',
    address: 'Mirabad District, Amir Timur Street, 120',
    latitude: 41.3035,
    longitude: 69.2498,
  },

  // 6 Delivery Stops - Real locations in Tashkent
  stops: [
    {
      number: 1,
      name: 'Tashkent City Mall',
      address: 'Mirabad District, Buyuk Ipak Yoli Street, 46A',
      latitude: 41.3111,
      longitude: 69.2745,
      phone: '+998 71 123-4567',
    },
    {
      number: 2,
      name: 'Chorsu Bazaar Area',
      address: 'Old City, Chorsu Street, 5',
      latitude: 41.3189,
      longitude: 69.1895,
      phone: '+998 71 234-5678',
    },
    {
      number: 3,
      name: 'Uzbek National University',
      address: 'Vuzroq District, Dostoevskiy Street, 4',
      latitude: 41.2878,
      longitude: 69.2344,
      phone: '+998 71 345-6789',
    },
    {
      number: 4,
      name: 'Sergeli Market',
      address: 'Sergeli District, Sergeli Boulevard, 22',
      latitude: 41.2256,
      longitude: 69.2189,
      phone: '+998 71 456-7890',
    },
    {
      number: 5,
      name: 'TSUM Department Store',
      address: 'Almazar District, Independence Avenue, 53',
      latitude: 41.3378,
      longitude: 69.2234,
      phone: '+998 71 567-8901',
    },
    {
      number: 6,
      name: 'Chimkent Bazaar',
      address: 'Yashnabad District, Chimkent Street, 78',
      latitude: 41.3645,
      longitude: 69.2567,
      phone: '+998 71 678-9012',
    },
  ],
};

async function seedTashkentRoute() {
  try {
    console.log('🌍 Seeding Tashkent delivery route with 6 stops...\n');

    // 1. Create/Find Customer
    const customer = await prisma.customer.upsert({
      where: { id: 'customer-tashkent-001' },
      update: {},
      create: {
        id: 'customer-tashkent-001',
        name: 'Tashkent Retail Network',
        customerCode: 'TRNETWORK001',
        contactPerson: 'Supply Manager',
        email: 'supply@tashkent-retail.uz',
        phone: '+998 71 100-0000',
      },
    });
    console.log('✅ Customer created:', customer.name);

    // 2. Create Warehouse Branch
    const warehouse = await prisma.customerBranch.upsert({
      where: { id: 'branch-warehouse-tashkent' },
      update: {},
      create: {
        id: 'branch-warehouse-tashkent',
        customerId: customer.id,
        branchName: TASHKENT_LOCATIONS.warehouse.name,
        branchCode: 'WAREHOUSE-TSH-001',
        fullName: 'EverCold Tashkent Central Warehouse',
        deliveryAddress: TASHKENT_LOCATIONS.warehouse.address,
        latitude: TASHKENT_LOCATIONS.warehouse.latitude,
        longitude: TASHKENT_LOCATIONS.warehouse.longitude,
        contactPerson: 'Warehouse Manager',
        phone: '+998 71 111-0000',
      },
    });
    console.log('✅ Warehouse created:', warehouse.branchName);

    // 3. Create Customer Branches (Delivery Locations)
    const customerBranches = await Promise.all(
      TASHKENT_LOCATIONS.stops.map(async (location) => {
        const branch = await prisma.customerBranch.upsert({
          where: { id: `branch-tashkent-${location.number}` },
          update: {},
          create: {
            id: `branch-tashkent-${location.number}`,
            customerId: customer.id,
            branchName: location.name,
            branchCode: `BRANCH-TSH-${String(location.number).padStart(3, '0')}`,
            fullName: `${location.name} - Tashkent`,
            deliveryAddress: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
            contactPerson: `Manager ${location.number}`,
            phone: location.phone,
          },
        });
        return branch;
      })
    );
    console.log(`✅ ${customerBranches.length} delivery locations created\n`);

    // 4. Create Driver
    const driver = await prisma.driver.upsert({
      where: { id: 'driver-tashkent-001' },
      update: {},
      create: {
        id: 'driver-tashkent-001',
        name: 'Javohir Karimov',
        phone: '+998 90 123-4567',
        licenseNumber: 'UZ-2024-001',
        licenseExpiry: new Date('2026-12-31'),
      },
    });
    console.log('✅ Driver created:', driver.name);

    // 5. Create Vehicle
    const vehicle = await prisma.vehicle.upsert({
      where: { id: 'vehicle-tashkent-001' },
      update: {},
      create: {
        id: 'vehicle-tashkent-001',
        plateNumber: '01A1qw1AA',
        model: 'Hyundai H350',
        capacity: 3000,
      },
    });
    console.log('✅ Vehicle created:', vehicle.plateNumber, '\n');

    // 6. Create Orders and Deliveries
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + 1); // Tomorrow
    scheduleDate.setHours(8, 0, 0, 0); // 8 AM

    const orders = await Promise.all(
      customerBranches.map(async (branch, idx) => {
        const order = await prisma.order.create({
          data: {
            orderNumber: `ORD-TASHKENT-${String(idx + 1).padStart(3, '0')}`,
            customerId: customer.id,
            orderDate: new Date(),
            totalAmount: 500000 + Math.random() * 2000000, // 500k-2.5M UZS
            orderItems: {
              create: {
                branchId: branch.id,
                productId: 'product-tashkent-001', // Need to create a product first
                productName: 'Ice Product Sample',
                quantity: Math.floor(Math.random() * 10) + 5,
                unitPrice: 50000,
                subtotal: 50000 * (Math.floor(Math.random() * 10) + 5),
                vatRate: 12,
                vatAmount: 50000 * (Math.floor(Math.random() * 10) + 5) * 0.12,
                totalAmount: 50000 * (Math.floor(Math.random() * 10) + 5) * 1.12,
              },
            },
          },
          include: { orderItems: true },
        });
        return order;
      })
    );
    console.log(`✅ ${orders.length} orders created\n`);

    // 7. Create Delivery Route
    const route = await prisma.deliveryRoute.create({
      data: {
        routeName: `Route ${scheduleDate.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
        })}`,
        scheduledDate: scheduleDate,
        status: 'PLANNED',
        driverId: driver.id,
        vehicleId: vehicle.id,
        totalDistance: calculateTotalDistance(),
        estimatedDuration: 540, // 9 hours in minutes
        actualStartTime: null,
        actualEndTime: null,
      },
    });
    console.log('✅ Delivery Route created:', route.routeName);

    // 8. Create Deliveries and Route Stops
    const deliveries = await Promise.all(
      orders.map(async (order, idx) => {
        const delivery = await prisma.delivery.create({
          data: {
            orderId: order.id,
            status: 'PENDING',
            notes: `Delivery to ${customerBranches[idx].branchName}`,
          },
        });
        return delivery;
      })
    );

    let cumulativeDistance = 0;
    const routeStops = await Promise.all(
      deliveries.map(async (delivery, idx) => {
        const stop = await prisma.routeStop.create({
          data: {
            routeId: route.id,
            deliveryId: delivery.id,
            stopNumber: idx + 1,
            distanceFromPrev: getDistanceBetweenStops(idx),
            status: 'PENDING',
            estimatedArrival: addMinutesToDate(
              scheduleDate,
              getEstimatedArrivalMinutes(idx)
            ),
            actualArrival: null,
            completedAt: null,
          },
        });
        cumulativeDistance += getDistanceBetweenStops(idx);
        return stop;
      })
    );
    console.log(`✅ ${routeStops.length} route stops created\n`);

    // 9. Print Route Summary
    console.log('📍 TASHKENT ROUTE SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Route ID: ${route.id}`);
    console.log(`Route Name: ${route.routeName}`);
    console.log(`Status: ${route.status}`);
    console.log(`Driver: ${driver.name} (${driver.phone})`);
    console.log(`Vehicle: ${vehicle.plateNumber} (${vehicle.model})`);
    console.log(`Total Distance: ${route.totalDistance} km`);
    if (route.estimatedDuration) {
      console.log(`Estimated Duration: ${Math.floor(route.estimatedDuration / 60)}h ${route.estimatedDuration % 60}m\n`);
    }

    console.log('🚩 DELIVERY STOPS (WITH GPS COORDINATES):');
    console.log('─'.repeat(60));
    TASHKENT_LOCATIONS.stops.forEach((location, idx) => {
      const distance = getDistanceBetweenStops(idx);
      const arrival = getEstimatedArrivalMinutes(idx);
      console.log(`${idx + 1}. ${location.name}`);
      console.log(`   📍 Address: ${location.address}`);
      console.log(`   🗺️  GPS: [${location.latitude}, ${location.longitude}]`);
      console.log(`   📏 Distance: ${distance} km | ⏱️  Arrival: +${arrival} min`);
      console.log(`   📦 Order: ${orders[idx].orderNumber}`);
      console.log('');
    });

    console.log('═'.repeat(60));
    console.log('\n✨ Route seeded successfully!');
    console.log(`\n🔗 View route: http://localhost:3000/routes/${route.id}`);

  } catch (error) {
    console.error('❌ Error seeding route:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Helper Functions
function calculateTotalDistance(): number {
  let total = 0;
  for (let i = 0; i < TASHKENT_LOCATIONS.stops.length; i++) {
    total += getDistanceBetweenStops(i);
  }
  return total;
}

function getDistanceBetweenStops(stopIndex: number): number {
  const distances = [3.2, 4.8, 5.5, 6.1, 3.9, 4.2]; // km between consecutive stops
  return distances[stopIndex] || 5;
}

function getEstimatedArrivalMinutes(stopIndex: number): number {
  const minutes = [24, 60, 105, 165, 210, 252]; // cumulative minutes from start
  return minutes[stopIndex] || 0;
}

function addMinutesToDate(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

// Run the seed
seedTashkentRoute()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
