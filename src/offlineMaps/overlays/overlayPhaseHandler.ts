/**
 * Phase handler for overlay metadata acquisition
 * @format
 */

import { parseRegionJson } from '../schemas';
import type { OverlayProvider, OverlayKind } from './overlayTypes';
import type { PhaseHandler } from '../download/downloadTypes';
import type { FileOps } from '../storage/fileOps';
import type { RegionPaths } from '../storage/paths';

/**
 * Validation functions for overlay data
 */
export interface OverlayValidation {
  water: (input: unknown) => unknown;
  cities: (input: unknown) => unknown;
  roads: (input: unknown) => unknown;
}

/**
 * Options for creating overlay phase handler
 */
export interface OverlayPhaseHandlerOptions {
  paths: RegionPaths;
  fileOps: FileOps;
  provider: OverlayProvider;
  validate: OverlayValidation;
}

/**
 * Create a phase handler for overlay metadata acquisition
 */
export function createOverlayPhaseHandler(
  opts: OverlayPhaseHandlerOptions,
): PhaseHandler {
  const { paths, fileOps, provider, validate } = opts;

  return async (ctx) => {
    const { regionId } = ctx;

    // Ensure temp region directory exists
    const tmpRegionDir = paths.tmpRegionDir(regionId);
    await fileOps.ensureDir(tmpRegionDir);

    // Load region.json to get bounds
    const regionJsonPath = paths.tmpRegionJson(regionId);
    const regionJsonContent = await fileOps.readFile(regionJsonPath);
    const regionJson = parseRegionJson(JSON.parse(regionJsonContent));
    const bounds = regionJson.bounds;

    // Define overlay kinds and their progress ranges
    const overlayKinds: Array<{
      kind: OverlayKind;
      progressStart: number;
      progressEnd: number;
    }> = [
      { kind: 'water', progressStart: 0, progressEnd: 33 },
      { kind: 'cities', progressStart: 33, progressEnd: 66 },
      { kind: 'roads', progressStart: 66, progressEnd: 100 },
    ];

    // Process each overlay kind
    for (const { kind, progressStart, progressEnd } of overlayKinds) {
      // Check for cancellation
      if (ctx.isCancelled()) {
        throw { code: 'CANCELLED' };
      }

      // Check for pause - return early to allow DownloadManager to persist pause
      if (ctx.isPaused()) {
        return;
      }

      // Report start of fetching
      await ctx.report({
        phase: 'overlays',
        percent: progressStart,
        message: `Fetching ${kind}...`,
      });

      // Fetch overlay data from provider
      const rawData = await provider.fetchOverlay(
        kind,
        { regionId, bounds, radiusMiles: regionJson.radiusMiles },
        {
          onProgress: (progress) => {
            // Pass through provider progress with current percent
            ctx.report({
              phase: 'overlays',
              percent: progressStart,
              message: progress.message || `Fetching ${kind}...`,
              downloadedBytes: progress.downloadedBytes,
              totalBytes: progress.totalBytes,
            });
          },
        },
      );

      // Validate the data using appropriate schema
      let validatedData: unknown;
      try {
        switch (kind) {
          case 'water':
            validatedData = validate.water(rawData);
            break;
          case 'cities':
            validatedData = validate.cities(rawData);
            break;
          case 'roads':
            validatedData = validate.roads(rawData);
            break;
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown validation error';
        throw new Error(`Validation failed for ${kind} overlay: ${message}`);
      }

      // Write validated data to temp file
      const overlayPath = getOverlayTempPath(paths, regionId, kind);
      const jsonString = JSON.stringify(validatedData, null, 2);
      await fileOps.writeFileAtomic(overlayPath, jsonString);

      // Log feature count for debugging
      const featureCount = (validatedData as { features?: unknown[] }).features
        ?.length;
      console.log(
        `[Overlays] ${kind}: ${featureCount || 0} features written to ${overlayPath}`,
      );

      // Report completion of this overlay
      await ctx.report({
        phase: 'overlays',
        percent: progressEnd,
        message: `${kind} complete (${featureCount || 0} features)`,
      });
    }

    // Report overall completion
    await ctx.report({
      phase: 'overlays',
      percent: 100,
      message: 'Overlays complete',
    });
  };
}

/**
 * Get the temp path for an overlay kind
 */
function getOverlayTempPath(
  paths: RegionPaths,
  regionId: string,
  kind: OverlayKind,
): string {
  switch (kind) {
    case 'water':
      return paths.tmpWater(regionId);
    case 'cities':
      return paths.tmpCities(regionId);
    case 'roads':
      return paths.tmpRoads(regionId);
  }
}
