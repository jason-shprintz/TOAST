/**
 * Tests for highest point search
 * @format
 */

import { findHighestPointInRadius } from '../terrain/highestPoint';
import type { HighestPointOptions } from '../terrain/terrainTypes';

describe('Highest Point Search', () => {
  describe('Peak at center', () => {
    it('should find peak at center of paraboloid', () => {
      // Create a paraboloid with peak at center (40.0, -74.0) with elevation 1000m
      // Elevation decreases as distance from center increases
      const centerLat = 40.0;
      const centerLng = -74.0;
      const peakElevation = 1000;

      const getElevation = jest.fn((lat: number, lng: number) => {
        // Calculate distance from center in degrees
        const dLat = lat - centerLat;
        const dLng = lng - centerLng;
        const distSq = dLat * dLat + dLng * dLng;

        // Paraboloid: elevation decreases with distance squared
        // Scale factor chosen to have reasonable drop-off
        return peakElevation - distSq * 100000;
      });

      const opts: HighestPointOptions = {
        radiusMeters: 1000, // 1km radius
        stepMeters: 50,
      };

      const bounds = {
        minLat: 39.5,
        minLng: -74.5,
        maxLat: 40.5,
        maxLng: -73.5,
      };

      const result = findHighestPointInRadius(
        getElevation,
        centerLat,
        centerLng,
        opts,
        bounds,
      );

      expect(result).not.toBeNull();
      expect(result?.elevationM).toBeGreaterThan(999); // should be near peak
      // Should be close to center
      expect(result?.lat).toBeCloseTo(centerLat, 2);
      expect(result?.lng).toBeCloseTo(centerLng, 2);
    });
  });

  describe('Peak off-center', () => {
    it('should find peak offset from search center', () => {
      // Peak is at (40.005, -74.005), offset from center (40.0, -74.0)
      const peakLat = 40.005;
      const peakLng = -74.005;
      const peakElevation = 1200;

      const getElevation = jest.fn((lat: number, lng: number) => {
        // Calculate distance from peak
        const dLat = lat - peakLat;
        const dLng = lng - peakLng;
        const distSq = dLat * dLat + dLng * dLng;

        // Paraboloid centered at peak
        return peakElevation - distSq * 100000;
      });

      const centerLat = 40.0;
      const centerLng = -74.0;

      const opts: HighestPointOptions = {
        radiusMeters: 1000, // 1km radius (should include peak)
        stepMeters: 50,
      };

      const bounds = {
        minLat: 39.5,
        minLng: -74.5,
        maxLat: 40.5,
        maxLng: -73.5,
      };

      const result = findHighestPointInRadius(
        getElevation,
        centerLat,
        centerLng,
        opts,
        bounds,
      );

      expect(result).not.toBeNull();
      expect(result?.elevationM).toBeGreaterThan(1199); // should be near peak
      // Should be close to actual peak location
      expect(result?.lat).toBeCloseTo(peakLat, 2);
      expect(result?.lng).toBeCloseTo(peakLng, 2);
    });
  });

  describe('Nodata handling', () => {
    it('should return null when all elevations are null', () => {
      const getElevation = jest.fn((_lat: number, _lng: number) => null);

      const centerLat = 40.0;
      const centerLng = -74.0;

      const opts: HighestPointOptions = {
        radiusMeters: 1000,
        stepMeters: 50,
      };

      const bounds = {
        minLat: 39.5,
        minLng: -74.5,
        maxLat: 40.5,
        maxLng: -73.5,
      };

      const result = findHighestPointInRadius(
        getElevation,
        centerLat,
        centerLng,
        opts,
        bounds,
      );

      expect(result).toBeNull();
    });

    it('should skip null elevations and find valid peak', () => {
      // Half the area returns null, other half has a peak
      const peakLat = 40.003;
      const peakLng = -74.003;
      const peakElevation = 1100;

      const getElevation = jest.fn((lat: number, lng: number) => {
        // Return null for eastern half
        if (lng > -74.0) {
          return null;
        }

        // Western half has a peak
        const dLat = lat - peakLat;
        const dLng = lng - peakLng;
        const distSq = dLat * dLat + dLng * dLng;
        return peakElevation - distSq * 100000;
      });

      const centerLat = 40.0;
      const centerLng = -74.0;

      const opts: HighestPointOptions = {
        radiusMeters: 1000,
        stepMeters: 50,
      };

      const bounds = {
        minLat: 39.5,
        minLng: -74.5,
        maxLat: 40.5,
        maxLng: -73.5,
      };

      const result = findHighestPointInRadius(
        getElevation,
        centerLat,
        centerLng,
        opts,
        bounds,
      );

      expect(result).not.toBeNull();
      expect(result?.elevationM).toBeGreaterThan(1099);
      // Should find peak in western half
      expect(result?.lng).toBeLessThan(-74.0);
    });
  });

  describe('Performance safety', () => {
    it('should respect maxSamples limit', () => {
      const getElevation = jest.fn((_lat: number, _lng: number) => 100);

      const centerLat = 40.0;
      const centerLng = -74.0;

      const opts: HighestPointOptions = {
        radiusMeters: 10000, // 10km radius (would be many samples)
        stepMeters: 10, // Small step size (would create many samples)
        maxSamples: 100, // But limit to 100 samples
      };

      const bounds = {
        minLat: 39.0,
        minLng: -75.0,
        maxLat: 41.0,
        maxLng: -73.0,
      };

      const result = findHighestPointInRadius(
        getElevation,
        centerLat,
        centerLng,
        opts,
        bounds,
      );

      // Should complete without error and find a point
      expect(result).not.toBeNull();

      // Should not have called getElevation too many times
      // (allowing some overhead for distance checks that are skipped)
      expect(getElevation.mock.calls.length).toBeLessThan(200);
    });
  });
});
