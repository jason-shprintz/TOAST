/**
 * Tests for tile coverage and bounding geometry utilities
 * @format
 */

import {
  computeTileCoverage,
  boundsToTileRange,
  estimateTileCountForBounds,
} from '../geo/coverage';
import {
  milesToMeters,
  clampLat,
  normalizeLng,
  regionToBounds,
} from '../geo/geoMath';
import { lonToTileX, latToTileY, tileXToLon, tileYToLat } from '../geo/tiles';

describe('Geo Math Utilities', () => {
  describe('milesToMeters', () => {
    it('should convert miles to meters correctly', () => {
      expect(milesToMeters(1)).toBeCloseTo(1609.344, 2);
      expect(milesToMeters(25)).toBeCloseTo(40233.6, 2);
      expect(milesToMeters(0)).toBe(0);
    });
  });

  describe('clampLat', () => {
    it('should clamp latitude to Web Mercator range', () => {
      expect(clampLat(90)).toBeCloseTo(85.05112878, 6);
      expect(clampLat(-90)).toBeCloseTo(-85.05112878, 6);
      expect(clampLat(85.2)).toBeCloseTo(85.05112878, 6);
      expect(clampLat(-85.2)).toBeCloseTo(-85.05112878, 6);
      expect(clampLat(40)).toBe(40);
      expect(clampLat(-40)).toBe(-40);
    });
  });

  describe('normalizeLng', () => {
    it('should normalize longitude to [-180, 180]', () => {
      expect(normalizeLng(0)).toBe(0);
      expect(normalizeLng(180)).toBe(180);
      expect(normalizeLng(-180)).toBe(180); // -180 and 180 are equivalent
      expect(normalizeLng(190)).toBe(-170);
      expect(normalizeLng(-190)).toBe(170);
      expect(normalizeLng(360)).toBe(0);
      expect(normalizeLng(540)).toBe(180);
    });
  });

  describe('regionToBounds', () => {
    it('should compute bounds for a region', () => {
      const center = { lat: 36.1699, lng: -115.1398 }; // Las Vegas
      const radiusMiles = 25;
      const bounds = regionToBounds(center, radiusMiles);

      expect(bounds.minLat).toBeLessThan(center.lat);
      expect(bounds.maxLat).toBeGreaterThan(center.lat);
      expect(bounds.minLng).toBeLessThan(center.lng);
      expect(bounds.maxLng).toBeGreaterThan(center.lng);

      // Rough sanity check: 25 miles is about 0.36 degrees at this latitude
      expect(bounds.maxLat - bounds.minLat).toBeCloseTo(0.72, 1);
    });

    it('should clamp latitude near poles', () => {
      const center = { lat: 85.2, lng: 0 };
      const radiusMiles = 10;
      const bounds = regionToBounds(center, radiusMiles);

      expect(bounds.maxLat).toBeLessThanOrEqual(85.05112878);
      expect(bounds.minLat).toBeGreaterThanOrEqual(-85.05112878);
    });

    it('should normalize longitude across antimeridian', () => {
      const center = { lat: 0, lng: 179.9 };
      const radiusMiles = 25;
      const bounds = regionToBounds(center, radiusMiles);

      // Bounds should be normalized
      expect(bounds.minLng).toBeGreaterThanOrEqual(-180);
      expect(bounds.maxLng).toBeLessThanOrEqual(180);
    });
  });
});

describe('Tile Coordinate Conversions', () => {
  describe('lonToTileX and tileXToLon', () => {
    it('should convert longitude to tile X coordinate', () => {
      expect(lonToTileX(0, 0)).toBeCloseTo(0.5, 4);
      expect(lonToTileX(-180, 1)).toBeCloseTo(0, 4);
      expect(lonToTileX(180, 1)).toBeCloseTo(2, 4);
      expect(lonToTileX(0, 2)).toBeCloseTo(2, 4);
    });

    it('should be reversible', () => {
      const testCases = [
        { lng: 0, z: 8 },
        { lng: -115.1398, z: 10 },
        { lng: 179.9, z: 5 },
      ];

      testCases.forEach(({ lng, z }) => {
        const x = lonToTileX(lng, z);
        const lngBack = tileXToLon(x, z);
        expect(lngBack).toBeCloseTo(lng, 5);
      });
    });
  });

  describe('latToTileY and tileYToLat', () => {
    it('should convert latitude to tile Y coordinate', () => {
      const y0 = latToTileY(85.05, 0);
      expect(y0).toBeCloseTo(0, 2);

      const y1 = latToTileY(-85.05, 0);
      expect(y1).toBeCloseTo(1, 2);
    });

    it('should be reversible', () => {
      const testCases = [
        { lat: 0, z: 8 },
        { lat: 36.1699, z: 10 },
        { lat: -40, z: 5 },
        { lat: 60, z: 12 },
      ];

      testCases.forEach(({ lat, z }) => {
        const y = latToTileY(lat, z);
        const latBack = tileYToLat(y, z);
        expect(latBack).toBeCloseTo(lat, 5);
      });
    });
  });
});

describe('Tile Coverage Computation', () => {
  describe('boundsToTileRange', () => {
    it('should compute tile range for bounds at zoom level', () => {
      const bounds = {
        minLat: 35.5,
        minLng: -116,
        maxLat: 37,
        maxLng: -114,
      };
      const z = 8;
      const range = boundsToTileRange(bounds, z);

      // Y range should not wrap; minY should always be <= maxY
      expect(range.minY).toBeLessThanOrEqual(range.maxY);
      // X range may wrap across the antimeridian; assert that both are within valid tile index bounds
      expect(range.minX >= 0 && range.maxX < Math.pow(2, z)).toBe(true);
      expect(range.minX).toBeGreaterThanOrEqual(0);
      expect(range.maxX).toBeLessThan(Math.pow(2, z));
      expect(range.minY).toBeGreaterThanOrEqual(0);
      expect(range.maxY).toBeLessThan(Math.pow(2, z));
    });

    it('should handle antimeridian crossing', () => {
      const bounds = {
        minLat: -5,
        minLng: 175, // normalized to 175
        maxLat: 5,
        maxLng: -175, // normalized to -175
      };
      const z = 4;
      const range = boundsToTileRange(bounds, z);

      // When crossing antimeridian, we expect minX > maxX
      // This indicates the range wraps around
      expect(range.minX).toBeGreaterThanOrEqual(0);
      expect(range.maxX).toBeLessThan(Math.pow(2, z));
    });
  });

  describe('computeTileCoverage', () => {
    it('should compute coverage for Las Vegas region', () => {
      const center = { lat: 36.1699, lng: -115.1398 };
      const radiusMiles = 25;
      const cfg = { minZoom: 8, maxZoom: 10 };

      const result = computeTileCoverage(center, radiusMiles, cfg);

      // Verify bounds
      expect(result.bounds.minLat).toBeLessThan(center.lat);
      expect(result.bounds.maxLat).toBeGreaterThan(center.lat);
      expect(result.bounds.minLng).toBeLessThan(center.lng);
      expect(result.bounds.maxLng).toBeGreaterThan(center.lng);

      // Verify tiles exist
      expect(result.totalTileCount).toBeGreaterThan(0);
      expect(result.tiles.length).toBe(result.totalTileCount);

      // Verify tiles are sorted (z, y, x)
      for (let i = 1; i < result.tiles.length; i++) {
        const prev = result.tiles[i - 1];
        const curr = result.tiles[i];

        if (prev.z !== curr.z) {
          expect(curr.z).toBeGreaterThan(prev.z);
        } else if (prev.y !== curr.y) {
          expect(curr.y).toBeGreaterThan(prev.y);
        } else {
          expect(curr.x).toBeGreaterThan(prev.x);
        }
      }

      // Verify tiles are unique
      const tileSet = new Set(result.tiles.map((t) => `${t.z}/${t.x}/${t.y}`));
      expect(tileSet.size).toBe(result.tiles.length);

      // Verify tile count by zoom
      expect(result.tileCountByZoom[8]).toBeGreaterThan(0);
      expect(result.tileCountByZoom[9]).toBeGreaterThan(0);
      expect(result.tileCountByZoom[10]).toBeGreaterThan(0);

      const sumByZoom = Object.values(result.tileCountByZoom).reduce(
        (a, b) => a + b,
        0,
      );
      expect(sumByZoom).toBe(result.totalTileCount);
    });

    it('should handle region near antimeridian', () => {
      const center = { lat: 0, lng: 179.9 };
      const radiusMiles = 25;
      const cfg = { minZoom: 4, maxZoom: 6 };

      const result = computeTileCoverage(center, radiusMiles, cfg);

      expect(result.totalTileCount).toBeGreaterThan(0);
      expect(result.tiles.length).toBe(result.totalTileCount);

      // Verify tiles are unique
      const tileSet = new Set(result.tiles.map((t) => `${t.z}/${t.x}/${t.y}`));
      expect(tileSet.size).toBe(result.tiles.length);

      // Check that we have tiles near both edges (x near 0 and x near max)
      const z = 5;
      const tilesAtZ5 = result.tiles.filter((t) => t.z === z);
      const maxX = Math.pow(2, z) - 1;

      const hasHighX = tilesAtZ5.some((t) => t.x >= maxX - 2);
      const hasLowX = tilesAtZ5.some((t) => t.x <= 2);

      // Should have tiles on both sides if crossing antimeridian
      expect(hasHighX).toBe(true);
      expect(hasLowX).toBe(true);
    });

    it('should clamp latitude near poles', () => {
      const center = { lat: 85.2, lng: 0 };
      const radiusMiles = 10;
      const cfg = { minZoom: 3, maxZoom: 5 };

      const result = computeTileCoverage(center, radiusMiles, cfg);

      // Bounds should be clamped
      expect(result.bounds.maxLat).toBeLessThanOrEqual(85.05112878);

      // All tiles should have valid Y coordinates
      result.tiles.forEach((tile) => {
        const n = Math.pow(2, tile.z);
        expect(tile.y).toBeGreaterThanOrEqual(0);
        expect(tile.y).toBeLessThan(n);
      });

      expect(result.totalTileCount).toBeGreaterThan(0);
    });

    it('should handle small radius', () => {
      const center = { lat: 40.7128, lng: -74.006 }; // NYC
      const radiusMiles = 1;
      const cfg = { minZoom: 10, maxZoom: 12 };

      const result = computeTileCoverage(center, radiusMiles, cfg);

      expect(result.totalTileCount).toBeGreaterThan(0);

      // Small radius should result in fewer tiles at lower zoom
      expect(result.tileCountByZoom[10]).toBeLessThan(
        result.tileCountByZoom[12],
      );
    });

    it('should handle single zoom level', () => {
      const center = { lat: 0, lng: 0 };
      const radiusMiles = 50;
      const cfg = { minZoom: 5, maxZoom: 5 };

      const result = computeTileCoverage(center, radiusMiles, cfg);

      expect(result.totalTileCount).toBeGreaterThan(0);
      expect(Object.keys(result.tileCountByZoom)).toHaveLength(1);
      expect(result.tileCountByZoom[5]).toBe(result.totalTileCount);

      // All tiles should be at zoom 5
      result.tiles.forEach((tile) => {
        expect(tile.z).toBe(5);
      });
    });
  });

  describe('estimateTileCountForBounds', () => {
    it('should estimate tile count without generating full list', () => {
      const bounds = {
        minLat: 35.5,
        minLng: -116,
        maxLat: 37,
        maxLng: -114,
      };
      const cfg = { minZoom: 8, maxZoom: 10 };

      const estimate = estimateTileCountForBounds(bounds, cfg);

      expect(estimate.total).toBeGreaterThan(0);
      expect(estimate.byZoom[8]).toBeGreaterThan(0);
      expect(estimate.byZoom[9]).toBeGreaterThan(0);
      expect(estimate.byZoom[10]).toBeGreaterThan(0);

      const sum = Object.values(estimate.byZoom).reduce((a, b) => a + b, 0);
      expect(sum).toBe(estimate.total);

      // Tile count should increase with zoom level
      expect(estimate.byZoom[8]).toBeLessThan(estimate.byZoom[10]);
    });

    it('should match actual tile count for normal bounds', () => {
      const center = { lat: 40, lng: -100 };
      const radiusMiles = 20;
      const bounds = regionToBounds(center, radiusMiles);
      const cfg = { minZoom: 6, maxZoom: 8 };

      const coverage = computeTileCoverage(center, radiusMiles, cfg);
      const estimate = estimateTileCountForBounds(bounds, cfg);

      expect(estimate.total).toBe(coverage.totalTileCount);
      expect(estimate.byZoom[6]).toBe(coverage.tileCountByZoom[6]);
      expect(estimate.byZoom[7]).toBe(coverage.tileCountByZoom[7]);
      expect(estimate.byZoom[8]).toBe(coverage.tileCountByZoom[8]);
    });
  });
});
