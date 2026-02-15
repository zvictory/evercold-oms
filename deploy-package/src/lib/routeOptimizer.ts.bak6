import { DistanceCalculator } from './distanceCalculator';
import { yandexRoutingService } from './yandexRoutingService';
import { MatrixResponse } from '@/types/yandex';

export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  priority?: number; // Higher priority = visit earlier (1-10)
}

export interface RouteLeg {
  from: string;
  to: string;
  distance: number; // in km
  duration: number; // in minutes
  durationInTraffic?: number; // in minutes (with traffic)
}

export interface OptimizedRoute {
  sequence: string[]; // IDs in optimal order
  totalDistance: number; // km
  estimatedTime: number; // minutes
  estimatedTimeWithTraffic?: number; // minutes (with traffic)
  trafficLevel?: 'low' | 'medium' | 'high' | 'blocked';
  legs: RouteLeg[];
  optimizationMethod: 'haversine' | 'yandex';
}

/**
 * Service for optimizing delivery routes using TSP algorithms
 * Implements Nearest Neighbor and 2-opt improvement heuristics
 */
export class RouteOptimizer {
  /**
   * Optimize delivery route using Nearest Neighbor algorithm
   * @param depot Starting location (warehouse)
   * @param locations Delivery locations to visit
   * @param returnToDepot Whether to return to depot at end (default: true)
   * @returns Optimized route
   */
  static optimizeRoute(
    depot: Location,
    locations: Location[],
    returnToDepot: boolean = true
  ): OptimizedRoute {
    if (locations.length === 0) {
      return {
        sequence: [depot.id],
        totalDistance: 0,
        estimatedTime: 0,
        legs: [],
        optimizationMethod: 'haversine',
      };
    }

    // Sort locations by priority (higher priority first)
    const sortedLocations = [...locations].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );

    const unvisited = [...sortedLocations];
    const visited: Location[] = [depot];
    const legs: RouteLeg[] = [];
    let totalDistance = 0;

    let current = depot;

    // Nearest neighbor algorithm
    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let shortestDistance = Infinity;

      // Find nearest unvisited location
      for (let i = 0; i < unvisited.length; i++) {
        const distance = DistanceCalculator.getDistance(
          { latitude: current.latitude, longitude: current.longitude },
          { latitude: unvisited[i].latitude, longitude: unvisited[i].longitude }
        );

        // Apply priority weighting (reduce effective distance for high priority)
        const weightedDistance =
          distance / (1 + ((unvisited[i].priority || 0) / 10));

        if (weightedDistance < shortestDistance) {
          shortestDistance = distance; // Use actual distance for calculation
          nearestIdx = i;
        }
      }

      const nearest = unvisited[nearestIdx];
      const distance = DistanceCalculator.getDistance(
        { latitude: current.latitude, longitude: current.longitude },
        { latitude: nearest.latitude, longitude: nearest.longitude }
      );

      legs.push({
        from: current.id,
        to: nearest.id,
        distance,
        duration: DistanceCalculator.estimateTravelTime(distance),
      });

      totalDistance += distance;
      visited.push(nearest);
      current = nearest;
      unvisited.splice(nearestIdx, 1);
    }

    // Return to depot if required
    if (returnToDepot) {
      const returnDistance = DistanceCalculator.getDistance(
        { latitude: current.latitude, longitude: current.longitude },
        { latitude: depot.latitude, longitude: depot.longitude }
      );

      legs.push({
        from: current.id,
        to: depot.id,
        distance: returnDistance,
        duration: DistanceCalculator.estimateTravelTime(returnDistance),
      });

      totalDistance += returnDistance;
      visited.push(depot);
    }

    return {
      sequence: visited.map((loc) => loc.id),
      totalDistance,
      estimatedTime: DistanceCalculator.estimateTravelTime(totalDistance),
      legs,
      optimizationMethod: 'haversine',
    };
  }

  /**
   * Improve route using 2-opt optimization
   * Tries swapping edge pairs to reduce total distance
   * @param locations Route in current order (including depot)
   * @param maxIterations Maximum optimization iterations (default: 100)
   * @returns Improved route
   */
  static twoOptImprovement(
    locations: Location[],
    maxIterations: number = 100
  ): Location[] {
    if (locations.length < 4) return locations; // Need at least 4 points for 2-opt

    let bestRoute = [...locations];
    let bestDistance = this.calculateRouteDistance(bestRoute);
    let improved = true;
    let iteration = 0;

    while (improved && iteration < maxIterations) {
      improved = false;
      iteration++;

      for (let i = 1; i < bestRoute.length - 2; i++) {
        for (let j = i + 1; j < bestRoute.length - 1; j++) {
          // Calculate current distance of the two edges
          const currentDist =
            DistanceCalculator.getDistance(
              {
                latitude: bestRoute[i].latitude,
                longitude: bestRoute[i].longitude,
              },
              {
                latitude: bestRoute[i + 1].latitude,
                longitude: bestRoute[i + 1].longitude,
              }
            ) +
            DistanceCalculator.getDistance(
              {
                latitude: bestRoute[j].latitude,
                longitude: bestRoute[j].longitude,
              },
              {
                latitude: bestRoute[j + 1].latitude,
                longitude: bestRoute[j + 1].longitude,
              }
            );

          // Calculate new distance if we swap
          const newDist =
            DistanceCalculator.getDistance(
              {
                latitude: bestRoute[i].latitude,
                longitude: bestRoute[i].longitude,
              },
              {
                latitude: bestRoute[j].latitude,
                longitude: bestRoute[j].longitude,
              }
            ) +
            DistanceCalculator.getDistance(
              {
                latitude: bestRoute[i + 1].latitude,
                longitude: bestRoute[i + 1].longitude,
              },
              {
                latitude: bestRoute[j + 1].latitude,
                longitude: bestRoute[j + 1].longitude,
              }
            );

          // If new route is better, apply the swap
          if (newDist < currentDist) {
            // Reverse segment between i+1 and j
            bestRoute = [
              ...bestRoute.slice(0, i + 1),
              ...bestRoute.slice(i + 1, j + 1).reverse(),
              ...bestRoute.slice(j + 1),
            ];

            const newRouteDistance = this.calculateRouteDistance(bestRoute);
            if (newRouteDistance < bestDistance) {
              bestDistance = newRouteDistance;
              improved = true;
            }
          }
        }
      }
    }

    return bestRoute;
  }

  /**
   * Optimize route using combined approach: Nearest Neighbor + 2-opt
   * @param depot Starting location
   * @param locations Delivery locations
   * @param returnToDepot Whether to return to depot
   * @returns Best optimized route
   */
  static optimizeRouteBest(
    depot: Location,
    locations: Location[],
    returnToDepot: boolean = true
  ): OptimizedRoute {
    // Step 1: Get initial route using nearest neighbor
    const initialRoute = this.optimizeRoute(depot, locations, returnToDepot);

    // Step 2: Build location array from sequence
    const allLocations = [depot, ...locations];
    if (returnToDepot) allLocations.push(depot);

    const orderedLocations = initialRoute.sequence
      .map((id) => allLocations.find((loc) => loc.id === id))
      .filter((loc): loc is Location => loc !== undefined);

    // Step 3: Apply 2-opt improvement
    const improvedLocations = this.twoOptImprovement(orderedLocations);

    // Step 4: Build final optimized route
    const legs: RouteLeg[] = [];
    let totalDistance = 0;

    for (let i = 0; i < improvedLocations.length - 1; i++) {
      const distance = DistanceCalculator.getDistance(
        {
          latitude: improvedLocations[i].latitude,
          longitude: improvedLocations[i].longitude,
        },
        {
          latitude: improvedLocations[i + 1].latitude,
          longitude: improvedLocations[i + 1].longitude,
        }
      );

      legs.push({
        from: improvedLocations[i].id,
        to: improvedLocations[i + 1].id,
        distance,
        duration: DistanceCalculator.estimateTravelTime(distance),
      });

      totalDistance += distance;
    }

    return {
      sequence: improvedLocations.map((loc) => loc.id),
      totalDistance,
      estimatedTime: DistanceCalculator.estimateTravelTime(totalDistance),
      legs,
      optimizationMethod: 'haversine',
    };
  }

  /**
   * Calculate total distance for a given route
   * @param locations Route locations in order
   * @returns Total distance in km
   */
  private static calculateRouteDistance(locations: Location[]): number {
    let total = 0;
    for (let i = 0; i < locations.length - 1; i++) {
      total += DistanceCalculator.getDistance(
        { latitude: locations[i].latitude, longitude: locations[i].longitude },
        {
          latitude: locations[i + 1].latitude,
          longitude: locations[i + 1].longitude,
        }
      );
    }
    return total;
  }

  /**
   * Optimize route using Yandex Maps with real-time traffic data
   * @param depot Starting location
   * @param locations Delivery locations
   * @param returnToDepot Whether to return to depot
   * @returns Optimized route with traffic-aware times
   */
  static async optimizeRouteWithTraffic(
    depot: Location,
    locations: Location[],
    returnToDepot: boolean = true
  ): Promise<OptimizedRoute> {
    if (locations.length === 0) {
      return {
        sequence: [depot.id],
        totalDistance: 0,
        estimatedTime: 0,
        estimatedTimeWithTraffic: 0,
        legs: [],
        optimizationMethod: 'yandex',
      };
    }

    try {
      // Get initial route using Nearest Neighbor
      const initialRoute = this.optimizeRoute(depot, locations, returnToDepot);

      // Build all locations including depot
      const allLocations = [depot, ...locations];
      const orderedLocations = initialRoute.sequence
        .map((id) => allLocations.find((loc) => loc.id === id))
        .filter((loc): loc is Location => loc !== undefined);

      // Get traffic-aware distances from Yandex Matrix API
      const trafficData = await yandexRoutingService.getMatrix(
        [depot, ...locations],
        [depot, ...locations]
      );

      if (!trafficData) {
        // Fallback to Haversine if Yandex API fails
        return {
          ...initialRoute,
          optimizationMethod: 'haversine',
        };
      }

      // Build legs with traffic data
      const legs: RouteLeg[] = [];
      let totalDistance = 0;
      let totalTimeWithTraffic = 0;

      for (let i = 0; i < orderedLocations.length - 1; i++) {
        const from = orderedLocations[i];
        const to = orderedLocations[i + 1];

        // Find indices in the original locations array
        const fromIdx = allLocations.findIndex((l) => l.id === from.id);
        const toIdx = allLocations.findIndex((l) => l.id === to.id);

        if (fromIdx >= 0 && toIdx >= 0 && trafficData.rows[fromIdx]?.[toIdx]) {
          const matrixElement = trafficData.rows[fromIdx][toIdx];
          const distance = matrixElement.distance / 1000; // Convert to km
          const duration = matrixElement.duration / 60; // Convert to minutes
          const durationWithTraffic = matrixElement.durationInTraffic / 60; // Convert to minutes

          legs.push({
            from: from.id,
            to: to.id,
            distance,
            duration,
            durationInTraffic: durationWithTraffic,
          });

          totalDistance += distance;
          totalTimeWithTraffic += durationWithTraffic;
        } else {
          // Fallback to Haversine if specific pair not in matrix
          const distance = DistanceCalculator.getDistance(
            { latitude: from.latitude, longitude: from.longitude },
            { latitude: to.latitude, longitude: to.longitude }
          );
          const duration = DistanceCalculator.estimateTravelTime(distance);

          legs.push({
            from: from.id,
            to: to.id,
            distance,
            duration,
            durationInTraffic: duration,
          });

          totalDistance += distance;
          totalTimeWithTraffic += duration;
        }
      }

      // Calculate traffic level
      const totalTimeNoTraffic = legs.reduce((sum, leg) => sum + leg.duration, 0);
      const trafficLevel = this.calculateTrafficLevel(totalTimeNoTraffic, totalTimeWithTraffic);

      return {
        sequence: orderedLocations.map((loc) => loc.id),
        totalDistance,
        estimatedTime: totalTimeNoTraffic,
        estimatedTimeWithTraffic: totalTimeWithTraffic,
        trafficLevel,
        legs,
        optimizationMethod: 'yandex',
      };
    } catch (error) {
      console.error('Error optimizing route with traffic:', error);
      // Fallback to Haversine
      return {
        ...this.optimizeRouteBest(depot, locations, returnToDepot),
        optimizationMethod: 'haversine',
      };
    }
  }

  /**
   * Calculate traffic level based on time difference
   */
  private static calculateTrafficLevel(
    baseTime: number,
    withTraffic: number
  ): 'low' | 'medium' | 'high' | 'blocked' {
    const delayPercent = ((withTraffic - baseTime) / baseTime) * 100;

    if (delayPercent < 10) return 'low';
    if (delayPercent < 30) return 'medium';
    if (delayPercent < 50) return 'high';
    return 'blocked';
  }

  /**
   * Cluster locations by geographic proximity
   * Useful for multi-vehicle routing
   * @param locations All delivery locations
   * @param numClusters Number of clusters (vehicles)
   * @returns Array of location clusters
   */
  static clusterByProximity(
    locations: Location[],
    numClusters: number
  ): Location[][] {
    if (locations.length === 0 || numClusters <= 0) return [];
    if (numClusters >= locations.length) {
      return locations.map((loc) => [loc]);
    }

    // Simple k-means clustering
    const clusters: Location[][] = Array.from({ length: numClusters }, () => []);

    // Initialize centroids randomly
    const centroids: { latitude: number; longitude: number }[] = [];
    const shuffled = [...locations].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numClusters; i++) {
      centroids.push({
        latitude: shuffled[i].latitude,
        longitude: shuffled[i].longitude,
      });
    }

    // Iterate to convergence (max 10 iterations)
    for (let iter = 0; iter < 10; iter++) {
      // Clear clusters
      clusters.forEach((cluster) => (cluster.length = 0));

      // Assign each location to nearest centroid
      for (const location of locations) {
        let nearestCluster = 0;
        let minDistance = Infinity;

        for (let i = 0; i < centroids.length; i++) {
          const distance = DistanceCalculator.getDistance(
            { latitude: location.latitude, longitude: location.longitude },
            centroids[i]
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestCluster = i;
          }
        }

        clusters[nearestCluster].push(location);
      }

      // Recalculate centroids
      for (let i = 0; i < numClusters; i++) {
        if (clusters[i].length > 0) {
          const avgLat =
            clusters[i].reduce((sum, loc) => sum + loc.latitude, 0) /
            clusters[i].length;
          const avgLng =
            clusters[i].reduce((sum, loc) => sum + loc.longitude, 0) /
            clusters[i].length;

          centroids[i] = { latitude: avgLat, longitude: avgLng };
        }
      }
    }

    return clusters;
  }

  /**
   * Validate if a route is feasible given constraints
   * @param route Optimized route
   * @param constraints Constraints to check
   * @returns Validation result with issues
   */
  static validateRoute(
    route: OptimizedRoute,
    constraints: {
      maxDistance?: number; // km
      maxDuration?: number; // minutes
      maxStops?: number;
    }
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (constraints.maxDistance && route.totalDistance > constraints.maxDistance) {
      issues.push(
        `Route distance (${route.totalDistance.toFixed(1)} km) exceeds maximum (${constraints.maxDistance} km)`
      );
    }

    if (constraints.maxDuration && route.estimatedTime > constraints.maxDuration) {
      issues.push(
        `Route duration (${route.estimatedTime.toFixed(0)} min) exceeds maximum (${constraints.maxDuration} min)`
      );
    }

    if (constraints.maxStops && route.sequence.length - 1 > constraints.maxStops) {
      issues.push(
        `Number of stops (${route.sequence.length - 1}) exceeds maximum (${constraints.maxStops})`
      );
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
