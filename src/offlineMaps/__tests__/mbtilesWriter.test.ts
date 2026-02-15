/**
 * Tests for MBTiles Writer
 * @format
 */

// Mock file system for tests
const mockDbs: Map<string, MockDatabase> = new Map();

// Mock SQLite database
interface MockDatabase {
  path: string;
  tables: Map<string, MockTable>;
  closed: boolean;
}

interface MockTable {
  rows: Map<string, unknown>;
  schema?: string;
}

// Mock react-native-sqlite-storage
jest.mock('react-native-sqlite-storage', () => {
  return {
    __esModule: true,
    default: {
      openDatabase: jest.fn(async (opts: { name: string }) => {
        const db: MockDatabase = {
          path: opts.name,
          tables: new Map(),
          closed: false,
        };
        mockDbs.set(opts.name, db);

        return {
          executeSql: jest.fn(async (sql: string, params?: unknown[]) => {
            if (db.closed) {
              throw new Error('Database is closed');
            }

            // Handle CREATE TABLE
            if (sql.toUpperCase().includes('CREATE TABLE')) {
              const match = sql.match(/CREATE TABLE[^(]*\s+([a-z_]+)/i);
              if (match) {
                const tableName = match[1].trim();
                if (!db.tables.has(tableName)) {
                  db.tables.set(tableName, { rows: new Map() });
                }
              }
              return [{ rows: { length: 0 } }];
            }

            // Handle CREATE INDEX
            if (sql.toUpperCase().includes('CREATE')) {
              return [{ rows: { length: 0 } }];
            }

            // Handle SELECT
            if (sql.toUpperCase().includes('SELECT')) {
              const metadataTable = db.tables.get('metadata');
              const tilesTable = db.tables.get('tiles');

              if (sql.includes('FROM metadata')) {
                const rows = metadataTable
                  ? Array.from(metadataTable.rows.values())
                  : [];
                return [
                  {
                    rows: {
                      length: rows.length,
                      item: (i: number) => rows[i],
                    },
                  },
                ];
              }

              if (sql.includes('FROM tiles') && params) {
                const [z, x, tmsRow] = params as number[];
                const tilesRows = tilesTable
                  ? Array.from(tilesTable.rows.values())
                  : [];
                const found = tilesRows.find((r: any) => {
                  return (
                    r.zoom_level === z &&
                    r.tile_column === x &&
                    r.tile_row === tmsRow
                  );
                });
                return [
                  {
                    rows: {
                      length: found ? 1 : 0,
                      item: () => found,
                    },
                  },
                ];
              }

              // sqlite_master query
              if (sql.includes('sqlite_master')) {
                const tables = Array.from(db.tables.keys()).map((name) => ({
                  type: 'table',
                  name,
                }));
                return [
                  {
                    rows: {
                      length: tables.length,
                      item: (i: number) => tables[i],
                    },
                  },
                ];
              }

              return [{ rows: { length: 0 } }];
            }

            return [{ rows: { length: 0 } }];
          }),

          transaction: jest.fn(
            (
              callback: (tx: any) => void | Promise<void>,
              errorCallback?: (error: any) => void,
              successCallback?: () => void,
            ) => {
              if (db.closed) {
                const error = new Error('Database is closed');
                if (errorCallback) {
                  errorCallback(error);
                  return;
                }
                throw error;
              }

              const tx = {
                executeSql: jest.fn(
                  (
                    sql: string,
                    params?: unknown[],
                    successCb?: (tx: any, result: any) => void,
                    errorCb?: (tx: any, error: any) => void,
                  ) => {
                    try {
                      if (sql.includes('INSERT') && params) {
                        // Handle INSERT
                        if (sql.includes('metadata')) {
                          const [name, value] = params as [string, string];
                          const metadataTable = db.tables.get('metadata');
                          if (metadataTable) {
                            metadataTable.rows.set(name, { name, value });
                          }
                        } else if (sql.includes('tiles')) {
                          const [z, x, tmsRow, data] = params as [
                            number,
                            number,
                            number,
                            string,
                          ];
                          const tilesTable = db.tables.get('tiles');
                          if (tilesTable) {
                            const key = `${z}:${x}:${tmsRow}`;
                            tilesTable.rows.set(key, {
                              zoom_level: z,
                              tile_column: x,
                              tile_row: tmsRow,
                              tile_data: data,
                            });
                          }
                        }
                      }
                      const result = [{ rows: { length: 0 } }];
                      if (successCb) {
                        successCb(tx, result);
                      }
                      return result;
                    } catch (error) {
                      if (errorCb) {
                        errorCb(tx, error);
                      }
                      throw error;
                    }
                  },
                ),
              };

              try {
                const result = callback(tx);
                // Handle both sync and async callbacks
                if (result && typeof result.then === 'function') {
                  result
                    .then(() => {
                      if (successCallback) {
                        successCallback();
                      }
                    })
                    .catch((error: any) => {
                      if (errorCallback) {
                        errorCallback(error);
                      }
                    });
                } else {
                  if (successCallback) {
                    successCallback();
                  }
                }
              } catch (error) {
                if (errorCallback) {
                  errorCallback(error);
                } else {
                  throw error;
                }
              }
            },
          ),

          close: jest.fn(async () => {
            db.closed = true;
          }),
        };
      }),
    },
  };
});

// Import after mocks
import { xyzToTmsRow } from '../tiles/mbtilesSchema';
import { createMbtilesWriter } from '../tiles/mbtilesWriter';

describe('MbtilesWriter', () => {
  beforeEach(() => {
    mockDbs.clear();
    jest.clearAllMocks();
  });

  describe('Schema creation', () => {
    it('creates MBTiles tables and indexes', async () => {
      const writer = createMbtilesWriter();
      const dbPath = '/test/tiles.mbtiles';

      await writer.open(dbPath);
      await writer.initSchema();
      await writer.close();

      const db = mockDbs.get(dbPath);
      expect(db).toBeDefined();
      expect(db?.tables.has('metadata')).toBe(true);
      expect(db?.tables.has('tiles')).toBe(true);
    });
  });

  describe('Insert and read tile', () => {
    it('inserts a tile and reads it back', async () => {
      const writer = createMbtilesWriter();
      const dbPath = '/test/tiles.mbtiles';

      await writer.open(dbPath);
      await writer.initSchema();

      // Insert a tile
      const tileData = new Uint8Array([1, 2, 3, 4, 5]);
      await writer.insertTilesBatch([{ z: 1, x: 0, y: 0, data: tileData }]);

      // Read it back
      const retrieved = await writer.getTile(1, 0, 0);
      await writer.close();

      expect(retrieved).toBeDefined();
      expect(retrieved?.length).toBe(5);
      expect(Array.from(retrieved!)).toEqual([1, 2, 3, 4, 5]);
    });

    it('returns null for non-existent tile', async () => {
      const writer = createMbtilesWriter();
      const dbPath = '/test/tiles.mbtiles';

      await writer.open(dbPath);
      await writer.initSchema();

      const retrieved = await writer.getTile(10, 20, 30);
      await writer.close();

      expect(retrieved).toBeNull();
    });
  });

  describe('XYZ to TMS coordinate conversion', () => {
    it('converts XYZ y-coordinate to TMS correctly', async () => {
      const writer = createMbtilesWriter();
      const dbPath = '/test/tiles.mbtiles';

      await writer.open(dbPath);
      await writer.initSchema();

      // At zoom 1, n=2, so y=0 should become tmsY=1
      const z = 1;
      const x = 0;
      const y = 0;
      const expectedTmsRow = xyzToTmsRow(z, y); // Should be 1

      expect(expectedTmsRow).toBe(1);

      const tileData = new Uint8Array([10, 20, 30]);
      await writer.insertTilesBatch([{ z, x, y, data: tileData }]);

      // Verify the tile was stored with correct TMS row
      const db = mockDbs.get(dbPath);
      const tilesTable = db?.tables.get('tiles');
      const key = `${z}:${x}:${expectedTmsRow}`;
      const storedTile = tilesTable?.rows.get(key) as any;

      expect(storedTile).toBeDefined();
      expect(storedTile?.tile_row).toBe(expectedTmsRow);

      await writer.close();
    });
  });

  describe('Batch insert with transaction', () => {
    it('inserts multiple tiles in a batch', async () => {
      const writer = createMbtilesWriter();
      const dbPath = '/test/tiles.mbtiles';

      await writer.open(dbPath);
      await writer.initSchema();

      // Insert multiple tiles
      const tiles = [
        { z: 1, x: 0, y: 0, data: new Uint8Array([1]) },
        { z: 1, x: 1, y: 0, data: new Uint8Array([2]) },
        { z: 1, x: 0, y: 1, data: new Uint8Array([3]) },
        { z: 2, x: 0, y: 0, data: new Uint8Array([4]) },
      ];

      await writer.insertTilesBatch(tiles);

      // Verify all tiles can be retrieved
      for (const tile of tiles) {
        const retrieved = await writer.getTile(tile.z, tile.x, tile.y);
        expect(retrieved).toBeDefined();
        expect(retrieved?.length).toBe(1);
      }

      await writer.close();
    });

    it('handles empty batch gracefully', async () => {
      const writer = createMbtilesWriter();
      const dbPath = '/test/tiles.mbtiles';

      await writer.open(dbPath);
      await writer.initSchema();

      await expect(writer.insertTilesBatch([])).resolves.not.toThrow();

      await writer.close();
    });
  });

  describe('Metadata', () => {
    it('sets metadata entries', async () => {
      const writer = createMbtilesWriter();
      const dbPath = '/test/tiles.mbtiles';

      await writer.open(dbPath);
      await writer.initSchema();

      const metadata = {
        format: 'pbf',
        type: 'baselayer',
        version: '1',
        name: 'Test Region',
      };

      await writer.setMetadata(metadata);
      await writer.close();

      const db = mockDbs.get(dbPath);
      const metadataTable = db?.tables.get('metadata');

      expect(metadataTable?.rows.get('format')).toEqual({
        name: 'format',
        value: 'pbf',
      });
      expect(metadataTable?.rows.get('type')).toEqual({
        name: 'type',
        value: 'baselayer',
      });
    });
  });

  describe('Error handling', () => {
    it('throws when operations are called before open', async () => {
      const writer = createMbtilesWriter();

      await expect(writer.initSchema()).rejects.toThrow('Database is not open');
      await expect(writer.setMetadata({})).rejects.toThrow(
        'Database is not open',
      );
      await expect(writer.insertTilesBatch([])).rejects.toThrow(
        'Database is not open',
      );
      await expect(writer.getTile(0, 0, 0)).rejects.toThrow(
        'Database is not open',
      );
    });

    it('throws when opening an already open database', async () => {
      const writer = createMbtilesWriter();
      await writer.open('/test/tiles.mbtiles');

      await expect(writer.open('/test/tiles.mbtiles')).rejects.toThrow(
        'Database is already open',
      );

      await writer.close();
    });
  });
});
