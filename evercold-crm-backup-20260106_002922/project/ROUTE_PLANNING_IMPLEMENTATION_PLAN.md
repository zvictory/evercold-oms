# Delivery Route Planning Implementation Plan

## Overview
Build an intelligent delivery route planning and optimization system for EverCold CRM to efficiently manage multi-stop deliveries across Tashkent and Uzbekistan.

## Current State Analysis
- ✅ Customer branches have latitude/longitude coordinates (Float fields)
- ✅ All Korzinka branches have accurate coordinates in database
- ✅ Basic delivery assignment workflow exists (Driver + Vehicle + Delivery models)
- ❌ No geospatial libraries installed
- ❌ No distance calculations
- ❌ No route optimization
- ❌ No embedded maps

## Goals
1. Enable dispatchers to create optimized multi-stop delivery routes
2. Calculate accurate distances and ETAs for deliveries
3. Visualize routes on interactive maps
4. Provide drivers with turn-by-turn navigation
5. Track delivery progress in real-time

---

## Phase 1: Foundation Setup (Day 1)

### Task 1.1: Install Geospatial Libraries
**What:** Add all required mapping and routing dependencies
**Why:** Need tools for distance calculations, maps, and routing
**How:**
```bash
npm install @turf/turf haversine maplibre-gl react-map-gl node-geocoder
npm install --save-dev @types/node-geocoder
```

**Libraries chosen:**
- `@turf/turf` - Geospatial calculations (distance, bearing, etc.)
- `haversine` - Lightweight distance formula
- `maplibre-gl` - Free interactive maps (no API key needed)
- `react-map-gl` - React wrapper for MapLibre
- `node-geocoder` - Address-to-coordinates conversion

**Acceptance Criteria:**
- All packages installed successfully
- TypeScript types available
- No dependency conflicts with Next.js 15

---

### Task 1.2: Create Distance Calculation Service
**What:** Build utility service for calculating distances between coordinates
**Why:** Core functionality needed for route optimization and ETA calculations
**File:** `/src/lib/distanceCalculator.ts`

**Implementation:**
```typescript
import { distance as turfDistance, bearing } from '@turf/turf';
import haversine from 'haversine';

interface Coordinates {
  latitude: number;
  longitude: number;
}

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
    return haversine(from, to, { unit });
  }

  /**
   * Calculate bearing (direction) from one point to another
   * @returns Bearing in degrees (0-360)
   */
  static getBearing(from: Coordinates, to: Coordinates): number {
    const fromPoint = [from.longitude, from.latitude];
    const toPoint = [to.longitude, to.latitude];
    return bearing(fromPoint, toPoint);
  }

  /**
   * Calculate total distance for a route with multiple stops
   */
  static getRouteDistance(stops: Coordinates[]): number {
    let total = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      total += this.getDistance(stops[i], stops[i + 1]);
    }
    return total;
  }

  /**
   * Estimate travel time based on distance
   * Assumes average speed of 40 km/h in city traffic
   */
  static estimateTravelTime(distanceKm: number): number {
    const avgSpeedKmh = 40;
    return (distanceKm / avgSpeedKmh) * 60; // minutes
  }
}
```

**Tests to Write:**
- Test distance calculation between known points (Tashkent landmarks)
- Test route distance with 3+ stops
- Test ETA calculation
- Edge cases: same location, very far distances

**Acceptance Criteria:**
- Service calculates distance within 1% accuracy
- ETA estimates are reasonable (40 km/h city average)
- All tests pass

---

### Task 1.3: Create Basic Map Component
**What:** Build reusable React map component using MapLibre
**Why:** Foundation for all map visualizations
**File:** `/src/components/Map/DeliveryMap.tsx`

**Implementation:**
```typescript
'use client';

import { useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  markers?: Array<{
    id: string;
    longitude: number;
    latitude: number;
    label: string;
    color?: string;
  }>;
  route?: Array<[number, number]>; // Array of [lng, lat]
}

export default function DeliveryMap({
  center = [69.2401, 41.2995], // Tashkent default
  zoom = 11,
  markers = [],
  route = []
}: MapProps) {
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom
  });

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://demotiles.maplibre.org/style.json"
      >
        {/* Render markers */}
        {markers.map((marker, idx) => (
          <Marker
            key={marker.id}
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="bottom"
          >
            <div className={`
              flex items-center justify-center
              w-8 h-8 rounded-full
              ${marker.color || 'bg-indigo-600'}
              text-white font-bold text-sm
              border-2 border-white shadow-lg
            `}>
              {idx + 1}
            </div>
          </Marker>
        ))}

        {/* Render route line */}
        {route.length > 1 && (
          <Source
            type="geojson"
            data={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: route
              }
            }}
          >
            <Layer
              type="line"
              paint={{
                'line-color': '#4F46E5',
                'line-width': 4,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}
```

**Acceptance Criteria:**
- Map renders centered on Tashkent
- Can display multiple markers with numbers
- Can draw route line between points
- Responsive and works in Next.js 15 app router
- No SSR issues (uses 'use client' directive)

---

## Phase 2: Route Optimization (Day 2)

### Task 2.1: Design Database Schema for Routes
**What:** Add DeliveryRoute and RouteStop models to Prisma
**Why:** Need to persist planned routes and track execution
**File:** `/prisma/schema.prisma`

**Schema Changes:**
```prisma
model DeliveryRoute {
  id                String      @id @default(cuid())
  routeName         String      // "North Zone - Dec 14 Morning"
  driverId          String
  vehicleId         String
  scheduledDate     DateTime
  status            RouteStatus @default(PLANNED)

  // Calculated metrics
  totalDistance     Float?      // in km
  estimatedDuration Int?        // in minutes
  actualStartTime   DateTime?
  actualEndTime     DateTime?

  // Relationships
  driver            Driver      @relation(fields: [driverId], references: [id])
  vehicle           Vehicle     @relation(fields: [vehicleId], references: [id])
  stops             RouteStop[]

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  @@index([driverId])
  @@index([vehicleId])
  @@index([scheduledDate])
}

model RouteStop {
  id                String        @id @default(cuid())
  routeId           String
  deliveryId        String        @unique

  stopNumber        Int           // Optimized sequence (1, 2, 3...)
  distanceFromPrev  Float?        // km from previous stop
  estimatedArrival  DateTime?
  actualArrival     DateTime?
  status            RouteStopStatus @default(PENDING)

  route             DeliveryRoute @relation(fields: [routeId], references: [id], onDelete: Cascade)
  delivery          Delivery      @relation(fields: [deliveryId], references: [id])

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([routeId])
  @@index([deliveryId])
  @@index([stopNumber])
}

enum RouteStatus {
  PLANNED       // Route created but not started
  IN_PROGRESS   // Driver has started the route
  COMPLETED     // All stops delivered
  CANCELLED     // Route cancelled
}

enum RouteStopStatus {
  PENDING       // Not yet reached
  ARRIVED       // Driver arrived at location
  COMPLETED     // Delivery completed at this stop
  SKIPPED       // Stop was skipped
  FAILED        // Delivery failed at this stop
}
```

**Also Update:**
```prisma
model Driver {
  // ... existing fields
  routes            DeliveryRoute[]
}

model Vehicle {
  // ... existing fields
  routes            DeliveryRoute[]
}

model Delivery {
  // ... existing fields
  routeStop         RouteStop?
}
```

**Migration:**
```bash
npx prisma db push
npx prisma generate
```

**Acceptance Criteria:**
- Schema validates without errors
- Relationships work correctly
- Can create route with multiple stops
- Cascade delete works (deleting route removes stops)

---

### Task 2.2: Implement Route Optimization Service
**What:** Build nearest-neighbor TSP solver for route optimization
**Why:** Minimize total delivery distance and time
**File:** `/src/lib/routeOptimizer.ts`

**Implementation:**
```typescript
import { DistanceCalculator } from './distanceCalculator';

interface Location {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface OptimizedRoute {
  sequence: string[];          // IDs in optimal order
  totalDistance: number;       // km
  estimatedTime: number;       // minutes
  legs: Array<{
    from: string;
    to: string;
    distance: number;
  }>;
}

export class RouteOptimizer {
  /**
   * Optimize delivery route using Nearest Neighbor algorithm
   * @param depot Starting location (warehouse)
   * @param locations Delivery locations to visit
   * @returns Optimized route
   */
  static optimizeRoute(
    depot: Location,
    locations: Location[]
  ): OptimizedRoute {
    const unvisited = [...locations];
    const visited: Location[] = [depot];
    const legs: Array<{ from: string; to: string; distance: number }> = [];
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

        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestIdx = i;
        }
      }

      const nearest = unvisited[nearestIdx];

      legs.push({
        from: current.id,
        to: nearest.id,
        distance: shortestDistance
      });

      totalDistance += shortestDistance;
      visited.push(nearest);
      current = nearest;
      unvisited.splice(nearestIdx, 1);
    }

    // Return to depot
    const returnDistance = DistanceCalculator.getDistance(
      { latitude: current.latitude, longitude: current.longitude },
      { latitude: depot.latitude, longitude: depot.longitude }
    );

    legs.push({
      from: current.id,
      to: depot.id,
      distance: returnDistance
    });

    totalDistance += returnDistance;

    return {
      sequence: visited.map(loc => loc.id),
      totalDistance,
      estimatedTime: DistanceCalculator.estimateTravelTime(totalDistance),
      legs
    };
  }

  /**
   * Improve route using 2-opt optimization
   * Tries swapping edge pairs to reduce total distance
   */
  static twoOptImprovement(route: Location[]): Location[] {
    let improved = true;
    let bestRoute = [...route];

    while (improved) {
      improved = false;

      for (let i = 1; i < bestRoute.length - 2; i++) {
        for (let j = i + 1; j < bestRoute.length - 1; j++) {
          const currentDist =
            DistanceCalculator.getDistance(
              bestRoute[i], bestRoute[i+1]
            ) +
            DistanceCalculator.getDistance(
              bestRoute[j], bestRoute[j+1]
            );

          const newDist =
            DistanceCalculator.getDistance(
              bestRoute[i], bestRoute[j]
            ) +
            DistanceCalculator.getDistance(
              bestRoute[i+1], bestRoute[j+1]
            );

          if (newDist < currentDist) {
            // Reverse segment between i+1 and j
            bestRoute = [
              ...bestRoute.slice(0, i + 1),
              ...bestRoute.slice(i + 1, j + 1).reverse(),
              ...bestRoute.slice(j + 1)
            ];
            improved = true;
          }
        }
      }
    }

    return bestRoute;
  }
}
```

**Tests:**
- Test with 5 Tashkent branch locations
- Verify nearest neighbor produces valid route
- Test 2-opt improves distance by 10-30%
- Edge cases: 1 location, 2 locations, same location

**Acceptance Criteria:**
- Algorithm completes in <1 second for 50 stops
- Route distance is within 15% of theoretical optimal
- No duplicate visits
- Always returns to depot

---

### Task 2.3: Create Route API Endpoints
**What:** Build REST API for route creation and management
**Why:** Backend services for route planning dashboard
**Files:**
- `/src/app/api/routes/route.ts`
- `/src/app/api/routes/[id]/route.ts`
- `/src/app/api/routes/optimize/route.ts`

**Implementation:** `/src/app/api/routes/optimize/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RouteOptimizer } from '@/lib/routeOptimizer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deliveryIds, depotBranchId } = body;

    // Get depot location
    const depot = await prisma.customerBranch.findUnique({
      where: { id: depotBranchId }
    });

    if (!depot || !depot.latitude || !depot.longitude) {
      return NextResponse.json(
        { error: 'Depot location not found' },
        { status: 400 }
      );
    }

    // Get all delivery locations
    const deliveries = await prisma.delivery.findMany({
      where: { id: { in: deliveryIds } },
      include: {
        order: {
          include: {
            orderItems: {
              include: { branch: true }
            }
          }
        }
      }
    });

    // Extract unique branch locations
    const locations = deliveries.map(d => {
      const branch = d.order.orderItems[0]?.branch;
      return {
        id: d.id,
        latitude: branch.latitude!,
        longitude: branch.longitude!,
        address: branch.deliveryAddress || branch.branchName
      };
    });

    // Optimize route
    const optimizedRoute = RouteOptimizer.optimizeRoute(
      {
        id: depot.id,
        latitude: depot.latitude,
        longitude: depot.longitude,
        address: depot.branchName
      },
      locations
    );

    return NextResponse.json({
      success: true,
      route: optimizedRoute
    });
  } catch (error: any) {
    console.error('Route optimization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to optimize route' },
      { status: 500 }
    );
  }
}
```

**Other Endpoints:**
- `POST /api/routes` - Create new route
- `GET /api/routes` - List all routes
- `GET /api/routes/[id]` - Get route details
- `PATCH /api/routes/[id]` - Update route status
- `DELETE /api/routes/[id]` - Cancel route

**Acceptance Criteria:**
- All endpoints return proper JSON
- Error handling for missing data
- Route optimization completes in <2 seconds
- Proper TypeScript types

---

## Phase 3: User Interface (Day 3)

### Task 3.1: Build Route Planning Dashboard
**What:** Dispatcher interface for creating optimized routes
**Why:** Allow staff to plan daily delivery routes
**File:** `/src/app/routes/plan/page.tsx`

**Features:**
- Select pending deliveries (checkboxes)
- Choose driver and vehicle
- Set departure time
- Click "Optimize Route" button
- Preview route on map
- See total distance and ETA
- Confirm and save route

**UI Components:**
- Delivery selection table with filters
- Driver/vehicle dropdowns
- Interactive map preview
- Route summary card (distance, time, stops)
- Save/Cancel buttons

**Acceptance Criteria:**
- Can select 5-20 deliveries
- Route appears on map with numbered markers
- Distance and time calculations accurate
- Creates DeliveryRoute and RouteStops in database

---

### Task 3.2: Build Driver Route View
**What:** Mobile-friendly interface showing driver's assigned route
**Why:** Drivers need clear turn-by-turn instructions
**File:** `/src/app/driver/routes/[id]/page.tsx`

**Features:**
- Map showing all stops in sequence
- Current location highlighted
- Next stop emphasized
- List of stops with:
  - Stop number
  - Customer name
  - Address
  - Distance from current location
  - "Navigate" button (opens Google Maps)
  - "Mark Arrived" / "Mark Delivered" buttons

**Mobile Optimizations:**
- Large tap targets
- PWA installable
- Works offline (cached route data)
- GPS location tracking

**Acceptance Criteria:**
- Responsive on mobile devices
- GPS updates every 30 seconds
- Can mark stops as completed
- Updates delivery status in real-time

---

### Task 3.3: Add Distance Display to Orders List
**What:** Show delivery distance for each order
**Why:** Help dispatchers make routing decisions
**File:** `/src/app/orders/page.tsx`

**Changes:**
- Add "Distance" column
- Calculate from warehouse to delivery branch
- Show as "12.5 km" or "—" if no coordinates
- Color code: <10km green, 10-20km yellow, >20km red

**Acceptance Criteria:**
- Distance calculates correctly
- No performance issues with 100+ orders
- Handles missing coordinates gracefully

---

## Phase 4: Analytics & Optimization (Day 4)

### Task 4.1: Build Route Analytics Dashboard
**What:** Show delivery performance metrics
**File:** `/src/app/analytics/routes/page.tsx`

**Metrics:**
- Total routes completed this week/month
- Average delivery time per stop
- Total distance driven
- Fuel cost estimates
- On-time delivery percentage
- Driver performance comparison

**Visualizations:**
- Line chart: Daily delivery counts
- Bar chart: Distance by driver
- Heatmap: Delivery density by zone
- Table: Route efficiency stats

**Acceptance Criteria:**
- Charts render correctly
- Data aggregates accurately
- Filters by date range work

---

### Task 4.2: Add Real-Time ETA Updates
**What:** Recalculate ETA based on actual progress
**Why:** Provide accurate arrival estimates

**Implementation:**
- When driver marks stop as completed, recalculate ETA for remaining stops
- Account for actual travel time vs estimated
- Update all pending stop ETAs
- Notify customers if delay detected

**Acceptance Criteria:**
- ETA updates within 1 minute of stop completion
- Accuracy improves over time (learning)
- Customers receive SMS if delayed >15 min

---

## Phase 5: Advanced Features (Optional)

### Task 5.1: Multi-Vehicle Route Planning
**What:** Distribute deliveries across multiple drivers
**Why:** Handle large order volumes

**Algorithm:**
- Cluster deliveries by geographic zone
- Assign clusters to available vehicles
- Optimize each cluster separately
- Balance workload (similar distance per driver)

---

### Task 5.2: Traffic Integration
**What:** Adjust routes based on real-time traffic
**API:** OpenRouteService or Google Maps Directions API

**Features:**
- Fetch traffic conditions
- Adjust ETAs for congestion
- Suggest alternate routes

---

### Task 5.3: Customer Notifications
**What:** SMS alerts for delivery status
**Why:** Improve customer experience

**Triggers:**
- Route assigned: "Your delivery is scheduled for 2 PM"
- Driver started route: "Your delivery is on the way"
- 2 stops away: "Delivery arriving in 30 minutes"
- Delivered: "Your order has been delivered"

---

## Testing Strategy

### Unit Tests
- DistanceCalculator: All calculation methods
- RouteOptimizer: Nearest neighbor, 2-opt
- API routes: CRUD operations

### Integration Tests
- Full route creation workflow
- Driver completing route flow
- Distance calculations with real data

### Manual Testing
- Test with actual Tashkent coordinates
- Verify route makes sense geographically
- Driver UI on mobile device
- Performance with 50+ stops

---

## Success Metrics

**Technical:**
- Route optimization: <2 seconds for 50 stops
- Map loads: <1 second
- API response times: <500ms
- Zero crashes on mobile

**Business:**
- 20% reduction in total delivery distance
- 15% improvement in on-time delivery rate
- Driver satisfaction: 4/5 or higher
- Reduced fuel costs (measurable)

---

## Risks & Mitigation

**Risk 1:** Map library conflicts with Next.js SSR
- **Mitigation:** Use 'use client' directive, dynamic imports

**Risk 2:** Route optimization too slow for large datasets
- **Mitigation:** Implement caching, use Web Workers for computation

**Risk 3:** GPS accuracy issues in urban areas
- **Mitigation:** Use snap-to-road APIs, timeout for stale locations

**Risk 4:** Database performance with many routes
- **Mitigation:** Add proper indexes, implement pagination

---

## Timeline Summary

- **Day 1:** Foundation (libraries, distance service, basic map)
- **Day 2:** Route optimization (schema, algorithms, APIs)
- **Day 3:** UI (planning dashboard, driver view)
- **Day 4:** Analytics and refinement

**Total Estimated Effort:** 4 developer days

---

## Next Steps

1. Get approval for this plan
2. Install libraries and verify compatibility
3. Implement Phase 1 tasks sequentially
4. Review after Phase 1 before proceeding
5. Iterate based on feedback

---

## Notes

- All coordinates in database use WGS84 (standard GPS format)
- Tashkent center: 41.2995° N, 69.2401° E
- Average city speed assumption: 40 km/h
- Map tiles from OpenStreetMap (free, no API key)
- Consider PostGIS later for advanced spatial queries
