/**
 * Database migrations for offline regions
 * @format
 */

import { SQLiteDatabase } from '../../types/database-types';
import {
  CREATE_OFFLINE_REGIONS_TABLE,
  CREATE_APP_META_TABLE,
  APP_META_TABLE_NAME,
} from './schema';

const SCHEMA_VERSION_KEY = 'offline_regions_schema_version';

export interface Migration {
  id: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

/**
 * All migrations in order
 */
export const migrations: Migration[] = [
  {
    id: 1,
    up: async (db: SQLiteDatabase) => {
      // Create app_meta table for tracking schema versions
      await db.executeSql(CREATE_APP_META_TABLE);

      // Create offline_regions table
      await db.executeSql(CREATE_OFFLINE_REGIONS_TABLE);
    },
  },
];

/**
 * Get the current schema version from the database
 */
async function getCurrentSchemaVersion(db: SQLiteDatabase): Promise<number> {
  try {
    const result = await db.executeSql(
      `SELECT value FROM ${APP_META_TABLE_NAME} WHERE key = ?`,
      [SCHEMA_VERSION_KEY],
    );

    if (result[0].rows.length > 0) {
      const row = result[0].rows.item(0);
      return parseInt(row.value, 10);
    }
  } catch {
    // Table might not exist yet, return 0
    return 0;
  }

  return 0;
}

/**
 * Set the schema version in the database
 */
async function setSchemaVersion(
  db: SQLiteDatabase,
  version: number,
): Promise<void> {
  await db.executeSql(
    `INSERT OR REPLACE INTO ${APP_META_TABLE_NAME} (key, value) VALUES (?, ?)`,
    [SCHEMA_VERSION_KEY, version.toString()],
  );
}

/**
 * Run all pending migrations
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Ensure app_meta table exists first
  await db.executeSql(CREATE_APP_META_TABLE);

  const currentVersion = await getCurrentSchemaVersion(db);
  const latestVersion = migrations[migrations.length - 1]?.id || 0;

  if (currentVersion >= latestVersion) {
    // Already up to date
    return;
  }

  // Run migrations that haven't been applied yet
  for (const migration of migrations) {
    if (migration.id > currentVersion) {
      await migration.up(db);
      await setSchemaVersion(db, migration.id);
    }
  }
}
