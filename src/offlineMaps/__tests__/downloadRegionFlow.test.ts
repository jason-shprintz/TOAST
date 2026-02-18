/**
 * Tests for Download Region Flow
 * @format
 */

import { estimateRegionSize } from '../ui/download/estimator';

describe('Download Region Flow', () => {
  describe('estimateRegionSize', () => {
    it('should calculate size estimate for a region', () => {
      const center = { lat: 37.7749, lng: -122.4194 };
      const radiusMiles = 25;

      const estimate = estimateRegionSize(center, radiusMiles);

      expect(estimate).toBeDefined();
      expect(estimate.tileCount).toBeGreaterThan(0);
      expect(estimate.estimatedTilesMB).toBeGreaterThan(0);
      expect(estimate.estimatedDemMB).toBe(120); // DEM_ESTIMATE_MB
      expect(estimate.estimatedMetaMB).toBe(20); // META_ESTIMATE_MB
      expect(estimate.estimatedTotalMB).toBeGreaterThan(0);
      expect(estimate.estimatedTotalMB).toBe(
        estimate.estimatedTilesMB +
          estimate.estimatedDemMB +
          estimate.estimatedMetaMB,
      );
    });

    it('should handle different radius values', () => {
      const center = { lat: 37.7749, lng: -122.4194 };

      const estimate10 = estimateRegionSize(center, 10);
      const estimate25 = estimateRegionSize(center, 25);
      const estimate50 = estimateRegionSize(center, 50);

      expect(estimate10.tileCount).toBeLessThan(estimate25.tileCount);
      expect(estimate25.tileCount).toBeLessThan(estimate50.tileCount);
      expect(estimate10.estimatedTotalMB).toBeLessThan(
        estimate25.estimatedTotalMB,
      );
      expect(estimate25.estimatedTotalMB).toBeLessThan(
        estimate50.estimatedTotalMB,
      );
    });

    it('should handle edge case of very small radius', () => {
      const center = { lat: 37.7749, lng: -122.4194 };
      const radiusMiles = 1;

      const estimate = estimateRegionSize(center, radiusMiles);

      expect(estimate).toBeDefined();
      expect(estimate.tileCount).toBeGreaterThan(0);
      expect(estimate.estimatedTotalMB).toBeGreaterThan(0);
    });

    it('should handle different locations', () => {
      const radiusMiles = 25;

      // Test different latitudes
      const sanFrancisco = estimateRegionSize(
        { lat: 37.7749, lng: -122.4194 },
        radiusMiles,
      );
      const equator = estimateRegionSize({ lat: 0, lng: 0 }, radiusMiles);
      const nearPole = estimateRegionSize({ lat: 80, lng: 0 }, radiusMiles);

      // All should produce valid estimates
      expect(sanFrancisco.tileCount).toBeGreaterThan(0);
      expect(equator.tileCount).toBeGreaterThan(0);
      expect(nearPole.tileCount).toBeGreaterThan(0);
    });
  });
});
