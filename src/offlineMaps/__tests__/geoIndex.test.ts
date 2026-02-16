/**
 * Tests for GeoIndex - offline spatial queries
 * @format
 */

import { distanceMeters } from '../geo/geoMath';
import {
  createGeoIndex,
  buildIndexFromOverlays,
  writeIndex,
} from '../geoIndex/geoIndex';
import {
  buildGridIndex,
  latLngToCellKey,
  getNeighboringCells,
} from '../geoIndex/gridIndex';
import type { MapFeatureRef } from '../geoIndex/geoIndexTypes';
import type { FileOps } from '../storage/fileOps';
import type { RegionPaths } from '../storage/paths';

// Mock file system
const mockFiles = new Map<string, string>();

const mockFileOps: FileOps = {
  async writeFileAtomic(path: string, data: string | Uint8Array) {
    const content =
      typeof data === 'string' ? data : String.fromCharCode(...data);
    mockFiles.set(path, content);
  },
  async readFile(path: string) {
    const content = mockFiles.get(path);
    if (!content) {
      throw new Error(`File not found: ${path}`);
    }
    return content;
  },
  async ensureDir(_path: string) {
    // No-op for mock
  },
  async exists(path: string) {
    return mockFiles.has(path);
  },
  async remove(path: string) {
    mockFiles.delete(path);
  },
  async moveAtomic(from: string, to: string) {
    const content = mockFiles.get(from);
    if (!content) {
      throw new Error(`File not found: ${from}`);
    }
    mockFiles.set(to, content);
    mockFiles.delete(from);
  },
  async listDir(_path: string) {
    return [];
  },
  async stat(path: string) {
    const content = mockFiles.get(path);
    if (!content) {
      throw new Error(`File not found: ${path}`);
    }
    return { size: content.length, isDirectory: false };
  },
};

const mockPaths: RegionPaths = {
  baseDir: '/mock/offline',
  regionsDir: '/mock/offline/regions',
  tmpDir: '/mock/offline/tmp',
  regionDir: (regionId: string) => `/mock/offline/regions/${regionId}`,
  tmpRegionDir: (regionId: string) => `/mock/offline/tmp/${regionId}`,
  regionJson: (regionId: string) =>
    `/mock/offline/regions/${regionId}/region.json`,
  tilesMbtiles: (regionId: string) =>
    `/mock/offline/regions/${regionId}/tiles.mbtiles`,
  dem: (regionId: string) => `/mock/offline/regions/${regionId}/elevation.dem`,
  water: (regionId: string) => `/mock/offline/regions/${regionId}/water.json`,
  cities: (regionId: string) => `/mock/offline/regions/${regionId}/cities.json`,
  roads: (regionId: string) => `/mock/offline/regions/${regionId}/roads.json`,
  index: (regionId: string) => `/mock/offline/regions/${regionId}/index.json`,
  manifest: (regionId: string) =>
    `/mock/offline/regions/${regionId}/manifest.json`,
  tmpRegionJson: (regionId: string) =>
    `/mock/offline/tmp/${regionId}/region.json`,
  tmpTilesMbtiles: (regionId: string) =>
    `/mock/offline/tmp/${regionId}/tiles.mbtiles`,
  tmpDem: (regionId: string) => `/mock/offline/tmp/${regionId}/elevation.dem`,
  tmpWater: (regionId: string) => `/mock/offline/tmp/${regionId}/water.json`,
  tmpCities: (regionId: string) => `/mock/offline/tmp/${regionId}/cities.json`,
  tmpRoads: (regionId: string) => `/mock/offline/tmp/${regionId}/roads.json`,
  tmpIndex: (regionId: string) => `/mock/offline/tmp/${regionId}/index.json`,
  tmpManifest: (regionId: string) =>
    `/mock/offline/tmp/${regionId}/manifest.json`,
};

describe('GeoIndex', () => {
  beforeEach(() => {
    mockFiles.clear();
  });

  describe('Grid Index', () => {
    it('should convert lat/lng to cell key consistently', () => {
      const cfg = { cellSizeMeters: 500 };
      const key1 = latLngToCellKey(36.1699, -115.1398, cfg);
      const key2 = latLngToCellKey(36.1699, -115.1398, cfg);

      expect(key1.key).toBe(key2.key);
      expect(key1.cx).toBe(key2.cx);
      expect(key1.cy).toBe(key2.cy);
    });

    it('should generate correct neighboring cells', () => {
      const cells = getNeighboringCells(0, 0, 1);
      // Ring 1 should have 8 neighbors
      expect(cells.length).toBe(8);
      expect(cells).toContain('-1:-1');
      expect(cells).toContain('0:-1');
      expect(cells).toContain('1:-1');
      expect(cells).toContain('-1:0');
      expect(cells).toContain('1:0');
      expect(cells).toContain('-1:1');
      expect(cells).toContain('0:1');
      expect(cells).toContain('1:1');
    });

    it('should build grid index from features', () => {
      const features: MapFeatureRef[] = [
        {
          kind: 'city',
          id: 'c1',
          name: 'Las Vegas',
          lat: 36.1699,
          lng: -115.1398,
        },
        {
          kind: 'city',
          id: 'c2',
          name: 'Henderson',
          lat: 36.0397,
          lng: -114.9819,
        },
      ];

      const cfg = { cellSizeMeters: 500 };
      const index = buildGridIndex(features, cfg);

      expect(index.cfg.cellSizeMeters).toBe(500);
      expect(Object.keys(index.cells).length).toBeGreaterThan(0);

      // Each feature should be in some cell
      let foundFeatures = 0;
      for (const cellFeatures of Object.values(index.cells)) {
        foundFeatures += cellFeatures.length;
      }
      expect(foundFeatures).toBe(2);
    });
  });

  describe('Nearest Queries', () => {
    it('should find nearest city', async () => {
      const features: MapFeatureRef[] = [
        {
          kind: 'city',
          id: 'c1',
          name: 'Las Vegas',
          lat: 36.1699,
          lng: -115.1398,
        },
        {
          kind: 'city',
          id: 'c2',
          name: 'Henderson',
          lat: 36.0397,
          lng: -114.9819,
        },
      ];

      const cfg = { cellSizeMeters: 500 };
      const gridIndex = buildGridIndex(features, cfg);

      // Write and load index
      await writeIndex('test-region', gridIndex, mockPaths, mockFileOps);

      const indexPath = mockPaths.index('test-region');
      const tmpIndexPath = mockPaths.tmpIndex('test-region');
      mockFiles.set(indexPath, mockFiles.get(tmpIndexPath)!);

      const geoIndex = createGeoIndex(mockPaths, mockFileOps);
      await geoIndex.load('test-region');

      // Query near Las Vegas
      const nearest = geoIndex.nearestCity(36.17, -115.14);

      expect(nearest).not.toBeNull();
      expect(nearest?.id).toBe('c1');
      expect(nearest?.name).toBe('Las Vegas');
    });

    it('should find nearest water', async () => {
      const features: MapFeatureRef[] = [
        {
          kind: 'water',
          id: 'w1',
          name: 'Lake Mead',
          lat: 36.1468,
          lng: -114.4471,
        },
        {
          kind: 'water',
          id: 'w2',
          name: 'Colorado River',
          lat: 36.0,
          lng: -114.5,
        },
      ];

      const cfg = { cellSizeMeters: 500 };
      const gridIndex = buildGridIndex(features, cfg);

      await writeIndex('test-region', gridIndex, mockPaths, mockFileOps);

      const indexPath = mockPaths.index('test-region');
      const tmpIndexPath = mockPaths.tmpIndex('test-region');
      mockFiles.set(indexPath, mockFiles.get(tmpIndexPath)!);

      const geoIndex = createGeoIndex(mockPaths, mockFileOps);
      await geoIndex.load('test-region');

      // Query near Lake Mead
      const nearest = geoIndex.nearestWater(36.15, -114.45);

      expect(nearest).not.toBeNull();
      expect(nearest?.id).toBe('w1');
      expect(nearest?.name).toBe('Lake Mead');
    });

    it('should find feature in neighboring cell', async () => {
      const features: MapFeatureRef[] = [
        {
          kind: 'city',
          id: 'c1',
          name: 'Distant City',
          lat: 36.2,
          lng: -115.2,
        },
      ];

      const cfg = { cellSizeMeters: 500 };
      const gridIndex = buildGridIndex(features, cfg);

      await writeIndex('test-region', gridIndex, mockPaths, mockFileOps);

      const indexPath = mockPaths.index('test-region');
      const tmpIndexPath = mockPaths.tmpIndex('test-region');
      mockFiles.set(indexPath, mockFiles.get(tmpIndexPath)!);

      const geoIndex = createGeoIndex(mockPaths, mockFileOps);
      await geoIndex.load('test-region');

      // Query from empty cell - should still find via ring expansion
      const nearest = geoIndex.nearestCity(36.1, -115.1);

      expect(nearest).not.toBeNull();
      expect(nearest?.id).toBe('c1');
    });
  });

  describe('Features At Point', () => {
    it('should find point within tolerance', async () => {
      const features: MapFeatureRef[] = [
        {
          kind: 'city',
          id: 'c1',
          name: 'Close City',
          lat: 36.1699,
          lng: -115.1398,
          geometry: {
            kind: 'Point',
            coordinates: [-115.1398, 36.1699],
          },
        },
        {
          kind: 'city',
          id: 'c2',
          name: 'Far City',
          lat: 36.5,
          lng: -115.5,
          geometry: {
            kind: 'Point',
            coordinates: [-115.5, 36.5],
          },
        },
      ];

      const cfg = { cellSizeMeters: 500 };
      const gridIndex = buildGridIndex(features, cfg);

      await writeIndex('test-region', gridIndex, mockPaths, mockFileOps);

      const indexPath = mockPaths.index('test-region');
      const tmpIndexPath = mockPaths.tmpIndex('test-region');
      mockFiles.set(indexPath, mockFiles.get(tmpIndexPath)!);

      const geoIndex = createGeoIndex(mockPaths, mockFileOps);
      await geoIndex.load('test-region');

      // Query with 1km tolerance
      const results = geoIndex.featuresAtPoint(36.17, -115.14, 1000);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('c1');
    });

    it('should exclude points outside tolerance', async () => {
      const features: MapFeatureRef[] = [
        {
          kind: 'city',
          id: 'c1',
          name: 'Far City',
          lat: 36.5,
          lng: -115.5,
          geometry: {
            kind: 'Point',
            coordinates: [-115.5, 36.5],
          },
        },
      ];

      const cfg = { cellSizeMeters: 500 };
      const gridIndex = buildGridIndex(features, cfg);

      await writeIndex('test-region', gridIndex, mockPaths, mockFileOps);

      const indexPath = mockPaths.index('test-region');
      const tmpIndexPath = mockPaths.tmpIndex('test-region');
      mockFiles.set(indexPath, mockFiles.get(tmpIndexPath)!);

      const geoIndex = createGeoIndex(mockPaths, mockFileOps);
      await geoIndex.load('test-region');

      // Query far from the city with small tolerance
      const results = geoIndex.featuresAtPoint(36.17, -115.14, 100);

      expect(results.length).toBe(0);
    });

    it('should sort results by distance', async () => {
      const features: MapFeatureRef[] = [
        {
          kind: 'city',
          id: 'c1',
          name: 'Far',
          lat: 36.2,
          lng: -115.2,
          geometry: {
            kind: 'Point',
            coordinates: [-115.2, 36.2],
          },
        },
        {
          kind: 'city',
          id: 'c2',
          name: 'Close',
          lat: 36.171,
          lng: -115.141,
          geometry: {
            kind: 'Point',
            coordinates: [-115.141, 36.171],
          },
        },
        {
          kind: 'city',
          id: 'c3',
          name: 'Medium',
          lat: 36.18,
          lng: -115.15,
          geometry: {
            kind: 'Point',
            coordinates: [-115.15, 36.18],
          },
        },
      ];

      const cfg = { cellSizeMeters: 500 };
      const gridIndex = buildGridIndex(features, cfg);

      await writeIndex('test-region', gridIndex, mockPaths, mockFileOps);

      const indexPath = mockPaths.index('test-region');
      const tmpIndexPath = mockPaths.tmpIndex('test-region');
      mockFiles.set(indexPath, mockFiles.get(tmpIndexPath)!);

      const geoIndex = createGeoIndex(mockPaths, mockFileOps);
      await geoIndex.load('test-region');

      // Query with large tolerance to get all features
      const results = geoIndex.featuresAtPoint(36.17, -115.14, 10000);

      expect(results.length).toBe(3);
      // Results should be sorted by distance
      expect(results[0].id).toBe('c2'); // Close
      expect(results[1].id).toBe('c3'); // Medium
      expect(results[2].id).toBe('c1'); // Far
    });
  });

  describe('Index Persistence', () => {
    it('should write and load index correctly', async () => {
      const features: MapFeatureRef[] = [
        {
          kind: 'city',
          id: 'c1',
          name: 'Test City',
          lat: 36.1699,
          lng: -115.1398,
        },
      ];

      const cfg = { cellSizeMeters: 500 };
      const gridIndex = buildGridIndex(features, cfg);

      // Write index
      await writeIndex('test-region', gridIndex, mockPaths, mockFileOps);

      const tmpIndexPath = mockPaths.tmpIndex('test-region');
      expect(mockFiles.has(tmpIndexPath)).toBe(true);

      // Parse written index
      const indexContent = mockFiles.get(tmpIndexPath)!;
      const indexJson = JSON.parse(indexContent);

      expect(indexJson.schemaVersion).toBe(1);
      expect(indexJson.regionId).toBe('test-region');
      expect(indexJson.cellSizeMeters).toBe(500);
      expect(indexJson.cells).toBeDefined();
      expect(typeof indexJson.generatedAt).toBe('string');

      // Load index
      const indexPath = mockPaths.index('test-region');
      mockFiles.set(indexPath, indexContent);

      const geoIndex = createGeoIndex(mockPaths, mockFileOps);
      await geoIndex.load('test-region');

      // Verify queries work after loading
      const nearest = geoIndex.nearestCity(36.17, -115.14);
      expect(nearest).not.toBeNull();
      expect(nearest?.id).toBe('c1');
    });

    it('should throw error if index does not exist', async () => {
      const geoIndex = createGeoIndex(mockPaths, mockFileOps);

      await expect(geoIndex.load('nonexistent-region')).rejects.toThrow(
        'Index not found',
      );
    });
  });

  describe('Distance Calculations', () => {
    it('should calculate distance correctly', () => {
      // Distance between Las Vegas and Henderson (approx 16-22 km)
      const dist = distanceMeters(36.1699, -115.1398, 36.0397, -114.9819);

      expect(dist).toBeGreaterThan(15000);
      expect(dist).toBeLessThan(22000);
    });

    it('should handle same point', () => {
      const dist = distanceMeters(36.1699, -115.1398, 36.1699, -115.1398);

      expect(dist).toBe(0);
    });
  });

  describe('Building Index From Overlays', () => {
    it('should handle empty overlays gracefully', async () => {
      const cfg = { cellSizeMeters: 500 };
      const gridIndex = await buildIndexFromOverlays(
        'empty-region',
        mockPaths,
        mockFileOps,
        cfg,
      );

      expect(gridIndex.cfg.cellSizeMeters).toBe(500);
      expect(Object.keys(gridIndex.cells).length).toBe(0);
    });

    it('should transform water features correctly', async () => {
      const waterData = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        regionId: 'test-region',
        features: [
          {
            id: 'w1',
            type: 'river' as const,
            geometry: {
              kind: 'Point' as const,
              coordinates: [-115.1398, 36.1699],
            },
            properties: {
              name: 'Test River',
              isSeasonal: false,
            },
          },
        ],
      };

      mockFiles.set(
        mockPaths.tmpWater('test-region'),
        JSON.stringify(waterData),
      );

      const cfg = { cellSizeMeters: 500 };
      const gridIndex = await buildIndexFromOverlays(
        'test-region',
        mockPaths,
        mockFileOps,
        cfg,
      );

      let foundFeatures = 0;
      let waterFeature: MapFeatureRef | undefined;
      for (const cellFeatures of Object.values(gridIndex.cells)) {
        for (const feature of cellFeatures) {
          if (feature.kind === 'water') {
            waterFeature = feature;
            foundFeatures++;
          }
        }
      }

      expect(foundFeatures).toBe(1);
      expect(waterFeature).toBeDefined();
      expect(waterFeature?.id).toBe('w1');
      expect(waterFeature?.name).toBe('Test River');
      expect(waterFeature?.kind).toBe('water');
    });

    it('should transform city features correctly', async () => {
      const citiesData = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        regionId: 'test-region',
        features: [
          {
            id: 'c1',
            geometry: {
              kind: 'Point' as const,
              coordinates: [-115.1398, 36.1699],
            },
            properties: {
              name: 'Test City',
              populationTier: 'medium' as const,
              population: 50000,
            },
          },
        ],
      };

      mockFiles.set(
        mockPaths.tmpCities('test-region'),
        JSON.stringify(citiesData),
      );

      const cfg = { cellSizeMeters: 500 };
      const gridIndex = await buildIndexFromOverlays(
        'test-region',
        mockPaths,
        mockFileOps,
        cfg,
      );

      let foundFeatures = 0;
      let cityFeature: MapFeatureRef | undefined;
      for (const cellFeatures of Object.values(gridIndex.cells)) {
        for (const feature of cellFeatures) {
          if (feature.kind === 'city') {
            cityFeature = feature;
            foundFeatures++;
          }
        }
      }

      expect(foundFeatures).toBe(1);
      expect(cityFeature).toBeDefined();
      expect(cityFeature?.id).toBe('c1');
      expect(cityFeature?.name).toBe('Test City');
      expect(cityFeature?.kind).toBe('city');
    });
  });
});
