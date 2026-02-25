/**
 * Phase handler for finalising a downloaded region
 * Validates the temp package, moves files to permanent storage, and
 * marks the region as ready in the database.
 * @format
 */

import type { PhaseHandler, PhaseHandlerContext } from './downloadTypes';
import type { RegionRepository } from '../db/regionRepository';
import type { RegionPaths } from '../storage/paths';
import type { RegionStorage } from '../storage/regionStorage';
import type { OfflineRegion } from '../types';

export interface FinalisePhaseHandlerOptions {
  paths: RegionPaths;
  regionStorage: RegionStorage;
  regionRepo: RegionRepository;
}

/**
 * Creates a phase handler for the finalise phase.
 *
 * Responsibilities:
 *  1. Validate all required temp files are present and non-empty
 *  2. Atomically move the temp package to the final directory (with backup+rollback)
 *  3. Update the region database record with final file paths and status='ready'
 */
export function createFinalisePhaseHandler(
  opts: FinalisePhaseHandlerOptions,
): PhaseHandler {
  const { paths, regionStorage, regionRepo } = opts;

  return async (ctx: PhaseHandlerContext): Promise<void> => {
    const { regionId } = ctx;

    await ctx.report({
      phase: 'finalise',
      percent: 0,
      message: 'Validating downloaded files...',
    });

    if (ctx.isCancelled() || ctx.isPaused()) {
      return;
    }

    // Validate that all required files are present in the temp package
    await regionStorage.validateTempPackage(regionId);

    await ctx.report({
      phase: 'finalise',
      percent: 25,
      message: 'Moving files to permanent storage...',
    });

    if (ctx.isCancelled() || ctx.isPaused()) {
      return;
    }

    // Atomically move the temp package to the final region directory
    await regionStorage.finaliseTempToFinal(regionId);

    await ctx.report({
      phase: 'finalise',
      percent: 75,
      message: 'Updating region record...',
    });

    // Read the current region record from the database
    const region = await regionRepo.getRegion(regionId);
    if (!region) {
      throw new Error(`Region ${regionId} not found after finalise`);
    }

    // Compute the final storage size (non-critical — failure won't abort the phase)
    let storageSizeMB: number | undefined;
    try {
      const sizeBytes = await regionStorage.getFinalSizeBytes(regionId);
      storageSizeMB = Math.round((sizeBytes / (1024 * 1024)) * 10) / 10;
    } catch {
      // Non-critical — size estimation failure should not block the region going ready
    }

    // Update the database record with all final file paths and mark as ready
    const updatedRegion: OfflineRegion = {
      ...region,
      status: 'ready',
      storageSizeMB,
      tilesPath: paths.tilesMbtiles(regionId),
      demPath: paths.dem(regionId),
      regionJsonPath: paths.regionJson(regionId),
      waterPath: paths.water(regionId),
      citiesPath: paths.cities(regionId),
      roadsPath: paths.roads(regionId),
      indexPath: paths.index(regionId),
    };

    await regionRepo.updateRegion(updatedRegion);

    await ctx.report({
      phase: 'finalise',
      percent: 100,
      message: 'Download complete!',
    });
  };
}
