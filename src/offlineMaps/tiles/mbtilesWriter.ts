/**
 * MBTiles SQLite writer implementation
 * @format
 */

import SQLite from 'react-native-sqlite-storage';
import {
  CREATE_METADATA_TABLE,
  CREATE_TILES_TABLE,
  CREATE_TILE_INDEX,
  xyzToTmsRow,
} from './mbtilesSchema';
import type { SQLiteDatabase, Transaction } from 'react-native-sqlite-storage';

/**
 * Tile data to be inserted
 */
export interface TileData {
  z: number;
  x: number;
  y: number;
  data: Uint8Array;
}

/**
 * MBTiles writer interface
 */
export interface MbtilesWriter {
  /**
   * Open the database at the specified path
   */
  open(path: string): Promise<void>;

  /**
   * Initialize the MBTiles schema (tables and indexes)
   */
  initSchema(): Promise<void>;

  /**
   * Set metadata entries
   */
  setMetadata(meta: Record<string, string>): Promise<void>;

  /**
   * Insert a batch of tiles in a single transaction
   */
  insertTilesBatch(tiles: TileData[]): Promise<void>;

  /**
   * Get a tile by coordinates (for integrity checks)
   */
  getTile(z: number, x: number, y: number): Promise<Uint8Array | null>;

  /**
   * Close the database
   */
  close(): Promise<void>;
}

/**
 * Implementation of MBTiles writer using react-native-sqlite-storage
 */
export class SqliteMbtilesWriter implements MbtilesWriter {
  private db: SQLiteDatabase | null = null;
  private dbPath: string | null = null;
  private readonly documentsDir: string | undefined;

  /**
   * @param documentsDir - The app's Documents directory path
   *   (e.g. RNFS.DocumentDirectoryPath). When provided, absolute paths that
   *   start with this prefix are converted to a relative name so that
   *   react-native-sqlite-storage v6 can open them correctly on iOS via
   *   `location: 'default'`.
   */
  constructor(documentsDir?: string) {
    this.documentsDir = documentsDir;
  }

  async open(path: string): Promise<void> {
    if (this.db) {
      throw new Error('Database is already open');
    }

    this.dbPath = path;

    // Ensure promise-based API is active for this module instance.
    // The types don't expose enablePromise, so cast to any.
    // Use optional chaining so tests that mock SQLite without enablePromise still work.
    (SQLite as any).enablePromise?.(true);

    // react-native-sqlite-storage v6: use a path relative to Documents with
    // location: 'Documents' so the native layer resolves to the same directory
    // that ensureDir() created. location: 'default' maps to Library/LocalDatabase
    // which is a flat directory — subdirectory names in the database name are not
    // created there, causing sqlite3_open_v2 to fail silently (SQLITE_CANTOPEN)
    // without invoking the error callback, leaving the JS promise permanently hung.
    const docsDir = this.documentsDir;
    const name =
      docsDir && path.startsWith(docsDir + '/')
        ? path.slice(docsDir.length + 1)
        : path;

    // Wrap with a hard timeout so that if the native callback is never fired
    // (SQLite bug or unexpected path issue) we surface a clear error rather
    // than hanging the entire tiles phase indefinitely.
    this.db = await new Promise<SQLiteDatabase>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            new Error(
              `SQLite openDatabase timed out after 10s (name: ${name})`,
            ),
          ),
        10000,
      );

      const openPromise = SQLite.openDatabase({ name, location: 'Documents' });

      // If enablePromise was not effective, openDatabase returns undefined
      // (callback-based). Catch that case early with a clear message.
      if (
        !openPromise ||
        typeof (openPromise as unknown as Promise<SQLiteDatabase>).then !==
          'function'
      ) {
        clearTimeout(timer);
        reject(
          new Error(
            'SQLite.openDatabase did not return a Promise — ' +
              'enablePromise(true) may not have taken effect',
          ),
        );
        return;
      }

      (openPromise as unknown as Promise<SQLiteDatabase>).then(
        (db) => {
          clearTimeout(timer);
          resolve(db);
        },
        (err: unknown) => {
          clearTimeout(timer);
          reject(err instanceof Error ? err : new Error(String(err)));
        },
      );
    });
  }

  async initSchema(): Promise<void> {
    if (!this.db) {
      throw new Error('Database is not open');
    }

    await this.db.executeSql(CREATE_METADATA_TABLE);
    await this.db.executeSql(CREATE_TILES_TABLE);
    await this.db.executeSql(CREATE_TILE_INDEX);
  }

  async setMetadata(meta: Record<string, string>): Promise<void> {
    if (!this.db) {
      throw new Error('Database is not open');
    }

    // Insert all metadata entries in a transaction
    await new Promise<void>((resolve, reject) => {
      this.db!.transaction(
        (tx: Transaction) => {
          for (const [name, value] of Object.entries(meta)) {
            tx.executeSql(
              'INSERT OR REPLACE INTO metadata (name, value) VALUES (?, ?)',
              [name, value],
            );
          }
        },
        (error: Error) => {
          reject(error);
        },
        () => {
          resolve();
        },
      );
    });
  }

  async insertTilesBatch(tiles: TileData[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database is not open');
    }

    if (tiles.length === 0) {
      return;
    }

    // Insert all tiles in a single transaction
    await new Promise<void>((resolve, reject) => {
      this.db!.transaction(
        (tx: Transaction) => {
          for (const tile of tiles) {
            const tmsRow = xyzToTmsRow(tile.z, tile.y);

            // Convert Uint8Array to base64 for SQLite storage
            const base64Data = uint8ArrayToBase64(tile.data);

            tx.executeSql(
              'INSERT OR REPLACE INTO tiles (zoom_level, tile_column, tile_row, tile_data) VALUES (?, ?, ?, ?)',
              [tile.z, tile.x, tmsRow, base64Data],
            );
          }
        },
        (error: Error) => {
          reject(error);
        },
        () => {
          resolve();
        },
      );
    });
  }

  async getTile(z: number, x: number, y: number): Promise<Uint8Array | null> {
    if (!this.db) {
      throw new Error('Database is not open');
    }

    const tmsRow = xyzToTmsRow(z, y);

    const [result] = await this.db.executeSql(
      'SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?',
      [z, x, tmsRow],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const base64Data = result.rows.item(0).tile_data as string;
    return base64ToUint8Array(base64Data);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.dbPath = null;
    }
  }
}

/**
 * Convert Uint8Array to base64 string
 * Processes data in chunks to avoid memory issues with large tiles
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  // Process the Uint8Array in chunks to avoid creating a very large
  // intermediate array of single-character strings.
  const chunkSize = 0x8000; // 32768 bytes per chunk
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, bytes.length);
    let chunk = '';
    for (let j = i; j < end; j++) {
      chunk += String.fromCharCode(bytes[j]);
    }
    binary += chunk;
  }

  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Factory function to create a new MBTiles writer.
 * @param documentsDir - Pass RNFS.DocumentDirectoryPath so that absolute paths
 *   are converted to relative paths before being handed to
 *   react-native-sqlite-storage (required on iOS with v6).
 */
export function createMbtilesWriter(documentsDir?: string): MbtilesWriter {
  return new SqliteMbtilesWriter(documentsDir);
}
