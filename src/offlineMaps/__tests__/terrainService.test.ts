/**
 * Tests for terrain service integration
 * @format
 */

import { createTerrainService } from '../terrain/terrainService';
import type { DemMetadataV1 } from '../dem/demTypes';

describe('Terrain Service', () => {
  describe('Service creation and parameter derivation', () => {
    it('should create service with correct parameter derivation', () => {
      // Create a simple 3x3 grid with known resolution
      const width = 3;
      const height = 3;
      const buffer = new ArrayBuffer(width * height * 2); // int16
      const view = new DataView(buffer);

      // Fill with flat terrain at 100m
      for (let i = 0; i < width * height; i++) {
        view.setInt16(i * 2, 100, true);
      }

      const metadata: DemMetadataV1 = {
        format: 'grid',
        units: 'meters',
        encoding: 'int16',
        width,
        height,
        nodata: -32768,
        bounds: {
          minLat: 40.0,
          minLng: -74.0,
          maxLat: 40.02, // 0.02 deg ≈ 2.2km
          maxLng: -73.98,
        },
      };

      const service = createTerrainService(metadata, buffer);

      expect(service).toBeDefined();
      expect(typeof service.getElevation).toBe('function');
      expect(typeof service.getSlope).toBe('function');
      expect(typeof service.findHighestPointWithin).toBe('function');
    });

    it('should clamp sample distance to reasonable bounds', () => {
      // Create grid with very small resolution (< 30m)
      const width = 100;
      const height = 100;
      const buffer = new ArrayBuffer(width * height * 2);
      const view = new DataView(buffer);

      for (let i = 0; i < width * height; i++) {
        view.setInt16(i * 2, 100, true);
      }

      const metadata: DemMetadataV1 = {
        format: 'grid',
        units: 'meters',
        encoding: 'int16',
        width,
        height,
        nodata: -32768,
        bounds: {
          minLat: 40.0,
          minLng: -74.0,
          maxLat: 40.002, // Very small area, < 30m resolution
          maxLng: -73.998,
        },
      };

      const service = createTerrainService(metadata, buffer);

      // Should still work (sample distance clamped to 30m minimum)
      const slope = service.getSlope(40.001, -73.999);
      expect(slope).not.toBeNull();
      expect(slope).toBeCloseTo(0, 5);
    });

    it('should clamp sample distance for large resolution', () => {
      // Create grid with very large resolution (> 200m)
      const width = 2;
      const height = 2;
      const buffer = new ArrayBuffer(width * height * 2);
      const view = new DataView(buffer);

      for (let i = 0; i < width * height; i++) {
        view.setInt16(i * 2, 100, true);
      }

      const metadata: DemMetadataV1 = {
        format: 'grid',
        units: 'meters',
        encoding: 'int16',
        width,
        height,
        nodata: -32768,
        bounds: {
          minLat: 40.0,
          minLng: -74.0,
          maxLat: 41.0, // Large area, > 200m resolution
          maxLng: -73.0,
        },
      };

      const service = createTerrainService(metadata, buffer);

      // Should still work (sample distance clamped to 200m maximum)
      const slope = service.getSlope(40.5, -73.5);
      expect(slope).not.toBeNull();
    });
  });

  describe('Integration: getElevation', () => {
    it('should return correct elevation through service', () => {
      const width = 2;
      const height = 2;
      const buffer = new ArrayBuffer(width * height * 2);
      const view = new DataView(buffer);

      view.setInt16(0 * 2, 100, true);
      view.setInt16(1 * 2, 200, true);
      view.setInt16(2 * 2, 300, true);
      view.setInt16(3 * 2, 400, true);

      const metadata: DemMetadataV1 = {
        format: 'grid',
        units: 'meters',
        encoding: 'int16',
        width,
        height,
        nodata: -32768,
        bounds: {
          minLat: 40.0,
          minLng: -74.0,
          maxLat: 41.0,
          maxLng: -73.0,
        },
      };

      const service = createTerrainService(metadata, buffer);

      // Test corner
      expect(service.getElevation(41.0, -74.0)).toBeCloseTo(100, 5);
      // Test center (interpolated)
      expect(service.getElevation(40.5, -73.5)).toBeCloseTo(250, 5);
    });
  });

  describe('Integration: getSlope', () => {
    it('should compute slope through service', () => {
      const width = 3;
      const height = 3;
      const buffer = new ArrayBuffer(width * height * 2);
      const view = new DataView(buffer);

      // Create a ramp in east-west direction
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          view.setInt16((row * width + col) * 2, col * 100, true);
        }
      }

      const metadata: DemMetadataV1 = {
        format: 'grid',
        units: 'meters',
        encoding: 'int16',
        width,
        height,
        nodata: -32768,
        bounds: {
          minLat: 40.0,
          minLng: -74.0,
          maxLat: 40.02,
          maxLng: -73.98,
        },
      };

      const service = createTerrainService(metadata, buffer);

      const slope = service.getSlope(40.01, -73.99);
      expect(slope).not.toBeNull();
      expect(slope).toBeGreaterThan(0);
    });
  });

  describe('Integration: findHighestPointWithin', () => {
    it('should find highest point through service', () => {
      const width = 5;
      const height = 5;
      const buffer = new ArrayBuffer(width * height * 2);
      const view = new DataView(buffer);

      // Create terrain with peak in center
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const distFromCenter = Math.abs(row - 2) + Math.abs(col - 2);
          const elevation = 500 - distFromCenter * 50;
          view.setInt16((row * width + col) * 2, elevation, true);
        }
      }

      const metadata: DemMetadataV1 = {
        format: 'grid',
        units: 'meters',
        encoding: 'int16',
        width,
        height,
        nodata: -32768,
        bounds: {
          minLat: 40.0,
          minLng: -74.0,
          maxLat: 40.04,
          maxLng: -73.96,
        },
      };

      const service = createTerrainService(metadata, buffer);

      const peak = service.findHighestPointWithin(40.02, -73.98, {
        radiusMeters: 5000,
      });

      expect(peak).not.toBeNull();
      expect(peak?.elevationM).toBeGreaterThan(450);
    });

    it('should use default step size when not provided', () => {
      const width = 3;
      const height = 3;
      const buffer = new ArrayBuffer(width * height * 2);
      const view = new DataView(buffer);

      for (let i = 0; i < width * height; i++) {
        view.setInt16(i * 2, 100 + i * 10, true);
      }

      const metadata: DemMetadataV1 = {
        format: 'grid',
        units: 'meters',
        encoding: 'int16',
        width,
        height,
        nodata: -32768,
        bounds: {
          minLat: 40.0,
          minLng: -74.0,
          maxLat: 40.02,
          maxLng: -73.98,
        },
      };

      const service = createTerrainService(metadata, buffer);

      // Don't provide stepMeters
      const peak = service.findHighestPointWithin(40.01, -73.99, {
        radiusMeters: 2000,
      });

      expect(peak).not.toBeNull();
    });
  });

  describe('Parameter validation through service', () => {
    it('should handle invalid slope parameters', () => {
      const width = 2;
      const height = 2;
      const buffer = new ArrayBuffer(width * height * 2);
      const view = new DataView(buffer);

      for (let i = 0; i < width * height; i++) {
        view.setInt16(i * 2, 100, true);
      }

      const metadata: DemMetadataV1 = {
        format: 'grid',
        units: 'meters',
        encoding: 'int16',
        width,
        height,
        nodata: -32768,
        bounds: {
          minLat: 40.0,
          minLng: -74.0,
          maxLat: 41.0,
          maxLng: -73.0,
        },
      };

      const service = createTerrainService(metadata, buffer);

      // Should still work even with edge coordinates
      const slope = service.getSlope(40.0, -74.0);
      expect(slope).not.toBeNull();
    });

    it('should handle invalid highest point parameters', () => {
      const width = 2;
      const height = 2;
      const buffer = new ArrayBuffer(width * height * 2);
      const view = new DataView(buffer);

      for (let i = 0; i < width * height; i++) {
        view.setInt16(i * 2, 100, true);
      }

      const metadata: DemMetadataV1 = {
        format: 'grid',
        units: 'meters',
        encoding: 'int16',
        width,
        height,
        nodata: -32768,
        bounds: {
          minLat: 40.0,
          minLng: -74.0,
          maxLat: 41.0,
          maxLng: -73.0,
        },
      };

      const service = createTerrainService(metadata, buffer);

      // Invalid radius (negative)
      const result1 = service.findHighestPointWithin(40.5, -73.5, {
        radiusMeters: -1000,
      });
      expect(result1).toBeNull();

      // Invalid radius (zero)
      const result2 = service.findHighestPointWithin(40.5, -73.5, {
        radiusMeters: 0,
      });
      expect(result2).toBeNull();

      // Invalid step size (should use default)
      const result3 = service.findHighestPointWithin(40.5, -73.5, {
        radiusMeters: 1000,
        stepMeters: -100,
      });
      expect(result3).not.toBeNull(); // Should still work with default
    });
  });
});
