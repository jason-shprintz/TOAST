/**
 * MBTiles SQLite schema and metadata definitions
 * @format
 */

/**
 * SQL to create the MBTiles metadata table
 */
export const CREATE_METADATA_TABLE = `
  CREATE TABLE IF NOT EXISTS metadata (
    name TEXT,
    value TEXT
  );
`;

/**
 * SQL to create the MBTiles tiles table
 */
export const CREATE_TILES_TABLE = `
  CREATE TABLE IF NOT EXISTS tiles (
    zoom_level INTEGER,
    tile_column INTEGER,
    tile_row INTEGER,
    tile_data BLOB
  );
`;

/**
 * SQL to create the unique index on tiles
 */
export const CREATE_TILE_INDEX = `
  CREATE UNIQUE INDEX IF NOT EXISTS tile_index
    ON tiles (zoom_level, tile_column, tile_row);
`;

/**
 * Default metadata for TOAST offline regions
 */
export interface MbtilesMetadata {
  format: string;
  type: string;
  version: string;
  name: string;
  description: string;
  bounds?: string; // "minLng,minLat,maxLng,maxLat"
  minzoom?: string;
  maxzoom?: string;
}

/**
 * Creates default metadata for an offline region
 */
export function createDefaultMetadata(
  bounds?: { minLng: number; minLat: number; maxLng: number; maxLat: number },
  minZoom?: number,
  maxZoom?: number,
): MbtilesMetadata {
  const metadata: MbtilesMetadata = {
    format: 'pbf',
    type: 'baselayer',
    version: '1',
    name: 'TOAST Offline Region',
    description: 'Offline tiles',
  };

  if (bounds) {
    metadata.bounds = `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`;
  }

  if (minZoom !== undefined) {
    metadata.minzoom = String(minZoom);
  }

  if (maxZoom !== undefined) {
    metadata.maxzoom = String(maxZoom);
  }

  return metadata;
}

/**
 * Convert XYZ tile coordinates to TMS (MBTiles) row coordinate
 * MBTiles uses TMS which has Y-axis flipped compared to XYZ
 */
export function xyzToTmsRow(z: number, y: number): number {
  // eslint-disable-next-line no-bitwise
  const n = 1 << z;
  return n - 1 - y;
}
