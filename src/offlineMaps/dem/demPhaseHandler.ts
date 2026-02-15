/**
 * DEM phase handler for download manager
 * @format
 */

import { createDemStorage } from './demStorage';
import type { DemProvider } from './demProvider';
import type { DemMetadataV1 } from './demTypes';
import type { PhaseHandler } from '../download/downloadTypes';
import type { FileOps } from '../storage/fileOps';
import type { RegionPaths } from '../storage/paths';

/**
 * Options for creating a DEM phase handler
 */
export interface DemPhaseHandlerOptions {
  paths: RegionPaths;
  fileOps: FileOps;
  provider: DemProvider;
  encoding: 'int16' | 'float32';
  targetResolutionMeters?: number;
  updateRegionJson?: (
    regionId: string,
    demMeta: DemMetadataV1,
  ) => Promise<void>;
}

/**
 * Creates a phase handler for the DEM download phase
 */
export function createDemPhaseHandler(
  opts: DemPhaseHandlerOptions,
): PhaseHandler {
  const { paths, fileOps, provider, encoding, targetResolutionMeters } = opts;
  const storage = createDemStorage(paths, fileOps);

  return async (ctx) => {
    const { regionId, report, isCancelled, isPaused } = ctx;

    try {
      // 1. Ensure temp region directory exists
      const tmpDir = paths.tmpRegionDir(regionId);
      await fileOps.ensureDir(tmpDir);

      // Check for pause/cancel
      if (isCancelled()) {
        throw { code: 'CANCELLED' };
      }
      if (isPaused()) {
        return;
      }

      // 2. Load region bounds from temp region.json
      const regionJsonPath = paths.tmpRegionJson(regionId);
      const regionJsonExists = await fileOps.exists(regionJsonPath);

      if (!regionJsonExists) {
        throw new Error(
          `Cannot download DEM: region.json not found for region ${regionId}`,
        );
      }

      const regionJsonContent = await fileOps.readFile(regionJsonPath);
      const regionData = JSON.parse(regionJsonContent);

      if (!regionData.bounds) {
        throw new Error(
          `Cannot download DEM: bounds not found in region.json for region ${regionId}`,
        );
      }

      const bounds = regionData.bounds;

      // Check for pause/cancel
      if (isCancelled()) {
        throw { code: 'CANCELLED' };
      }
      if (isPaused()) {
        return;
      }

      // 3. Call provider.fetchDem with progress callback
      await report({
        phase: 'dem',
        message: 'Downloading DEM...',
      });

      const demResponse = await provider.fetchDem(
        {
          regionId,
          bounds,
          encoding,
          targetResolutionMeters,
        },
        {
          onProgress: (progress) => {
            // Check for pause/cancel during download
            if (isCancelled() || isPaused()) {
              return;
            }

            report({
              phase: 'dem',
              downloadedBytes: progress.downloadedBytes,
              totalBytes: progress.totalBytes,
              message: progress.message || 'Downloading DEM...',
            }).catch((err) => {
              // Log errors in progress reporting but don't fail the download
              // Progress reporting failures should not interrupt the download
              console.warn('Failed to report DEM progress:', err);
            });
          },
        },
      );

      // Check for pause/cancel after fetch
      if (isCancelled()) {
        throw { code: 'CANCELLED' };
      }
      if (isPaused()) {
        return;
      }

      // 4. Write elevation.dem to temp folder
      await report({
        phase: 'dem',
        message: 'Writing DEM...',
      });

      await storage.writeTempDem(regionId, demResponse.data);

      // Check for pause/cancel
      if (isCancelled()) {
        throw { code: 'CANCELLED' };
      }
      if (isPaused()) {
        return;
      }

      // 5. Update region.json with DEM metadata
      if (opts.updateRegionJson) {
        await opts.updateRegionJson(regionId, demResponse.metadata);
      } else {
        // Default: update region.json directly
        const updatedRegionData = {
          ...regionData,
          dem: demResponse.metadata,
        };

        const updatedContent = JSON.stringify(updatedRegionData, null, 2);
        await fileOps.writeFileAtomic(regionJsonPath, updatedContent);
      }

      // 6. Report completion
      await report({
        phase: 'dem',
        downloadedBytes: demResponse.data.byteLength,
        totalBytes: demResponse.data.byteLength,
        message: 'DEM download completed',
      });
    } catch (error) {
      // Re-throw cancellation errors
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'CANCELLED'
      ) {
        throw error;
      }

      // Wrap other errors
      throw new Error(
        `DEM download failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
}
