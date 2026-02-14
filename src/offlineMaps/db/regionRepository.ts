/**
 * Repository layer for offline region persistence
 * @format
 */

import { SQLiteDatabase } from '../../types/database-types';
import { OfflineRegion, OfflineRegionStatus } from '../types';
import { runMigrations } from './migrations';
import { OFFLINE_REGIONS_TABLE_NAME } from './schema';

let SQLite: any;
try {
  SQLite = require('react-native-sqlite-storage');
} catch {
  SQLite = null as any;
}

const VALID_STATUSES: OfflineRegionStatus[] = [
  'idle',
  'downloading',
  'ready',
  'error',
  'deleting',
];

/**
 * Validate that a status is a valid OfflineRegionStatus
 */
function validateStatus(status: string): asserts status is OfflineRegionStatus {
  if (!VALID_STATUSES.includes(status as OfflineRegionStatus)) {
    throw new Error(
      `Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}`,
    );
  }
}

/**
 * Map database row to OfflineRegion object
 */
function mapRowToRegion(row: any): OfflineRegion {
  return {
    id: row.id,
    centerLat: row.center_lat,
    centerLng: row.center_lng,
    radiusMiles: row.radius_miles,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
    status: row.status,
    storageSizeMB: row.storage_size_mb ?? undefined,
    tilesPath: row.tiles_path ?? undefined,
    demPath: row.dem_path ?? undefined,
    regionJsonPath: row.region_json_path ?? undefined,
    waterPath: row.water_path ?? undefined,
    citiesPath: row.cities_path ?? undefined,
    roadsPath: row.roads_path ?? undefined,
    indexPath: row.index_path ?? undefined,
  };
}

/**
 * RegionRepository interface
 */
export interface RegionRepository {
  init(): Promise<void>;
  getActiveRegion(): Promise<OfflineRegion | null>;
  getRegion(id: string): Promise<OfflineRegion | null>;
  listRegions(): Promise<OfflineRegion[]>;
  createRegion(region: OfflineRegion): Promise<void>;
  updateRegion(region: OfflineRegion): Promise<void>;
  updateRegionStatus(id: string, status: OfflineRegionStatus): Promise<void>;
  deleteRegion(id: string): Promise<void>;
}

/**
 * Create a new region repository instance
 */
export function createRegionRepository(): RegionRepository {
  let db: SQLiteDatabase | null = null;

  return {
    async init(): Promise<void> {
      if (db || !SQLite) {
        return;
      }

      try {
        SQLite.enablePromise?.(true);
        db = await SQLite.openDatabase({
          name: 'offline_regions.db',
          location: 'default',
        });

        if (db) {
          await runMigrations(db);
        }
      } catch (e) {
        console.error('Failed to initialize offline regions database', e);
        db = null;
      }
    },

    async getActiveRegion(): Promise<OfflineRegion | null> {
      if (!db) {
        return null;
      }

      try {
        const result = await db.executeSql(
          `SELECT * FROM ${OFFLINE_REGIONS_TABLE_NAME} WHERE status = ? ORDER BY updated_at DESC LIMIT 1`,
          ['ready'],
        );

        if (result[0].rows.length > 0) {
          return mapRowToRegion(result[0].rows.item(0));
        }

        return null;
      } catch (e) {
        console.error('Failed to get active region', e);
        return null;
      }
    },

    async getRegion(id: string): Promise<OfflineRegion | null> {
      if (!db) {
        return null;
      }

      try {
        const result = await db.executeSql(
          `SELECT * FROM ${OFFLINE_REGIONS_TABLE_NAME} WHERE id = ?`,
          [id],
        );

        if (result[0].rows.length > 0) {
          return mapRowToRegion(result[0].rows.item(0));
        }

        return null;
      } catch (e) {
        console.error('Failed to get region', e);
        return null;
      }
    },

    async listRegions(): Promise<OfflineRegion[]> {
      if (!db) {
        return [];
      }

      try {
        const result = await db.executeSql(
          `SELECT * FROM ${OFFLINE_REGIONS_TABLE_NAME} ORDER BY updated_at DESC`,
        );

        const regions: OfflineRegion[] = [];
        for (let i = 0; i < result[0].rows.length; i++) {
          regions.push(mapRowToRegion(result[0].rows.item(i)));
        }

        return regions;
      } catch (e) {
        console.error('Failed to list regions', e);
        return [];
      }
    },

    async createRegion(region: OfflineRegion): Promise<void> {
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Validate status
      validateStatus(region.status);

      // Set timestamps if missing
      const now = new Date().toISOString();
      const createdAt = region.createdAt || now;
      const updatedAt = region.updatedAt || now;

      // Check if region already exists
      const existing = await this.getRegion(region.id);
      if (existing) {
        throw new Error(`Region with id ${region.id} already exists`);
      }

      try {
        await db.executeSql(
          `INSERT INTO ${OFFLINE_REGIONS_TABLE_NAME} (
            id, center_lat, center_lng, radius_miles,
            created_at, updated_at, version, status,
            storage_size_mb, tiles_path, dem_path, region_json_path,
            water_path, cities_path, roads_path, index_path
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            region.id,
            region.centerLat,
            region.centerLng,
            region.radiusMiles,
            createdAt,
            updatedAt,
            region.version,
            region.status,
            region.storageSizeMB ?? null,
            region.tilesPath ?? null,
            region.demPath ?? null,
            region.regionJsonPath ?? null,
            region.waterPath ?? null,
            region.citiesPath ?? null,
            region.roadsPath ?? null,
            region.indexPath ?? null,
          ],
        );
      } catch (e) {
        console.error('Failed to create region', e);
        throw e;
      }
    },

    async updateRegion(region: OfflineRegion): Promise<void> {
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Validate status
      validateStatus(region.status);

      // Update the updated_at timestamp
      const updatedAt = new Date().toISOString();

      try {
        await db.executeSql(
          `UPDATE ${OFFLINE_REGIONS_TABLE_NAME} SET
            center_lat = ?, center_lng = ?, radius_miles = ?,
            updated_at = ?, version = ?, status = ?,
            storage_size_mb = ?, tiles_path = ?, dem_path = ?,
            region_json_path = ?, water_path = ?, cities_path = ?,
            roads_path = ?, index_path = ?
          WHERE id = ?`,
          [
            region.centerLat,
            region.centerLng,
            region.radiusMiles,
            updatedAt,
            region.version,
            region.status,
            region.storageSizeMB ?? null,
            region.tilesPath ?? null,
            region.demPath ?? null,
            region.regionJsonPath ?? null,
            region.waterPath ?? null,
            region.citiesPath ?? null,
            region.roadsPath ?? null,
            region.indexPath ?? null,
            region.id,
          ],
        );
      } catch (e) {
        console.error('Failed to update region', e);
        throw e;
      }
    },

    async updateRegionStatus(
      id: string,
      status: OfflineRegionStatus,
    ): Promise<void> {
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Validate status
      validateStatus(status);

      const updatedAt = new Date().toISOString();

      try {
        await db.executeSql(
          `UPDATE ${OFFLINE_REGIONS_TABLE_NAME} SET status = ?, updated_at = ? WHERE id = ?`,
          [status, updatedAt, id],
        );
      } catch (e) {
        console.error('Failed to update region status', e);
        throw e;
      }
    },

    async deleteRegion(id: string): Promise<void> {
      if (!db) {
        throw new Error('Database not initialized');
      }

      try {
        await db.executeSql(
          `DELETE FROM ${OFFLINE_REGIONS_TABLE_NAME} WHERE id = ?`,
          [id],
        );
      } catch (e) {
        console.error('Failed to delete region', e);
        throw e;
      }
    },
  };
}
