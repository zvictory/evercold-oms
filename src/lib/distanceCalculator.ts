import { distance as turfDistance, bearing } from '@turf/turf';
import haversine from 'haversine';

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Service for calculating distances and routes between geographic coordinates
 * Uses Haversine formula for accurate distance calculations
 */
export class DistanceCalculator {
  /**
   * Calculate distance between two points using Haversine formula
   * @param from Starting coordinates
   * @param to Ending coordinates
   * @param unit 'km' | 'mi' | 'm'
   * @returns Distance in specified unit
   */
  static getDistance(
    from: Coordinates,
    to: Coordinates,
    unit: 'km' | 'mi' | 'm' = 'km'
  ): number {
    // Map custom units to haversine library units
    const haversineUnit = unit === 'mi' ? 'mile' : unit === 'm' ? 'meter' : 'km';
    return haversine(from, to, { unit: haversineUnit as any });
  }

  /**
   * Calculate bearing (direction) from one point to another
   * @param from Starting coordinates
   * @param to Ending coordinates
   * @returns Bearing in degrees (0-360, where 0 is North)
   */
  static getBearing(from: Coordinates, to: Coordinates): number {
    const fromPoint: [number, number] = [from.longitude, from.latitude];
    const toPoint: [number, number] = [to.longitude, to.latitude];
    return bearing(fromPoint, toPoint);
  }

  /**
   * Calculate total distance for a route with multiple stops
   * @param stops Array of coordinates representing stops in order
   * @returns Total distance in kilometers
   */
  static getRouteDistance(stops: Coordinates[]): number {
    if (stops.length < 2) return 0;

    let total = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      total += this.getDistance(stops[i], stops[i + 1]);
    }
    return total;
  }

  /**
   * Estimate travel time based on distance
   * Assumes average speed of 40 km/h in city traffic
   * @param distanceKm Distance in kilometers
   * @returns Estimated time in minutes
   */
  static estimateTravelTime(distanceKm: number): number {
    const avgSpeedKmh = 40; // Average city driving speed
    return (distanceKm / avgSpeedKmh) * 60; // Convert to minutes
  }

  /**
   * Calculate ETA (Estimated Time of Arrival) for a route
   * @param stops Array of coordinates
   * @param startTime Starting time (Date object)
   * @param stopDuration Average time spent at each stop in minutes (default: 10)
   * @returns Array of ETAs for each stop
   */
  static calculateETAs(
    stops: Coordinates[],
    startTime: Date,
    stopDuration: number = 10
  ): Date[] {
    const etas: Date[] = [startTime];
    let currentTime = new Date(startTime);

    for (let i = 0; i < stops.length - 1; i++) {
      const distance = this.getDistance(stops[i], stops[i + 1]);
      const travelTime = this.estimateTravelTime(distance);

      // Add travel time + stop duration
      currentTime = new Date(
        currentTime.getTime() + (travelTime + stopDuration) * 60000
      );

      etas.push(new Date(currentTime));
    }

    return etas;
  }

  /**
   * Find the nearest location from a given point
   * @param from Starting point
   * @param locations Array of locations to check
   * @returns Index of nearest location and distance to it
   */
  static findNearest(
    from: Coordinates,
    locations: Coordinates[]
  ): { index: number; distance: number } | null {
    if (locations.length === 0) return null;

    let nearestIndex = 0;
    let shortestDistance = this.getDistance(from, locations[0]);

    for (let i = 1; i < locations.length; i++) {
      const distance = this.getDistance(from, locations[i]);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestIndex = i;
      }
    }

    return { index: nearestIndex, distance: shortestDistance };
  }

  /**
   * Check if a point is within a certain radius of another point
   * @param center Center point
   * @param point Point to check
   * @param radiusKm Radius in kilometers
   * @returns True if point is within radius
   */
  static isWithinRadius(
    center: Coordinates,
    point: Coordinates,
    radiusKm: number
  ): boolean {
    const distance = this.getDistance(center, point);
    return distance <= radiusKm;
  }

  /**
   * Format distance for display
   * @param km Distance in kilometers
   * @returns Formatted string (e.g., "12.5 km" or "850 m")
   */
  static formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  }

  /**
   * Format duration for display
   * @param minutes Duration in minutes
   * @returns Formatted string (e.g., "1h 30m" or "45 min")
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}
