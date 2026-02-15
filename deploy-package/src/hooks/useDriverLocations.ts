'use client'

import { useQuery } from '@tanstack/react-query'
import type { DriverLocation, DriverLocationsResponse } from '@/types/driver'

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

export function useDriverLocations(pollingInterval = 15000) {
  const { data, isLoading, error, refetch } = useQuery<DriverLocationsResponse>({
    queryKey: ['driverLocations'],
    queryFn: async () => {
      const res = await fetch('/api/drivers/locations')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch')
      }
      return res.json()
    },
    refetchInterval: pollingInterval,
    staleTime: 0,
    retry: 3,
  })

  // Calculate offline status
  const locations: DriverLocation[] =
    data?.locations.map((loc) => ({
      ...loc,
      isOffline: Date.now() - new Date(loc.lastUpdate).getTime() > OFFLINE_THRESHOLD_MS,
    })) || []

  return {
    locations,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
