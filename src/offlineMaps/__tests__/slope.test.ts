/**
 * Tests for slope calculation
 * @format
 */

import { computeSlopePercent } from '../terrain/slope';

describe('Slope Calculation', () => {
  describe('Flat terrain', () => {
    it('should return ~0 slope for flat plane', () => {
      // Mock elevation function that returns constant value
      const getElevation = jest.fn((_lat: number, _lng: number) => 100);

      const lat = 40.0;
      const lng = -74.0;
      const sampleDistanceMeters = 30;

      const slope = computeSlopePercent(
        getElevation,
        lat,
        lng,
        sampleDistanceMeters,
      );

      expect(slope).not.toBeNull();
      expect(slope).toBeCloseTo(0, 5);
    });
  });

  describe('Linear ramp', () => {
    it('should return positive slope for east-west ramp', () => {
      // Create a ramp that increases 1 meter per 0.0001 degrees longitude
      // At lat ~40°, 0.0001 deg longitude ≈ 8.5 meters
      // So slope ≈ 1/8.5 ≈ 0.118 = 11.8%
      const getElevation = jest.fn((lat: number, lng: number) => {
        return 1000 + lng * 10000; // increases 1m per 0.0001 deg
      });

      const lat = 40.0;
      const lng = -74.0;
      const sampleDistanceMeters = 30;

      const slope = computeSlopePercent(
        getElevation,
        lat,
        lng,
        sampleDistanceMeters,
      );

      expect(slope).not.toBeNull();
      expect(slope).toBeGreaterThan(0);
      // Slope should be stable and positive
      expect(slope).toBeGreaterThan(5); // at least 5% grade
      expect(slope).toBeLessThan(20); // but not crazy steep
    });

    it('should return positive slope for north-south ramp', () => {
      // Create a ramp that increases 1 meter per 0.0001 degrees latitude
      // 0.0001 deg latitude ≈ 11.1 meters
      // So slope ≈ 1/11.1 ≈ 0.09 = 9%
      const getElevation = jest.fn((lat: number, _lng: number) => {
        return 1000 + lat * 10000; // increases 1m per 0.0001 deg
      });

      const lat = 40.0;
      const lng = -74.0;
      const sampleDistanceMeters = 30;

      const slope = computeSlopePercent(
        getElevation,
        lat,
        lng,
        sampleDistanceMeters,
      );

      expect(slope).not.toBeNull();
      expect(slope).toBeGreaterThan(0);
      // Slope should be stable and positive
      expect(slope).toBeGreaterThan(5); // at least 5% grade
      expect(slope).toBeLessThan(15); // but not crazy steep
    });
  });

  describe('Nodata handling', () => {
    it('should return null when center elevation is null', () => {
      const getElevation = jest.fn((_lat: number, _lng: number) => null);

      const lat = 40.0;
      const lng = -74.0;
      const sampleDistanceMeters = 30;

      const slope = computeSlopePercent(
        getElevation,
        lat,
        lng,
        sampleDistanceMeters,
      );

      expect(slope).toBeNull();
    });

    it('should use forward difference when one neighbor is missing', () => {
      // Return null for north neighbor, but valid for others
      const getElevation = jest.fn((lat: number, _lng: number) => {
        // Center is at 40.0, -74.0
        const centerLat = 40.0;

        // If this is north of center, return null
        if (lat > centerLat + 0.00001) {
          return null;
        }

        // Otherwise return flat terrain
        return 100;
      });

      const lat = 40.0;
      const lng = -74.0;
      const sampleDistanceMeters = 30;

      const slope = computeSlopePercent(
        getElevation,
        lat,
        lng,
        sampleDistanceMeters,
      );

      // Should still compute slope using available neighbors
      expect(slope).not.toBeNull();
      expect(slope).toBeCloseTo(0, 5); // flat terrain
    });

    it('should return null when all neighbors are missing', () => {
      // Return valid center, but null for all neighbors
      const getElevation = jest.fn((lat: number, lng: number) => {
        const centerLat = 40.0;
        const centerLng = -74.0;

        // Only return valid at exact center
        if (lat === centerLat && lng === centerLng) {
          return 100;
        }

        return null;
      });

      const lat = 40.0;
      const lng = -74.0;
      const sampleDistanceMeters = 30;

      const slope = computeSlopePercent(
        getElevation,
        lat,
        lng,
        sampleDistanceMeters,
      );

      expect(slope).toBeNull();
    });
  });
});
