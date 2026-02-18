/**
 * Storage size estimator for offline regions
 * @format
 */

import { computeTileCoverage, type LatLng } from '../../geo/coverage';
import type { DownloadRegionEstimate } from './types';

/**
 * Conservative average estimates for different data types
 */
const AVG_PBF_TILE_KB = 25; // conservative average compressed vector tile
const DEM_ESTIMATE_MB = 120; // placeholder until DEM provider known
const META_ESTIMATE_MB = 20; // overlays + index

/**
 * Default tile coverage configuration
 */
const DEFAULT_TILE_CONFIG = {
  minZoom: 0,
  maxZoom: 14,
};

/**
 * Estimate storage size for a region
 *
 * @param center - Center of the region
 * @param radiusMiles - Radius in miles
 * @returns Storage estimate with breakdown by data type
 */
export function estimateRegionSize(
  center: LatLng,
  radiusMiles: number,
): DownloadRegionEstimate {
  // Compute tile coverage
  const coverage = computeTileCoverage(center, radiusMiles, DEFAULT_TILE_CONFIG);

  // Estimate tile storage
  const estimatedTilesMB = (coverage.totalTileCount * AVG_PBF_TILE_KB) / 1024;

  // Total estimate
  const estimatedTotalMB =
    estimatedTilesMB + DEM_ESTIMATE_MB + META_ESTIMATE_MB;

  return {
    tileCount: coverage.totalTileCount,
    estimatedTilesMB: Math.round(estimatedTilesMB * 10) / 10,
    estimatedDemMB: DEM_ESTIMATE_MB,
    estimatedMetaMB: META_ESTIMATE_MB,
    estimatedTotalMB: Math.round(estimatedTotalMB * 10) / 10,
  };
}
