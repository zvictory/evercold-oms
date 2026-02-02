/**
 * Route Optimization Utility
 * Implements route optimization algorithms for delivery route planning
 */

interface Location {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate total route distance
 */
export function calculateTotalDistance(
  locations: Location[],
  route: string[]
): number {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const from = locations.find((l) => l.id === route[i]);
    const to = locations.find((l) => l.id === route[i + 1]);
    if (from && to) {
      total += calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude);
    }
  }
  return total;
}

/**
 * Optimize route using Nearest Neighbor algorithm
 * This is a fast heuristic algorithm that works well for delivery routing
 * Starting from depot, always visit the nearest unvisited location
 */
export function optimizeRouteNearestNeighbor(
  locations: Location[],
  depotId: string = '1'
): string[] {
  const unvisited = new Set(locations.map((l) => l.id));
  const route: string[] = [depotId];
  unvisited.delete(depotId);

  let currentId = depotId;
  const current = locations.find((l) => l.id === currentId)!;

  while (unvisited.size > 0) {
    let nearestId = '';
    let nearestDistance = Infinity;

    for (const id of unvisited) {
      const location = locations.find((l) => l.id === id)!;
      const distance = calculateDistance(
        current.latitude,
        current.longitude,
        location.latitude,
        location.longitude
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestId = id;
      }
    }

    route.push(nearestId);
    unvisited.delete(nearestId);
    const currentLocation = locations.find((l) => l.id === nearestId)!;
    current.latitude = currentLocation.latitude;
    current.longitude = currentLocation.longitude;
  }

  // Return to depot
  route.push(depotId);

  return route;
}

/**
 * Optimize route using 2-opt algorithm
 * Improves upon nearest neighbor by swapping route segments
 * This provides better optimization at the cost of more computation
 */
export function optimizeRoute2Opt(
  locations: Location[],
  initialRoute?: string[]
): string[] {
  let route =
    initialRoute ||
    optimizeRouteNearestNeighbor(locations, locations[0]?.id || '1');
  let improved = true;

  while (improved) {
    improved = false;

    for (let i = 1; i < route.length - 2; i++) {
      for (let k = i + 1; k < route.length - 1; k++) {
        const currentDistance =
          calculateDistance(
            locations.find((l) => l.id === route[i - 1])!.latitude,
            locations.find((l) => l.id === route[i - 1])!.longitude,
            locations.find((l) => l.id === route[i])!.latitude,
            locations.find((l) => l.id === route[i])!.longitude
          ) +
          calculateDistance(
            locations.find((l) => l.id === route[k])!.latitude,
            locations.find((l) => l.id === route[k])!.longitude,
            locations.find((l) => l.id === route[k + 1])!.latitude,
            locations.find((l) => l.id === route[k + 1])!.longitude
          );

        const newDistance =
          calculateDistance(
            locations.find((l) => l.id === route[i - 1])!.latitude,
            locations.find((l) => l.id === route[i - 1])!.longitude,
            locations.find((l) => l.id === route[k])!.latitude,
            locations.find((l) => l.id === route[k])!.longitude
          ) +
          calculateDistance(
            locations.find((l) => l.id === route[i])!.latitude,
            locations.find((l) => l.id === route[i])!.longitude,
            locations.find((l) => l.id === route[k + 1])!.latitude,
            locations.find((l) => l.id === route[k + 1])!.longitude
          );

        if (newDistance < currentDistance) {
          // Reverse the segment between i and k
          route = [
            ...route.slice(0, i),
            ...route.slice(i, k + 1).reverse(),
            ...route.slice(k + 1),
          ];
          improved = true;
        }
      }
    }
  }

  return route;
}

/**
 * Get optimized route with statistics
 */
export function getOptimizedRoute(locations: Location[], depotId: string = '1') {
  const optimized = optimizeRoute2Opt(locations, undefined);
  const originalRoute = locations.map((l) => l.id);
  originalRoute.push(locations[0].id); // Return to depot

  const originalDistance = calculateTotalDistance(locations, originalRoute);
  const optimizedDistance = calculateTotalDistance(locations, optimized);
  const savings = ((originalDistance - optimizedDistance) / originalDistance) * 100;

  return {
    route: optimized,
    distance: optimizedDistance,
    originalDistance,
    savings,
    stops: optimized.length - 1, // Exclude return to depot
  };
}
