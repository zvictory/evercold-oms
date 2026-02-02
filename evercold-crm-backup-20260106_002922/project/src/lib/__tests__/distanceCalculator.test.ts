import { DistanceCalculator } from '../distanceCalculator';

describe('DistanceCalculator', () => {
  // Tashkent test coordinates
  const tashkentCenter = { latitude: 41.2995, longitude: 69.2401 };
  const chorsuBazaar = { latitude: 41.3264, longitude: 69.2343 };
  const airport = { latitude: 41.2668, longitude: 69.2819 };

  describe('getDistance', () => {
    it('should calculate distance between Tashkent center and Chorsu Bazaar', () => {
      const distance = DistanceCalculator.getDistance(
        tashkentCenter,
        chorsuBazaar
      );

      // Actual distance is approximately 3 km
      expect(distance).toBeGreaterThan(2.5);
      expect(distance).toBeLessThan(3.5);
    });

    it('should return 0 for same location', () => {
      const distance = DistanceCalculator.getDistance(
        tashkentCenter,
        tashkentCenter
      );

      expect(distance).toBe(0);
    });

    it('should calculate distance in miles', () => {
      const distanceKm = DistanceCalculator.getDistance(
        tashkentCenter,
        airport,
        'km'
      );
      const distanceMi = DistanceCalculator.getDistance(
        tashkentCenter,
        airport,
        'mi'
      );

      // 1 km ≈ 0.621371 miles
      expect(distanceMi).toBeCloseTo(distanceKm * 0.621371, 1);
    });
  });

  describe('getBearing', () => {
    it('should calculate bearing from Tashkent center to Chorsu (roughly north)', () => {
      const bearingDegrees = DistanceCalculator.getBearing(
        tashkentCenter,
        chorsuBazaar
      );

      // Chorsu is roughly north of center, so bearing should be near 0 or 360
      expect(bearingDegrees).toBeGreaterThan(-30);
      expect(bearingDegrees).toBeLessThan(30);
    });
  });

  describe('getRouteDistance', () => {
    it('should calculate total distance for multi-stop route', () => {
      const route = [tashkentCenter, chorsuBazaar, airport];
      const totalDistance = DistanceCalculator.getRouteDistance(route);

      // Should be sum of individual segments
      const leg1 = DistanceCalculator.getDistance(tashkentCenter, chorsuBazaar);
      const leg2 = DistanceCalculator.getDistance(chorsuBazaar, airport);
      const expected = leg1 + leg2;

      expect(totalDistance).toBeCloseTo(expected, 2);
    });

    it('should return 0 for single stop', () => {
      const distance = DistanceCalculator.getRouteDistance([tashkentCenter]);
      expect(distance).toBe(0);
    });

    it('should return 0 for empty route', () => {
      const distance = DistanceCalculator.getRouteDistance([]);
      expect(distance).toBe(0);
    });
  });

  describe('estimateTravelTime', () => {
    it('should estimate 30 minutes for 20km at 40km/h', () => {
      const time = DistanceCalculator.estimateTravelTime(20);
      expect(time).toBe(30);
    });

    it('should estimate 15 minutes for 10km', () => {
      const time = DistanceCalculator.estimateTravelTime(10);
      expect(time).toBe(15);
    });
  });

  describe('calculateETAs', () => {
    it('should calculate ETAs for route with stops', () => {
      const startTime = new Date('2025-12-14T09:00:00');
      const route = [tashkentCenter, chorsuBazaar, airport];

      const etas = DistanceCalculator.calculateETAs(route, startTime, 10);

      expect(etas).toHaveLength(3);
      expect(etas[0]).toEqual(startTime);
      expect(etas[1].getTime()).toBeGreaterThan(startTime.getTime());
      expect(etas[2].getTime()).toBeGreaterThan(etas[1].getTime());
    });
  });

  describe('findNearest', () => {
    it('should find nearest location from given point', () => {
      const locations = [chorsuBazaar, airport];
      const nearest = DistanceCalculator.findNearest(tashkentCenter, locations);

      expect(nearest).not.toBeNull();
      // Chorsu is closer than airport from center
      expect(nearest!.index).toBe(0);
    });

    it('should return null for empty locations array', () => {
      const nearest = DistanceCalculator.findNearest(tashkentCenter, []);
      expect(nearest).toBeNull();
    });
  });

  describe('isWithinRadius', () => {
    it('should return true if point is within radius', () => {
      const isWithin = DistanceCalculator.isWithinRadius(
        tashkentCenter,
        chorsuBazaar,
        5
      );

      expect(isWithin).toBe(true);
    });

    it('should return false if point is outside radius', () => {
      const isWithin = DistanceCalculator.isWithinRadius(
        tashkentCenter,
        chorsuBazaar,
        1
      );

      expect(isWithin).toBe(false);
    });
  });

  describe('formatDistance', () => {
    it('should format kilometers', () => {
      expect(DistanceCalculator.formatDistance(12.5)).toBe('12.5 km');
    });

    it('should format meters for distances < 1 km', () => {
      expect(DistanceCalculator.formatDistance(0.85)).toBe('850 m');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes', () => {
      expect(DistanceCalculator.formatDuration(45)).toBe('45 min');
    });

    it('should format hours and minutes', () => {
      expect(DistanceCalculator.formatDuration(90)).toBe('1h 30m');
    });

    it('should format whole hours', () => {
      expect(DistanceCalculator.formatDuration(120)).toBe('2h');
    });
  });
});
