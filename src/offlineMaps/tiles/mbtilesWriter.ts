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
  private db: SQLite.SQLiteDatabase | null = null;
  private dbPath: string | null = null;

  async open(path: string): Promise<void> {
    if (this.db) {
      throw new Error('Database is already open');
    }

    this.dbPath = path;

    // Open database using the provided absolute path
    // react-native-sqlite-storage will use this full path as-is
    this.db = await SQLite.openDatabase({
      name: path,
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
        (tx) => {
          for (const [name, value] of Object.entries(meta)) {
            tx.executeSql(
              'INSERT OR REPLACE INTO metadata (name, value) VALUES (?, ?)',
              [name, value],
            );
          }
        },
        (error) => {
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
        (tx) => {
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
        (error) => {
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

    const base64Data = result.rows.item(0).tile_data;
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
 * Factory function to create a new MBTiles writer
 */
export function createMbtilesWriter(): MbtilesWriter {
  return new SqliteMbtilesWriter();
}
