/**
 * Phase handler for spatial index building
 * @format
 */

import { buildIndexFromOverlays, writeIndex } from './geoIndex';
import type { PhaseHandler } from '../download/downloadTypes';
import type { FileOps } from '../storage/fileOps';
import type { RegionPaths } from '../storage/paths';

/**
 * Options for creating index phase handler
 */
export interface IndexPhaseHandlerOptions {
  paths: RegionPaths;
  fileOps: FileOps;
  cellSizeMeters?: number;
}

/**
 * Create a phase handler for spatial index building
 */
export function createIndexPhaseHandler(
  opts: IndexPhaseHandlerOptions,
): PhaseHandler {
  const { paths, fileOps, cellSizeMeters = 500 } = opts;

  return async (ctx) => {
    const { regionId } = ctx;

    // Ensure temp region directory exists
    const tmpRegionDir = paths.tmpRegionDir(regionId);
    await fileOps.ensureDir(tmpRegionDir);

    // Report start
    await ctx.report({
      phase: 'index',
      percent: 0,
      message: 'Building spatial index...',
    });

    // Check for cancellation
    if (ctx.isCancelled()) {
      const error = new Error('Index build cancelled');
      (error as any).code = 'CANCELLED';
      throw error;
    }

    // Check for pause
    if (ctx.isPaused()) {
      return;
    }

    // Report progress: loading overlays
    await ctx.report({
      phase: 'index',
      percent: 10,
      message: 'Loading overlay data...',
    });

    // Build index from overlays (40% of work)
    const gridIndex = await buildIndexFromOverlays(regionId, paths, fileOps, {
      cellSizeMeters,
    });

    // Check for cancellation
    if (ctx.isCancelled()) {
      const error = new Error('Index build cancelled');
      (error as any).code = 'CANCELLED';
      throw error;
    }

    // Check for pause
    if (ctx.isPaused()) {
      return;
    }

    // Report progress: index built
    await ctx.report({
      phase: 'index',
      percent: 50,
      message: 'Index built, writing to disk...',
    });

    // Count features for reporting
    let featureCount = 0;
    for (const features of Object.values(gridIndex.cells)) {
      featureCount += features.length;
    }

    // Write index to disk
    await writeIndex(regionId, gridIndex, paths, fileOps);

    // Report completion
    await ctx.report({
      phase: 'index',
      percent: 100,
      message: `Index complete (${featureCount} features, ${Object.keys(gridIndex.cells).length} cells)`,
    });
  };
}
