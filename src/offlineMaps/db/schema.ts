/**
 * SQLite schema definitions for offline regions
 * @format
 */

export const OFFLINE_REGIONS_TABLE_NAME = 'offline_regions';
export const APP_META_TABLE_NAME = 'app_meta';

/**
 * Schema for the offline_regions table
 */
export const CREATE_OFFLINE_REGIONS_TABLE = `
CREATE TABLE IF NOT EXISTS ${OFFLINE_REGIONS_TABLE_NAME} (
  id TEXT PRIMARY KEY NOT NULL,

  center_lat REAL NOT NULL,
  center_lng REAL NOT NULL,
  radius_miles REAL NOT NULL,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  version INTEGER NOT NULL,
  status TEXT NOT NULL,

  storage_size_mb REAL,

  tiles_path TEXT,
  dem_path TEXT,
  region_json_path TEXT,
  water_path TEXT,
  cities_path TEXT,
  roads_path TEXT,
  index_path TEXT
)
`;

/**
 * Schema for the app metadata table (used for migration versioning)
 */
export const CREATE_APP_META_TABLE = `
CREATE TABLE IF NOT EXISTS ${APP_META_TABLE_NAME} (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
)
`;
