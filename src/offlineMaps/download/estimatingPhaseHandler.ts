/**
 * Phase handler for the estimating phase
 * Computes tile coverage and writes the initial region.json to the temp directory.
 * Subsequent phases (DEM, overlays) read from this file for bounds information.
 * @format
 */

import { computeTileCoverage } from '../geo/coverage';
import { regionToBounds } from '../geo/geoMath';
import type { PhaseHandler, PhaseHandlerContext } from './downloadTypes';
import type { FileOps } from '../storage/fileOps';
import type { RegionPaths } from '../storage/paths';
import type { OfflineRegion } from '../types';

/** Default zoom range for tile downloads */
const DEFAULT_MIN_ZOOM = 0;
const DEFAULT_MAX_ZOOM = 14;

export interface EstimatingPhaseHandlerOptions {
  paths: RegionPaths;
  fileOps: FileOps;
  /** Fetch the region record from the database */
  getRegion: (regionId: string) => Promise<OfflineRegion | null>;
  minZoom?: number;
  maxZoom?: number;
}

/**
 * Creates a phase handler for the estimating phase.
 *
 * Responsibilities:
 *  1. Fetch region metadata from the database
 *  2. Compute the bounding box and tile coverage
 *  3. Write an initial region.json to the temp directory with bounds and tile config
 *     (the DEM phase will add the `dem` field later before the overlay phase reads it)
 */
export function createEstimatingPhaseHandler(
  opts: EstimatingPhaseHandlerOptions,
): PhaseHandler {
  const { paths, fileOps, getRegion } = opts;
  const minZoom = opts.minZoom ?? DEFAULT_MIN_ZOOM;
  const maxZoom = opts.maxZoom ?? DEFAULT_MAX_ZOOM;

  return async (ctx: PhaseHandlerContext): Promise<void> => {
    const { regionId } = ctx;

    await ctx.report({
      phase: 'estimating',
      percent: 0,
      message: 'Computing coverage...',
    });

    if (ctx.isCancelled()) return;

    // Ensure the temp region directory exists
    const tmpDir = paths.tmpRegionDir(regionId);
    await fileOps.ensureDir(tmpDir);

    // Fetch region metadata from the database
    const region = await getRegion(regionId);
    if (!region) {
      throw new Error(`Region ${regionId} not found in database`);
    }

    if (ctx.isCancelled()) return;
    if (ctx.isPaused()) return;

    // Compute bounding box and tile coverage
    const center = { lat: region.centerLat, lng: region.centerLng };
    const bounds = regionToBounds(center, region.radiusMiles);
    const coverage = computeTileCoverage(center, region.radiusMiles, {
      minZoom,
      maxZoom,
    });

    await ctx.report({
      phase: 'estimating',
      percent: 50,
      message: `Coverage: ${coverage.totalTileCount} tiles across zoom ${minZoom}–${maxZoom}`,
    });

    if (ctx.isCancelled()) return;
    if (ctx.isPaused()) return;

    // Write the initial region.json.
    // Note: the `dem` field is intentionally omitted here — the DEM phase handler
    // will add it after fetching elevation data.  The overlay phase (which runs
    // after DEM) calls parseRegionJson and will then see the complete schema.
    const regionJson = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      regionId,
      center: { lat: region.centerLat, lng: region.centerLng },
      radiusMiles: region.radiusMiles,
      bounds,
      tiles: {
        format: 'mbtiles',
        minZoom,
        maxZoom,
      },
    };

    const regionJsonPath = paths.tmpRegionJson(regionId);
    await fileOps.writeFileAtomic(
      regionJsonPath,
      JSON.stringify(regionJson, null, 2),
    );

    await ctx.report({
      phase: 'estimating',
      percent: 100,
      message: `Ready: ${coverage.totalTileCount} tiles (zoom ${minZoom}–${maxZoom})`,
    });
  };
}
