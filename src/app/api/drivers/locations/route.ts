import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireManagerOrAdmin, handleAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Only ADMIN/MANAGER can view GPS tracking
    const user = await requireManagerOrAdmin(request)

    const drivers = await prisma.driver.findMany({
      where: {
        status: 'ACTIVE',
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        locationStatus: true,
        lastLocationUpdate: true,
      },
      orderBy: { lastLocationUpdate: 'desc' },
    })

    const locations = drivers.map((d) => ({
      driverId: d.id,
      driverName: d.name,
      lat: d.latitude!,
      lng: d.longitude!,
      status: d.locationStatus,
      lastUpdate: d.lastLocationUpdate || new Date(),
    }))

    return NextResponse.json({ locations, timestamp: new Date() })
  } catch (error: any) {
    console.error('Failed to fetch driver locations:', error)
    return handleAuthError(error)
  }
}
