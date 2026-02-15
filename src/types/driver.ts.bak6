export type DriverLocationStatus = 'IDLE' | 'MOVING' | 'STOPPED'

export interface DriverLocation {
  driverId: string
  driverName: string
  lat: number
  lng: number
  status: DriverLocationStatus
  lastUpdate: Date
  isOffline?: boolean // Calculated: lastUpdate > 5 min
}

export interface DriverLocationsResponse {
  locations: DriverLocation[]
  timestamp: Date
}
