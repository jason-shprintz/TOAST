/**
 * Tests for DEM sampler
 * @format
 */

import { createDemSampler } from '../dem/demSampler';
import type { DemMetadataV1 } from '../dem/demTypes';

describe('DEM Sampler', () => {
  describe('Int16 encoding', () => {
    it('should sample exact cell values at corners (2x2 grid)', () => {
      // Create a simple 2x2 grid:
      // [0, 10]
      // [20, 30]
      const width = 2;
      const height = 2;
      const buffer = new ArrayBuffer(width * height * 2); // int16 = 2 bytes
      const view = new DataView(buffer);

      // Row 0: [0, 10]
      view.setInt16(0 * 2, 0, true); // (0,0)
      view.setInt16(1 * 2, 10, true); // (0,1)
      // Row 1: [20, 30]
      view.setInt16(2 * 2, 20, true); // (1,0)
      view.setInt16(3 * 2, 30, true); // (1,1)

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

      const sampler = createDemSampler(metadata, buffer);

      // Sample at corners (exact grid positions)
      // Top-left (minLng, maxLat) -> grid (0, 0) -> value 0
      expect(sampler.getElevation(41.0, -74.0)).toBeCloseTo(0, 5);

      // Top-right (maxLng, maxLat) -> grid (0, 1) -> value 10
      expect(sampler.getElevation(41.0, -73.0)).toBeCloseTo(10, 5);

      // Bottom-left (minLng, minLat) -> grid (1, 0) -> value 20
      expect(sampler.getElevation(40.0, -74.0)).toBeCloseTo(20, 5);

      // Bottom-right (maxLng, minLat) -> grid (1, 1) -> value 30
      expect(sampler.getElevation(40.0, -73.0)).toBeCloseTo(30, 5);
    });

    it('should perform bilinear interpolation at center (2x2 grid)', () => {
      // Create a 2x2 grid:
      // [0, 10]
      // [20, 30]
      const width = 2;
      const height = 2;
      const buffer = new ArrayBuffer(width * height * 2);
      const view = new DataView(buffer);

      view.setInt16(0 * 2, 0, true);
      view.setInt16(1 * 2, 10, true);
      view.setInt16(2 * 2, 20, true);
      view.setInt16(3 * 2, 30, true);

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

      const sampler = createDemSampler(metadata, buffer);

      // Sample at center (40.5, -73.5)
      // This should be halfway between all four corners
      // Bilinear interpolation: (0 + 10 + 20 + 30) / 4 = 15
      const centerLat = 40.5;
      const centerLng = -73.5;
      const elevation = sampler.getElevation(centerLat, centerLng);

      expect(elevation).toBeCloseTo(15, 5);
    });

    it('should perform bilinear interpolation at quarter points (3x3 grid)', () => {
      // Create a 3x3 grid with predictable values
      const width = 3;
      const height = 3;
      const buffer = new ArrayBuffer(width * height * 2);
      const view = new DataView(buffer);

      // Fill grid with values: row * 10 + col
      // [0,  1,  2]
      // [10, 11, 12]
      // [20, 21, 22]
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const index = row * width + col;
          const value = row * 10 + col;
          view.setInt16(index * 2, value, true);
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
          maxLat: 42.0,
          maxLng: -72.0,
        },
      };

      const sampler = createDemSampler(metadata, buffer);

      // Test a point between (0,0), (0,1), (1,0), (1,1)
      // At lat=41.5, lng=-73.5, we're at grid position (0.5, 0.5)
      // This is exactly halfway between the four corners
      // Grid values: v00=0, v10=1, v01=10, v11=11
      const lat = 41.5;
      const lng = -73.5;
      const elevation = sampler.getElevation(lat, lng);

      // Bilinear interpolation with fx=0.5, fy=0.5:
      // result = 0*(1-0.5)*(1-0.5) + 1*0.5*(1-0.5) + 10*(1-0.5)*0.5 + 11*0.5*0.5
      // = 0*0.25 + 1*0.25 + 10*0.25 + 11*0.25 = (0+1+10+11)/4 = 5.5
      expect(elevation).toBeCloseTo(5.5, 5);
    });

    it('should return null for out-of-bounds coordinates', () => {
      const width = 2;
      const height = 2;
      const buffer = new ArrayBuffer(width * height * 2);
      const view = new DataView(buffer);

      view.setInt16(0 * 2, 100, true);
      view.setInt16(1 * 2, 100, true);
      view.setInt16(2 * 2, 100, true);
      view.setInt16(3 * 2, 100, true);

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

      const sampler = createDemSampler(metadata, buffer);

      // Test out of bounds
      expect(sampler.getElevation(39.0, -73.5)).toBeNull(); // lat too low
      expect(sampler.getElevation(42.0, -73.5)).toBeNull(); // lat too high
      expect(sampler.getElevation(40.5, -75.0)).toBeNull(); // lng too low
      expect(sampler.getElevation(40.5, -72.0)).toBeNull(); // lng too high
    });

    it('should handle nodata values correctly (all nodata)', () => {
      const width = 2;
      const height = 2;
      const nodata = -32768;
      const buffer = new ArrayBuffer(width * height * 2);
      const view = new DataView(buffer);

      // All values are nodata
      view.setInt16(0 * 2, nodata, true);
      view.setInt16(1 * 2, nodata, true);
      view.setInt16(2 * 2, nodata, true);
      view.setInt16(3 * 2, nodata, true);

      const metadata: DemMetadataV1 = {
        format: 'grid',
        units: 'meters',
        encoding: 'int16',
        width,
        height,
        nodata,
        bounds: {
          minLat: 40.0,
          minLng: -74.0,
          maxLat: 41.0,
          maxLng: -73.0,
        },
      };

      const sampler = createDemSampler(metadata, buffer);

      // Sample at center - should return null
      expect(sampler.getElevation(40.5, -73.5)).toBeNull();
    });

    it('should handle partial nodata values (fallback to average)', () => {
      const width = 2;
      const height = 2;
      const nodata = -32768;
      const buffer = new ArrayBuffer(width * height * 2);
      const view = new DataView(buffer);

      // Mix of valid and nodata values:
      // [100, nodata]
      // [nodata, 300]
      view.setInt16(0 * 2, 100, true);
      view.setInt16(1 * 2, nodata, true);
      view.setInt16(2 * 2, nodata, true);
      view.setInt16(3 * 2, 300, true);

      const metadata: DemMetadataV1 = {
        format: 'grid',
        units: 'meters',
        encoding: 'int16',
        width,
        height,
        nodata,
        bounds: {
          minLat: 40.0,
          minLng: -74.0,
          maxLat: 41.0,
          maxLng: -73.0,
        },
      };

      const sampler = createDemSampler(metadata, buffer);

      // Sample at center - should return average of valid values (100 + 300) / 2 = 200
      const elevation = sampler.getElevation(40.5, -73.5);
      expect(elevation).toBeCloseTo(200, 5);
    });
  });

  describe('Float32 encoding', () => {
    it('should sample exact cell values at corners (2x2 grid)', () => {
      const width = 2;
      const height = 2;
      const buffer = new ArrayBuffer(width * height * 4); // float32 = 4 bytes
      const view = new DataView(buffer);

      // Row 0: [0.5, 10.5]
      view.setFloat32(0 * 4, 0.5, true);
      view.setFloat32(1 * 4, 10.5, true);
      // Row 1: [20.5, 30.5]
      view.setFloat32(2 * 4, 20.5, true);
      view.setFloat32(3 * 4, 30.5, true);

      const metadata: DemMetadataV1 = {
        format: 'grid',
        units: 'meters',
        encoding: 'float32',
        width,
        height,
        nodata: -9999,
        bounds: {
          minLat: 40.0,
          minLng: -74.0,
          maxLat: 41.0,
          maxLng: -73.0,
        },
      };

      const sampler = createDemSampler(metadata, buffer);

      // Sample at corners
      expect(sampler.getElevation(41.0, -74.0)).toBeCloseTo(0.5, 5);
      expect(sampler.getElevation(41.0, -73.0)).toBeCloseTo(10.5, 5);
      expect(sampler.getElevation(40.0, -74.0)).toBeCloseTo(20.5, 5);
      expect(sampler.getElevation(40.0, -73.0)).toBeCloseTo(30.5, 5);
    });

    it('should perform bilinear interpolation (2x2 grid)', () => {
      const width = 2;
      const height = 2;
      const buffer = new ArrayBuffer(width * height * 4);
      const view = new DataView(buffer);

      view.setFloat32(0 * 4, 0.5, true);
      view.setFloat32(1 * 4, 10.5, true);
      view.setFloat32(2 * 4, 20.5, true);
      view.setFloat32(3 * 4, 30.5, true);

      const metadata: DemMetadataV1 = {
        format: 'grid',
        units: 'meters',
        encoding: 'float32',
        width,
        height,
        nodata: -9999,
        bounds: {
          minLat: 40.0,
          minLng: -74.0,
          maxLat: 41.0,
          maxLng: -73.0,
        },
      };

      const sampler = createDemSampler(metadata, buffer);

      // Sample at center: (0.5 + 10.5 + 20.5 + 30.5) / 4 = 15.5
      const elevation = sampler.getElevation(40.5, -73.5);
      expect(elevation).toBeCloseTo(15.5, 5);
    });

    it('should return null for out-of-bounds coordinates', () => {
      const width = 2;
      const height = 2;
      const buffer = new ArrayBuffer(width * height * 4);
      const view = new DataView(buffer);

      view.setFloat32(0 * 4, 100.0, true);
      view.setFloat32(1 * 4, 100.0, true);
      view.setFloat32(2 * 4, 100.0, true);
      view.setFloat32(3 * 4, 100.0, true);

      const metadata: DemMetadataV1 = {
        format: 'grid',
        units: 'meters',
        encoding: 'float32',
        width,
        height,
        nodata: -9999,
        bounds: {
          minLat: 40.0,
          minLng: -74.0,
          maxLat: 41.0,
          maxLng: -73.0,
        },
      };

      const sampler = createDemSampler(metadata, buffer);

      expect(sampler.getElevation(39.0, -73.5)).toBeNull();
      expect(sampler.getElevation(42.0, -73.5)).toBeNull();
      expect(sampler.getElevation(40.5, -75.0)).toBeNull();
      expect(sampler.getElevation(40.5, -72.0)).toBeNull();
    });
  });
});
