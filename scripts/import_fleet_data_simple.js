const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://zafar@localhost:5432/evercold_crm',
});

async function importFleetData() {
  const client = await pool.connect();

  try {
    console.log('Starting fleet data import...\n');

    // Drivers data
    const drivers = [
      ['cmjyptrtb0000cappjj4ymx7a', 'NASRITDINOV ZUXRITDIN ERKINOVICH', '+998901234567', 'DRV001', 'ACTIVE'],
      ['cmjyptru60001capp9nl7hzch', 'Ummat', '+998901234568', 'DRV002', 'ACTIVE'],
      ['cmjyptru90002cappn7p5rxvq', 'Viktor', '+998901234569', 'DRV003', 'ACTIVE'],
      ['cmjyptrua0003cappx1rgh16e', 'Azamat', '+998901234570', 'DRV004', 'ACTIVE'],
      ['cmjyptrud0004cappndiq1psb', 'Elomon', '+998901234571', 'DRV005', 'ACTIVE'],
    ];

    for (const [id, name, phone, licenseNumber, status] of drivers) {
      try {
        const result = await client.query(
          'INSERT INTO "Driver" (id, name, phone, "licenseNumber", status, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) ON CONFLICT(id) DO NOTHING RETURNING id',
          [id, name, phone, licenseNumber, status]
        );
        if (result.rows.length > 0) {
          console.log(`✓ Imported driver: ${name}`);
        } else {
          console.log(`⊘ Driver already exists: ${name}`);
        }
      } catch (error) {
        console.error(`✗ Error importing driver ${name}:`, error.message);
      }
    }

    console.log('\n');

    // Vehicles data
    const vehicles = [
      ['cmjyptrug0005cappsit0r67i', '01 522 OLA', 'DAMAS-2', 'VAN'],
      ['cmjyptruk0006capphyejh4lk', '01 R 153 BB', 'DAMAS-2', 'VAN'],
      ['cmjyptrum0007cappsf7gy5bs', '01 732 BGA', 'KIA BONGO', 'TRUCK'],
      ['cmjyptrup0008cappjaxgjz1d', '01 298 QMA', 'DAMAS-2', 'VAN'],
      ['cmjyptrur0009capp3tll43pw', '01 924 NLA', 'DAMAS-2', 'VAN'],
      ['cmjyptrut000acappqp9ewa4g', '01 612 RJA', 'DAMAS-2', 'VAN'],
      ['cmjyptruv000bcappziiejo82', '01 685 ZMA', 'DAMAS-2', 'VAN'],
    ];

    for (const [id, plateNumber, model, type] of vehicles) {
      try {
        const result = await client.query(
          'INSERT INTO "Vehicle" (id, "plateNumber", model, type, status, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) ON CONFLICT(id) DO NOTHING RETURNING id',
          [id, plateNumber, model, type, 'AVAILABLE']
        );
        if (result.rows.length > 0) {
          console.log(`✓ Imported vehicle: ${plateNumber} (${model})`);
        } else {
          console.log(`⊘ Vehicle already exists: ${plateNumber}`);
        }
      } catch (error) {
        console.error(`✗ Error importing vehicle ${plateNumber}:`, error.message);
      }
    }

    console.log('\n✓ Fleet data import completed!');
    console.log(`Total drivers: ${drivers.length}`);
    console.log(`Total vehicles: ${vehicles.length}`);

  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    await client.release();
    await pool.end();
  }
}

importFleetData();
