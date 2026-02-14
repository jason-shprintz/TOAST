/**
 * Tile coverage computation for offline map regions
 * @format
 */

import { regionToBounds } from './geoMath';
import { lonToTileX, latToTileY } from './tiles';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Bounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface TileCoord {
  z: number;
  x: number;
  y: number;
}

export interface TileCoverageConfig {
  minZoom: number; // inclusive
  maxZoom: number; // inclusive
}

export interface CoverageResult {
  bounds: Bounds;
  tiles: TileCoord[];
  tileCountByZoom: Record<number, number>;
  totalTileCount: number;
}

/**
 * Convert bounds to tile range at a specific zoom level
 * Handles antimeridian crossing
 */
export function boundsToTileRange(
  bounds: Bounds,
  z: number,
): { minX: number; maxX: number; minY: number; maxY: number } {
  const n = Math.pow(2, z);

  // Convert bounds to tile coordinates
  // Note: Y increases downward in tile coordinates
  const minX = Math.floor(lonToTileX(bounds.minLng, z));
  const maxX = Math.floor(lonToTileX(bounds.maxLng, z));
  const minY = Math.floor(latToTileY(bounds.maxLat, z)); // maxLat -> minY
  const maxY = Math.floor(latToTileY(bounds.minLat, z)); // minLat -> maxY

  // Clamp to valid tile range [0, n-1]
  return {
    minX: Math.max(0, Math.min(n - 1, minX)),
    maxX: Math.max(0, Math.min(n - 1, maxX)),
    minY: Math.max(0, Math.min(n - 1, minY)),
    maxY: Math.max(0, Math.min(n - 1, maxY)),
  };
}

/**
 * Generate tiles for a given tile range, handling antimeridian wrap
 */
function generateTilesForRange(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  z: number,
): TileCoord[] {
  const tiles: TileCoord[] = [];
  const n = Math.pow(2, z);

  // Check if we cross the antimeridian (minX > maxX after normalization)
  if (minX > maxX) {
    // Split into two ranges: [minX..n-1] and [0..maxX]
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x < n; x++) {
        tiles.push({ z, x, y });
      }
      for (let x = 0; x <= maxX; x++) {
        tiles.push({ z, x, y });
      }
    }
  } else {
    // Normal case: single contiguous range
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        tiles.push({ z, x, y });
      }
    }
  }

  return tiles;
}

/**
 * Compute full tile coverage for a circular region
 * Returns unique, sorted tiles covering the region
 */
export function computeTileCoverage(
  center: LatLng,
  radiusMiles: number,
  cfg: TileCoverageConfig,
): CoverageResult {
  const bounds = regionToBounds(center, radiusMiles);
  const tiles: TileCoord[] = [];
  const tileCountByZoom: Record<number, number> = {};

  // Generate tiles for each zoom level
  for (let z = cfg.minZoom; z <= cfg.maxZoom; z++) {
    const range = boundsToTileRange(bounds, z);
    const zoomTiles = generateTilesForRange(
      range.minX,
      range.maxX,
      range.minY,
      range.maxY,
      z,
    );
    tiles.push(...zoomTiles);
    tileCountByZoom[z] = zoomTiles.length;
  }

  // Sort tiles: z ascending, then y ascending, then x ascending
  tiles.sort((a, b) => {
    if (a.z !== b.z) return a.z - b.z;
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  // Remove duplicates (shouldn't happen, but ensures uniqueness)
  const uniqueTiles: TileCoord[] = [];
  let prev: TileCoord | null = null;
  for (const tile of tiles) {
    if (!prev || prev.z !== tile.z || prev.x !== tile.x || prev.y !== tile.y) {
      uniqueTiles.push(tile);
      prev = tile;
    }
  }

  return {
    bounds,
    tiles: uniqueTiles,
    tileCountByZoom,
    totalTileCount: uniqueTiles.length,
  };
}

/**
 * Estimate tile count for bounds without generating full tile list
 */
export function estimateTileCountForBounds(
  bounds: Bounds,
  cfg: TileCoverageConfig,
): { total: number; byZoom: Record<number, number> } {
  const byZoom: Record<number, number> = {};
  let total = 0;

  for (let z = cfg.minZoom; z <= cfg.maxZoom; z++) {
    const range = boundsToTileRange(bounds, z);
    const n = Math.pow(2, z);

    let count = 0;
    if (range.minX > range.maxX) {
      // Antimeridian crossing
      count =
        (n - range.minX + (range.maxX + 1)) * (range.maxY - range.minY + 1);
    } else {
      count = (range.maxX - range.minX + 1) * (range.maxY - range.minY + 1);
    }

    byZoom[z] = count;
    total += count;
  }

  return { total, byZoom };
}
