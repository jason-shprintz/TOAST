/**
 * Grid-based spatial index for fast nearest-neighbor and hit-testing queries
 * @format
 */

import { EARTH_RADIUS_METERS } from '../geo/geoMath';
import type { MapFeatureRef } from './geoIndexTypes';

/**
 * Configuration for grid index
 */
export interface GridIndexConfig {
  cellSizeMeters: number;
}

/**
 * Cell key with coordinates
 */
export interface CellKey {
  key: string;
  cx: number;
  cy: number;
}

/**
 * Result of building a grid index
 */
export interface GridIndex {
  cfg: GridIndexConfig;
  cells: Record<string, MapFeatureRef[]>;
}

/**
 * Convert lat/lng to cell key using equirectangular projection
 */
export function latLngToCellKey(
  lat: number,
  lng: number,
  cfg: GridIndexConfig,
): CellKey {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  // Equirectangular projection to meters
  const mx = EARTH_RADIUS_METERS * lngRad * Math.cos(latRad);
  const my = EARTH_RADIUS_METERS * latRad;

  // Cell coordinates
  const cx = Math.floor(mx / cfg.cellSizeMeters);
  const cy = Math.floor(my / cfg.cellSizeMeters);

  // Cell key
  const key = `${cx}:${cy}`;

  return { key, cx, cy };
}

/**
 * Build a grid index from features
 */
export function buildGridIndex(
  features: MapFeatureRef[],
  cfg: GridIndexConfig,
): GridIndex {
  const cells: Record<string, MapFeatureRef[]> = {};

  for (const feature of features) {
    const { key } = latLngToCellKey(feature.lat, feature.lng, cfg);

    if (!cells[key]) {
      cells[key] = [];
    }
    cells[key].push(feature);
  }

  return { cfg, cells };
}

/**
 * Get neighboring cell keys in a ring pattern
 * @param cx - Center cell x coordinate
 * @param cy - Center cell y coordinate
 * @param radius - Ring radius (0 = center only, 1 = immediate neighbors, etc.)
 */
export function getNeighboringCells(
  cx: number,
  cy: number,
  radius: number,
): string[] {
  if (radius === 0) {
    return [`${cx}:${cy}`];
  }

  const keys: string[] = [];

  // Generate all cells in the ring
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      // Only include cells on the ring perimeter
      if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
        keys.push(`${cx + dx}:${cy + dy}`);
      }
    }
  }

  return keys;
}

/**
 * Get all cell keys up to and including a given radius
 * @param cx - Center cell x coordinate
 * @param cy - Center cell y coordinate
 * @param maxRadius - Maximum ring radius to include
 */
export function getAllCellsInRadius(
  cx: number,
  cy: number,
  maxRadius: number,
): string[] {
  const keys: string[] = [];

  for (let radius = 0; radius <= maxRadius; radius++) {
    keys.push(...getNeighboringCells(cx, cy, radius));
  }

  return keys;
}
