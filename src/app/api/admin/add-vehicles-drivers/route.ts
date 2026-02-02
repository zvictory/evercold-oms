import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    let addedDrivers = 0;
    let addedVehicles = 0;
    const errors: string[] = [];

    // Add drivers
    const driversData = [
      { name: 'NASRITDINOV ZUXRITDIN ERKINOVICH', phone: '+998901234567', licenseNumber: 'DRV001' },
      { name: 'Ummat', phone: '+998901234568', licenseNumber: 'DRV002' },
      { name: 'Viktor', phone: '+998901234569', licenseNumber: 'DRV003' },
      { name: 'Azamat', phone: '+998901234570', licenseNumber: 'DRV004' },
      { name: 'Elomon', phone: '+998901234571', licenseNumber: 'DRV005' },
    ];

    for (const driverData of driversData) {
      try {
        await prisma.driver.create({
          data: {
            name: driverData.name,
            phone: driverData.phone,
            licenseNumber: driverData.licenseNumber,
            status: 'ACTIVE',
          },
        });
        addedDrivers++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          errors.push(`Водитель ${driverData.name} уже существует`);
        } else {
          errors.push(`Ошибка добавления ${driverData.name}: ${error.message}`);
        }
      }
    }

    // Add vehicles
    const vehiclesData = [
      { plateNumber: '01 522 OLA', model: 'DAMAS-2', type: 'VAN' as const },
      { plateNumber: '01 R 153 BB', model: 'DAMAS-2', type: 'VAN' as const },
      { plateNumber: '01 732 BGA', model: 'KIA BONGO', type: 'TRUCK' as const },
      { plateNumber: '01 298 QMA', model: 'DAMAS-2', type: 'VAN' as const },
      { plateNumber: '01 924 NLA', model: 'DAMAS-2', type: 'VAN' as const },
      { plateNumber: '01 612 RJA', model: 'DAMAS-2', type: 'VAN' as const },
      { plateNumber: '01 685 ZMA', model: 'DAMAS-2', type: 'VAN' as const },
    ];

    for (const vehicleData of vehiclesData) {
      try {
        await prisma.vehicle.create({
          data: {
            plateNumber: vehicleData.plateNumber,
            model: vehicleData.model,
            type: vehicleData.type,
            status: 'AVAILABLE',
          },
        });
        addedVehicles++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          errors.push(`Транспорт ${vehicleData.plateNumber} уже существует`);
        } else {
          errors.push(`Ошибка добавления ${vehicleData.plateNumber}: ${error.message}`);
        }
      }
    }

    const message = `Водителей добавлено: ${addedDrivers}\nТранспорта добавлено: ${addedVehicles}\n\n${errors.length > 0 ? 'Предупреждения:\n' + errors.join('\n') : ''}`;

    return NextResponse.json({
      success: true,
      addedDrivers,
      addedVehicles,
      errors,
      message,
    });
  } catch (error: any) {
    console.error('Error adding vehicles and drivers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
