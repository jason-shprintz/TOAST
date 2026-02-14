/**
 * Tests for RegionRepository
 * @format
 */

// Mock SQLite before importing the repository
jest.mock('react-native-sqlite-storage', () => {
  let tables: Record<string, any[]> = {};
  let metaTable: Record<string, string> = {};

  const mockExecuteSql = jest.fn(
    async (sql: string, params?: Array<string | number | boolean | null>) => {
      const sqlLower = sql.toLowerCase().trim();

      // Handle CREATE TABLE
      if (sqlLower.includes('create table')) {
        if (sqlLower.includes('app_meta')) {
          metaTable = {};
        } else if (sqlLower.includes('offline_regions')) {
          tables.offline_regions = [];
        }
        return [{ rows: { length: 0, item: () => null } }];
      }

      // Handle SELECT from app_meta
      if (sqlLower.includes('select') && sqlLower.includes('app_meta')) {
        const key = params?.[0];
        if (key && metaTable[key as string]) {
          return [
            {
              rows: {
                length: 1,
                item: () => ({ value: metaTable[key as string] }),
              },
            },
          ];
        }
        return [{ rows: { length: 0, item: () => null } }];
      }

      // Handle INSERT OR REPLACE into app_meta
      if (
        sqlLower.includes('insert or replace') &&
        sqlLower.includes('app_meta')
      ) {
        const [key, value] = params || [];
        metaTable[key as string] = value as string;
        return [{ rows: { length: 0, item: () => null } }];
      }

      // Handle SELECT from offline_regions
      if (sqlLower.includes('select') && sqlLower.includes('offline_regions')) {
        let results = tables.offline_regions || [];

        // Filter by WHERE clauses
        if (sqlLower.includes('where id = ?')) {
          const id = params?.[0];
          results = results.filter((r) => r.id === id);
        } else if (sqlLower.includes('where status = ?')) {
          const status = params?.[0];
          results = results.filter((r) => r.status === status);
        }

        // Handle ORDER BY updated_at DESC
        if (sqlLower.includes('order by updated_at desc')) {
          results = [...results].sort((a, b) => {
            const dateA = new Date(a.updated_at).getTime();
            const dateB = new Date(b.updated_at).getTime();
            return dateB - dateA; // DESC order
          });
        }

        // Handle LIMIT
        if (sqlLower.includes('limit 1')) {
          results = results.slice(0, 1);
        }

        return [
          {
            rows: {
              length: results.length,
              item: (index: number) => results[index],
            },
          },
        ];
      }

      // Handle INSERT into offline_regions
      if (
        sqlLower.includes('insert into') &&
        sqlLower.includes('offline_regions')
      ) {
        const [
          id,
          center_lat,
          center_lng,
          radius_miles,
          created_at,
          updated_at,
          version,
          status,
          storage_size_mb,
          tiles_path,
          dem_path,
          region_json_path,
          water_path,
          cities_path,
          roads_path,
          index_path,
        ] = params || [];

        const newRow = {
          id,
          center_lat,
          center_lng,
          radius_miles,
          created_at,
          updated_at,
          version,
          status,
          storage_size_mb,
          tiles_path,
          dem_path,
          region_json_path,
          water_path,
          cities_path,
          roads_path,
          index_path,
        };

        if (!tables.offline_regions) {
          tables.offline_regions = [];
        }
        tables.offline_regions.push(newRow);
        return [{ rows: { length: 0, item: () => null } }];
      }

      // Handle UPDATE offline_regions
      if (sqlLower.includes('update') && sqlLower.includes('offline_regions')) {
        if (!tables.offline_regions) {
          tables.offline_regions = [];
        }

        if (sqlLower.includes('set status = ?')) {
          // Status update
          const [status, updated_at, id] = params || [];
          tables.offline_regions = tables.offline_regions.map((r) =>
            r.id === id ? { ...r, status, updated_at } : r,
          );
        } else {
          // Full update
          const [
            center_lat,
            center_lng,
            radius_miles,
            updated_at,
            version,
            status,
            storage_size_mb,
            tiles_path,
            dem_path,
            region_json_path,
            water_path,
            cities_path,
            roads_path,
            index_path,
            id,
          ] = params || [];

          tables.offline_regions = tables.offline_regions.map((r) =>
            r.id === id
              ? {
                  ...r,
                  center_lat,
                  center_lng,
                  radius_miles,
                  updated_at,
                  version,
                  status,
                  storage_size_mb,
                  tiles_path,
                  dem_path,
                  region_json_path,
                  water_path,
                  cities_path,
                  roads_path,
                  index_path,
                }
              : r,
          );
        }
        return [{ rows: { length: 0, item: () => null } }];
      }

      // Handle DELETE from offline_regions
      if (
        sqlLower.includes('delete from') &&
        sqlLower.includes('offline_regions')
      ) {
        const id = params?.[0];
        if (!tables.offline_regions) {
          tables.offline_regions = [];
        }
        tables.offline_regions = tables.offline_regions.filter(
          (r) => r.id !== id,
        );
        return [{ rows: { length: 0, item: () => null } }];
      }

      return [{ rows: { length: 0, item: () => null } }];
    },
  );

  const mockDatabase = {
    executeSql: mockExecuteSql,
    close: jest.fn(() => Promise.resolve()),
  };

  return {
    __esModule: true,
    default: {
      openDatabase: jest.fn(() => Promise.resolve(mockDatabase)),
      deleteDatabase: jest.fn(() => Promise.resolve()),
      enablePromise: jest.fn(),
    },
    openDatabase: jest.fn(() => Promise.resolve(mockDatabase)),
    deleteDatabase: jest.fn(() => Promise.resolve()),
    enablePromise: jest.fn(),
  };
});

import { createRegionRepository } from '../db/regionRepository';
import { OfflineRegion, OfflineRegionStatus } from '../types';

describe('RegionRepository', () => {
  let repository: ReturnType<typeof createRegionRepository>;

  beforeEach(async () => {
    repository = createRegionRepository();
    await repository.init();
  });

  describe('Initialization', () => {
    it('should initialize without errors', async () => {
      const newRepo = createRegionRepository();
      await expect(newRepo.init()).resolves.not.toThrow();
    });

    it('should not throw when calling init twice', async () => {
      await expect(repository.init()).resolves.not.toThrow();
      await expect(repository.init()).resolves.not.toThrow();
    });
  });

  describe('Create and Get', () => {
    const mockRegion: OfflineRegion = {
      id: 'test-region-1',
      centerLat: 40.7128,
      centerLng: -74.006,
      radiusMiles: 25,
      createdAt: '2026-02-14T00:00:00.000Z',
      updatedAt: '2026-02-14T00:00:00.000Z',
      version: 1,
      status: 'idle',
    };

    it('should create and retrieve a region', async () => {
      await repository.createRegion(mockRegion);
      const retrieved = await repository.getRegion(mockRegion.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(mockRegion.id);
      expect(retrieved?.centerLat).toBe(mockRegion.centerLat);
      expect(retrieved?.centerLng).toBe(mockRegion.centerLng);
      expect(retrieved?.radiusMiles).toBe(mockRegion.radiusMiles);
      expect(retrieved?.version).toBe(mockRegion.version);
      expect(retrieved?.status).toBe(mockRegion.status);
    });

    it('should set createdAt and updatedAt if missing', async () => {
      const regionWithoutTimestamps: OfflineRegion = {
        id: 'test-region-2',
        centerLat: 40.7128,
        centerLng: -74.006,
        radiusMiles: 25,
        createdAt: '',
        updatedAt: '',
        version: 1,
        status: 'idle',
      };

      await repository.createRegion(regionWithoutTimestamps);
      const retrieved = await repository.getRegion(regionWithoutTimestamps.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.createdAt).toBeTruthy();
      expect(retrieved?.updatedAt).toBeTruthy();
    });

    it('should fail to create region with duplicate id', async () => {
      await repository.createRegion(mockRegion);
      await expect(repository.createRegion(mockRegion)).rejects.toThrow(
        'already exists',
      );
    });

    it('should include region in listRegions', async () => {
      await repository.createRegion(mockRegion);
      const regions = await repository.listRegions();

      expect(regions).toHaveLength(1);
      expect(regions[0].id).toBe(mockRegion.id);
    });

    it('should handle optional fields', async () => {
      const regionWithOptionalFields: OfflineRegion = {
        ...mockRegion,
        id: 'test-region-3',
        storageSizeMB: 500,
        tilesPath: '/path/to/tiles',
        demPath: '/path/to/dem',
        regionJsonPath: '/path/to/region.json',
        waterPath: '/path/to/water',
        citiesPath: '/path/to/cities',
        roadsPath: '/path/to/roads',
        indexPath: '/path/to/index',
      };

      await repository.createRegion(regionWithOptionalFields);
      const retrieved = await repository.getRegion(regionWithOptionalFields.id);

      expect(retrieved?.storageSizeMB).toBe(500);
      expect(retrieved?.tilesPath).toBe('/path/to/tiles');
      expect(retrieved?.demPath).toBe('/path/to/dem');
      expect(retrieved?.regionJsonPath).toBe('/path/to/region.json');
      expect(retrieved?.waterPath).toBe('/path/to/water');
      expect(retrieved?.citiesPath).toBe('/path/to/cities');
      expect(retrieved?.roadsPath).toBe('/path/to/roads');
      expect(retrieved?.indexPath).toBe('/path/to/index');
    });
  });

  describe('Update', () => {
    const mockRegion: OfflineRegion = {
      id: 'test-region-update',
      centerLat: 40.7128,
      centerLng: -74.006,
      radiusMiles: 25,
      createdAt: '2026-02-14T00:00:00.000Z',
      updatedAt: '2026-02-14T00:00:00.000Z',
      version: 1,
      status: 'idle',
    };

    beforeEach(async () => {
      await repository.createRegion(mockRegion);
    });

    it('should update region fields', async () => {
      const updatedRegion: OfflineRegion = {
        ...mockRegion,
        centerLat: 41.0,
        centerLng: -75.0,
        radiusMiles: 30,
        version: 2,
        status: 'ready',
        storageSizeMB: 1000,
      };

      await repository.updateRegion(updatedRegion);
      const retrieved = await repository.getRegion(mockRegion.id);

      expect(retrieved?.centerLat).toBe(41.0);
      expect(retrieved?.centerLng).toBe(-75.0);
      expect(retrieved?.radiusMiles).toBe(30);
      expect(retrieved?.version).toBe(2);
      expect(retrieved?.status).toBe('ready');
      expect(retrieved?.storageSizeMB).toBe(1000);
    });

    it('should update updated_at timestamp', async () => {
      const originalUpdatedAt = mockRegion.updatedAt;

      // Wait a moment to ensure timestamp changes
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      await repository.updateRegion({ ...mockRegion, status: 'downloading' });
      const retrieved = await repository.getRegion(mockRegion.id);

      expect(retrieved?.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('Status Transitions', () => {
    const mockRegion: OfflineRegion = {
      id: 'test-region-status',
      centerLat: 40.7128,
      centerLng: -74.006,
      radiusMiles: 25,
      createdAt: '2026-02-14T00:00:00.000Z',
      updatedAt: '2026-02-14T00:00:00.000Z',
      version: 1,
      status: 'idle',
    };

    beforeEach(async () => {
      await repository.createRegion(mockRegion);
    });

    it('should update region status', async () => {
      await repository.updateRegionStatus(mockRegion.id, 'downloading');
      const retrieved = await repository.getRegion(mockRegion.id);

      expect(retrieved?.status).toBe('downloading');
    });

    it('should update updated_at when status changes', async () => {
      const originalUpdatedAt = mockRegion.updatedAt;

      // Wait a moment to ensure timestamp changes
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      await repository.updateRegionStatus(mockRegion.id, 'ready');
      const retrieved = await repository.getRegion(mockRegion.id);

      expect(retrieved?.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should reject invalid status', async () => {
      await expect(
        repository.updateRegionStatus(
          mockRegion.id,
          'invalid-status' as OfflineRegionStatus,
        ),
      ).rejects.toThrow('Invalid status');
    });

    it('should allow all valid status values', async () => {
      const validStatuses: OfflineRegionStatus[] = [
        'idle',
        'downloading',
        'ready',
        'error',
        'deleting',
      ];

      for (const status of validStatuses) {
        await repository.updateRegionStatus(mockRegion.id, status);
        const retrieved = await repository.getRegion(mockRegion.id);
        expect(retrieved?.status).toBe(status);
      }
    });
  });

  describe('Delete', () => {
    const mockRegion: OfflineRegion = {
      id: 'test-region-delete',
      centerLat: 40.7128,
      centerLng: -74.006,
      radiusMiles: 25,
      createdAt: '2026-02-14T00:00:00.000Z',
      updatedAt: '2026-02-14T00:00:00.000Z',
      version: 1,
      status: 'idle',
    };

    beforeEach(async () => {
      await repository.createRegion(mockRegion);
    });

    it('should delete a region', async () => {
      await repository.deleteRegion(mockRegion.id);
      const retrieved = await repository.getRegion(mockRegion.id);

      expect(retrieved).toBeNull();
    });

    it('should remove region from list', async () => {
      await repository.deleteRegion(mockRegion.id);
      const regions = await repository.listRegions();

      expect(regions).toHaveLength(0);
    });
  });

  describe('Get Active Region', () => {
    it('should return null when no ready regions exist', async () => {
      const activeRegion = await repository.getActiveRegion();
      expect(activeRegion).toBeNull();
    });

    it('should return the most recently updated ready region', async () => {
      const region1: OfflineRegion = {
        id: 'region-1',
        centerLat: 40.0,
        centerLng: -74.0,
        radiusMiles: 25,
        createdAt: '2026-02-14T00:00:00.000Z',
        updatedAt: '2026-02-14T00:00:00.000Z',
        version: 1,
        status: 'ready',
      };

      const region2: OfflineRegion = {
        id: 'region-2',
        centerLat: 41.0,
        centerLng: -75.0,
        radiusMiles: 25,
        createdAt: '2026-02-14T01:00:00.000Z',
        updatedAt: '2026-02-14T02:00:00.000Z',
        version: 1,
        status: 'ready',
      };

      await repository.createRegion(region1);
      await repository.createRegion(region2);

      const activeRegion = await repository.getActiveRegion();
      expect(activeRegion?.id).toBe('region-2');
    });

    it('should not return regions with other statuses', async () => {
      const idleRegion: OfflineRegion = {
        id: 'region-idle',
        centerLat: 40.0,
        centerLng: -74.0,
        radiusMiles: 25,
        createdAt: '2026-02-14T00:00:00.000Z',
        updatedAt: '2026-02-14T00:00:00.000Z',
        version: 1,
        status: 'idle',
      };

      const downloadingRegion: OfflineRegion = {
        id: 'region-downloading',
        centerLat: 41.0,
        centerLng: -75.0,
        radiusMiles: 25,
        createdAt: '2026-02-14T01:00:00.000Z',
        updatedAt: '2026-02-14T01:00:00.000Z',
        version: 1,
        status: 'downloading',
      };

      await repository.createRegion(idleRegion);
      await repository.createRegion(downloadingRegion);

      const activeRegion = await repository.getActiveRegion();
      expect(activeRegion).toBeNull();
    });
  });

  describe('List Regions', () => {
    it('should return empty array when no regions exist', async () => {
      const regions = await repository.listRegions();
      expect(regions).toEqual([]);
    });

    it('should return all regions ordered by updated_at DESC', async () => {
      const region1: OfflineRegion = {
        id: 'region-1',
        centerLat: 40.0,
        centerLng: -74.0,
        radiusMiles: 25,
        createdAt: '2026-02-14T00:00:00.000Z',
        updatedAt: '2026-02-14T00:00:00.000Z',
        version: 1,
        status: 'idle',
      };

      const region2: OfflineRegion = {
        id: 'region-2',
        centerLat: 41.0,
        centerLng: -75.0,
        radiusMiles: 25,
        createdAt: '2026-02-14T01:00:00.000Z',
        updatedAt: '2026-02-14T02:00:00.000Z',
        version: 1,
        status: 'ready',
      };

      const region3: OfflineRegion = {
        id: 'region-3',
        centerLat: 42.0,
        centerLng: -76.0,
        radiusMiles: 25,
        createdAt: '2026-02-14T02:00:00.000Z',
        updatedAt: '2026-02-14T01:00:00.000Z',
        version: 1,
        status: 'downloading',
      };

      await repository.createRegion(region1);
      await repository.createRegion(region2);
      await repository.createRegion(region3);

      const regions = await repository.listRegions();

      expect(regions).toHaveLength(3);
      // Most recent first (region-2)
      expect(regions[0].id).toBe('region-2');
    });
  });
});
