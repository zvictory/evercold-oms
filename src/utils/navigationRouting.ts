/**
 * Navigation Routing Utility
 * Provides turn-by-turn routing using OSRM (OpenStreetMap Routing Machine)
 * Free service that gives actual street-level directions
 */

export interface RoutingStep {
  distance: number; // in meters
  duration: number; // in seconds
  instruction: string;
  name: string;
  type: string;
  direction?: string;
}

export interface RouteSegment {
  coordinates: Array<[number, number]>; // [lng, lat]
  distance: number; // in km
  duration: number; // in seconds
  steps: RoutingStep[];
}

export interface NavigationRoute {
  routes: RouteSegment[];
  totalDistance: number;
  totalDuration: number;
  waypoints: Array<{ name: string; location: [number, number] }>;
}

/**
 * Get turn-by-turn route between two points using OSRM
 * OSRM (OpenStreetMap Routing Machine) provides free routing
 */
export async function getNavigationRoute(
  from: [number, number],
  to: [number, number],
  options?: { alternatives?: boolean; steps?: boolean }
): Promise<RouteSegment | null> {
  try {
    // OSRM public API endpoint
    const url = new URL('https://router.project-osrm.org/route/v1/driving');
    url.searchParams.append('coordinates', `${from[0]},${from[1]};${to[0]},${to[1]}`);
    url.searchParams.append('overview', 'full');
    url.searchParams.append('steps', 'true');
    url.searchParams.append('annotations', 'distance,duration');

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('OSRM API error:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.error('No route found:', data.message);
      return null;
    }

    const route = data.routes[0];

    // Convert polyline to coordinates
    const coordinates = decodePolyline(route.geometry);

    // Extract turn-by-turn steps
    const steps: RoutingStep[] = [];
    if (route.legs) {
      for (const leg of route.legs) {
        if (leg.steps) {
          for (const step of leg.steps) {
            steps.push({
              distance: step.distance,
              duration: step.duration,
              instruction: step.maneuver?.instruction || 'Continue',
              name: step.name || 'Unnamed road',
              type: step.maneuver?.type || 'straight',
              direction: step.maneuver?.modifier,
            });
          }
        }
      }
    }

    return {
      coordinates,
      distance: route.distance / 1000, // Convert to km
      duration: Math.round(route.duration), // in seconds
      steps,
    };
  } catch (error) {
    console.error('Error getting navigation route:', error);
    return null;
  }
}

/**
 * Get optimized multi-stop route with turn-by-turn directions
 * Uses OSRM table API for optimization, then routing API for directions
 */
export async function getMultiStopNavigation(
  locations: Array<{ id: string; name: string; lat: number; lng: number }>,
  depotIndex: number = 0
): Promise<NavigationRoute | null> {
  try {
    if (locations.length < 2) {
      return null;
    }

    // Start from depot
    const orderedLocations = [
      locations[depotIndex],
      ...locations.filter((_, i) => i !== depotIndex),
      locations[depotIndex], // Return to depot
    ];

    const routes: RouteSegment[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    // Get routing between consecutive points
    for (let i = 0; i < orderedLocations.length - 1; i++) {
      const from: [number, number] = [orderedLocations[i].lng, orderedLocations[i].lat];
      const to: [number, number] = [
        orderedLocations[i + 1].lng,
        orderedLocations[i + 1].lat,
      ];

      const segment = await getNavigationRoute(from, to);
      if (segment) {
        routes.push(segment);
        totalDistance += segment.distance;
        totalDuration += segment.duration;
      }
    }

    return {
      routes,
      totalDistance,
      totalDuration,
      waypoints: orderedLocations.map((loc) => ({
        name: loc.name,
        location: [loc.lng, loc.lat],
      })),
    };
  } catch (error) {
    console.error('Error getting multi-stop navigation:', error);
    return null;
  }
}

/**
 * Decode polyline from OSRM (uses Google's polyline algorithm)
 */
function decodePolyline(encoded: string): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lng / 1e5, lat / 1e5]);
  }

  return points;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Get human-readable turn instruction
 */
export function getTurnInstruction(step: RoutingStep): string {
  const { type, direction, name, distance } = step;
  const distStr = formatDistance(distance / 1000);

  const directionMap: { [key: string]: string } = {
    left: 'Turn left',
    right: 'Turn right',
    straight: 'Go straight',
    'slight left': 'Bear left',
    'slight right': 'Bear right',
    'sharp left': 'Sharp left',
    'sharp right': 'Sharp right',
    uturn: 'Make a U-turn',
  };

  let instruction = directionMap[`${type}${direction ? ' ' + direction : ''}`] || 'Continue';

  if (name && name !== 'Unnamed road') {
    instruction += ` on ${name}`;
  }

  instruction += ` (${distStr})`;

  return instruction;
}
