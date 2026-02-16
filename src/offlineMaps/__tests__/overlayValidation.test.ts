/**
 * Tests for overlay validation and phase handler
 * @format
 */

import { createOverlayPhaseHandler } from '../overlays/overlayPhaseHandler';
import { SyntheticOverlayProvider } from '../overlays/overlayProvider';
import {
  parseWaterCollection,
  parseCityCollection,
  parseRoadCollection,
  WATER_SCHEMA_VERSION,
  CITY_SCHEMA_VERSION,
  ROAD_SCHEMA_VERSION,
} from '../schemas';
import type { PhaseHandlerContext } from '../download/downloadTypes';
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
    return {
      size: content.length,
      isDirectory: false,
    };
  },
};

const mockPaths: RegionPaths = {
  baseDir: '/test/offline',
  regionsDir: '/test/offline/regions',
  tmpDir: '/test/offline/tmp',
  regionDir: (regionId: string) => `/test/offline/regions/${regionId}`,
  tmpRegionDir: (regionId: string) => `/test/offline/tmp/${regionId}`,
  regionJson: (regionId: string) =>
    `/test/offline/regions/${regionId}/region.json`,
  tilesMbtiles: (regionId: string) =>
    `/test/offline/regions/${regionId}/tiles.mbtiles`,
  dem: (regionId: string) => `/test/offline/regions/${regionId}/elevation.dem`,
  water: (regionId: string) => `/test/offline/regions/${regionId}/water.json`,
  cities: (regionId: string) => `/test/offline/regions/${regionId}/cities.json`,
  roads: (regionId: string) => `/test/offline/regions/${regionId}/roads.json`,
  index: (regionId: string) => `/test/offline/regions/${regionId}/index.sqlite`,
  manifest: (regionId: string) =>
    `/test/offline/regions/${regionId}/manifest.json`,
  tmpRegionJson: (regionId: string) =>
    `/test/offline/tmp/${regionId}/region.json`,
  tmpTilesMbtiles: (regionId: string) =>
    `/test/offline/tmp/${regionId}/tiles.mbtiles`,
  tmpDem: (regionId: string) => `/test/offline/tmp/${regionId}/elevation.dem`,
  tmpWater: (regionId: string) => `/test/offline/tmp/${regionId}/water.json`,
  tmpCities: (regionId: string) => `/test/offline/tmp/${regionId}/cities.json`,
  tmpRoads: (regionId: string) => `/test/offline/tmp/${regionId}/roads.json`,
  tmpIndex: (regionId: string) => `/test/offline/tmp/${regionId}/index.sqlite`,
  tmpManifest: (regionId: string) =>
    `/test/offline/tmp/${regionId}/manifest.json`,
};

describe('Overlay Validation', () => {
  beforeEach(() => {
    mockFiles.clear();
  });

  describe('Valid overlay collections', () => {
    it('should validate and write a valid water collection', async () => {
      const regionId = 'test-region-1';
      const bounds = {
        minLat: 40.0,
        minLng: -75.0,
        maxLat: 41.0,
        maxLng: -74.0,
      };

      // Setup region.json
      const regionJson = {
        schemaVersion: 1,
        generatedAt: '2026-02-16T00:00:00.000Z',
        regionId,
        center: { lat: 40.5, lng: -74.5 },
        radiusMiles: 25,
        bounds,
        tiles: { format: 'mbtiles', minZoom: 8, maxZoom: 14 },
        dem: {
          format: 'grid',
          units: 'meters',
          encoding: 'int16',
          width: 100,
          height: 100,
          nodata: -9999,
          bounds,
        },
      };
      mockFiles.set(
        mockPaths.tmpRegionJson(regionId),
        JSON.stringify(regionJson),
      );

      // Create handler with synthetic provider
      const provider = new SyntheticOverlayProvider();
      const handler = createOverlayPhaseHandler({
        paths: mockPaths,
        fileOps: mockFileOps,
        provider,
        validate: {
          water: parseWaterCollection,
          cities: parseCityCollection,
          roads: parseRoadCollection,
        },
      });

      // Create mock context
      const progressReports: Array<{
        phase: string;
        percent?: number;
        message?: string;
      }> = [];
      const ctx: PhaseHandlerContext = {
        jobId: 'job-1',
        regionId,
        report: async (progress) => {
          progressReports.push({
            phase: progress.phase || '',
            percent: progress.percent,
            message: progress.message,
          });
        },
        isCancelled: () => false,
        isPaused: () => false,
      };

      // Execute handler
      await handler(ctx);

      // Verify water.json was written
      const waterJson = mockFiles.get(mockPaths.tmpWater(regionId));
      expect(waterJson).toBeDefined();

      // Parse and validate
      const waterData = parseWaterCollection(JSON.parse(waterJson!));
      expect(waterData.schemaVersion).toBe(WATER_SCHEMA_VERSION);
      expect(waterData.regionId).toBe(regionId);
      expect(waterData.features.length).toBeGreaterThan(0);

      // Verify progress reports
      expect(progressReports.length).toBeGreaterThan(0);
      expect(progressReports.some((r) => r.message?.includes('water'))).toBe(
        true,
      );
      expect(progressReports.some((r) => r.percent === 100)).toBe(true);
    });

    it('should validate and write cities and roads collections', async () => {
      const regionId = 'test-region-2';
      const bounds = {
        minLat: 35.0,
        minLng: -120.0,
        maxLat: 36.0,
        maxLng: -119.0,
      };

      // Setup region.json
      const regionJson = {
        schemaVersion: 1,
        generatedAt: '2026-02-16T00:00:00.000Z',
        regionId,
        center: { lat: 35.5, lng: -119.5 },
        radiusMiles: 30,
        bounds,
        tiles: { format: 'mbtiles', minZoom: 8, maxZoom: 14 },
        dem: {
          format: 'grid',
          units: 'meters',
          encoding: 'int16',
          width: 100,
          height: 100,
          nodata: -9999,
          bounds,
        },
      };
      mockFiles.set(
        mockPaths.tmpRegionJson(regionId),
        JSON.stringify(regionJson),
      );

      // Create handler
      const provider = new SyntheticOverlayProvider();
      const handler = createOverlayPhaseHandler({
        paths: mockPaths,
        fileOps: mockFileOps,
        provider,
        validate: {
          water: parseWaterCollection,
          cities: parseCityCollection,
          roads: parseRoadCollection,
        },
      });

      // Create mock context
      const ctx: PhaseHandlerContext = {
        jobId: 'job-2',
        regionId,
        report: async () => {},
        isCancelled: () => false,
        isPaused: () => false,
      };

      // Execute handler
      await handler(ctx);

      // Verify cities.json
      const citiesJson = mockFiles.get(mockPaths.tmpCities(regionId));
      expect(citiesJson).toBeDefined();
      const citiesData = parseCityCollection(JSON.parse(citiesJson!));
      expect(citiesData.schemaVersion).toBe(CITY_SCHEMA_VERSION);
      expect(citiesData.features.length).toBeGreaterThan(0);

      // Verify roads.json
      const roadsJson = mockFiles.get(mockPaths.tmpRoads(regionId));
      expect(roadsJson).toBeDefined();
      const roadsData = parseRoadCollection(JSON.parse(roadsJson!));
      expect(roadsData.schemaVersion).toBe(ROAD_SCHEMA_VERSION);
      expect(roadsData.features.length).toBeGreaterThan(0);
    });
  });

  describe('Invalid overlay collections', () => {
    it('should throw on invalid city overlay (bad populationTier)', async () => {
      const invalidCityData = {
        schemaVersion: CITY_SCHEMA_VERSION,
        generatedAt: '2026-02-16T00:00:00.000Z',
        regionId: 'test-region',
        features: [
          {
            id: 'city-1',
            geometry: {
              kind: 'Point',
              coordinates: [-74.0, 40.7],
            },
            properties: {
              name: 'Test City',
              populationTier: 'extra-large', // Invalid tier
              population: 1000000,
            },
          },
        ],
      };

      expect(() => parseCityCollection(invalidCityData)).toThrow();
    });

    it('should throw on invalid road overlay (bad geometry kind)', async () => {
      const invalidRoadData = {
        schemaVersion: ROAD_SCHEMA_VERSION,
        generatedAt: '2026-02-16T00:00:00.000Z',
        regionId: 'test-region',
        features: [
          {
            id: 'road-1',
            geometry: {
              kind: 'Point', // Should be LineString
              coordinates: [-74.0, 40.7],
            },
            properties: {
              class: 'highway',
            },
          },
        ],
      };

      expect(() => parseRoadCollection(invalidRoadData)).toThrow();
    });
  });

  describe('Pause and cancel behavior', () => {
    it('should return early when paused before second overlay', async () => {
      const regionId = 'test-region-3';
      const bounds = {
        minLat: 45.0,
        minLng: -95.0,
        maxLat: 46.0,
        maxLng: -94.0,
      };

      // Setup region.json
      const regionJson = {
        schemaVersion: 1,
        generatedAt: '2026-02-16T00:00:00.000Z',
        regionId,
        center: { lat: 45.5, lng: -94.5 },
        radiusMiles: 20,
        bounds,
        tiles: { format: 'mbtiles', minZoom: 8, maxZoom: 14 },
        dem: {
          format: 'grid',
          units: 'meters',
          encoding: 'int16',
          width: 100,
          height: 100,
          nodata: -9999,
          bounds,
        },
      };
      mockFiles.set(
        mockPaths.tmpRegionJson(regionId),
        JSON.stringify(regionJson),
      );

      // Create provider that delays
      let callCount = 0;
      const delayedProvider = new SyntheticOverlayProvider();
      const originalFetch = delayedProvider.fetchOverlay.bind(delayedProvider);
      delayedProvider.fetchOverlay = async (kind, req, opts) => {
        callCount++;
        return originalFetch(kind, req, opts);
      };

      // Create handler
      const handler = createOverlayPhaseHandler({
        paths: mockPaths,
        fileOps: mockFileOps,
        provider: delayedProvider,
        validate: {
          water: parseWaterCollection,
          cities: parseCityCollection,
          roads: parseRoadCollection,
        },
      });

      // Create context that pauses after first overlay
      let isPaused = false;
      const ctx: PhaseHandlerContext = {
        jobId: 'job-3',
        regionId,
        report: async () => {},
        isCancelled: () => false,
        isPaused: () => {
          // Pause after first overlay fetch completes
          if (callCount >= 1) {
            isPaused = true;
          }
          return isPaused;
        },
      };

      // Execute handler - should return early
      await handler(ctx);

      // Verify only water was written (first overlay)
      expect(mockFiles.has(mockPaths.tmpWater(regionId))).toBe(true);
      expect(mockFiles.has(mockPaths.tmpCities(regionId))).toBe(false);
      expect(mockFiles.has(mockPaths.tmpRoads(regionId))).toBe(false);
    });

    it('should throw on cancel', async () => {
      const regionId = 'test-region-4';
      const bounds = {
        minLat: 50.0,
        minLng: -100.0,
        maxLat: 51.0,
        maxLng: -99.0,
      };

      // Setup region.json
      const regionJson = {
        schemaVersion: 1,
        generatedAt: '2026-02-16T00:00:00.000Z',
        regionId,
        center: { lat: 50.5, lng: -99.5 },
        radiusMiles: 15,
        bounds,
        tiles: { format: 'mbtiles', minZoom: 8, maxZoom: 14 },
        dem: {
          format: 'grid',
          units: 'meters',
          encoding: 'int16',
          width: 100,
          height: 100,
          nodata: -9999,
          bounds,
        },
      };
      mockFiles.set(
        mockPaths.tmpRegionJson(regionId),
        JSON.stringify(regionJson),
      );

      // Create handler
      const provider = new SyntheticOverlayProvider();
      const handler = createOverlayPhaseHandler({
        paths: mockPaths,
        fileOps: mockFileOps,
        provider,
        validate: {
          water: parseWaterCollection,
          cities: parseCityCollection,
          roads: parseRoadCollection,
        },
      });

      // Create context that is cancelled
      const ctx: PhaseHandlerContext = {
        jobId: 'job-4',
        regionId,
        report: async () => {},
        isCancelled: () => true,
        isPaused: () => false,
      };

      // Execute handler - should throw
      await expect(handler(ctx)).rejects.toEqual({ code: 'CANCELLED' });
    });
  });
});
