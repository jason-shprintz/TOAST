/**
 * Phase handler for downloading and storing tiles in MBTiles format
 * @format
 */

import { withRetry } from '../download/retry';
import { regionToBounds } from '../geo/geoMath';
import { createDefaultMetadata } from './mbtilesSchema';
import type { MbtilesWriter } from './mbtilesWriter';
import type { TileFetcher } from './tileDownloader';
import type {
  PhaseHandler,
  PhaseHandlerContext,
} from '../download/downloadTypes';
import type { TileCoord } from '../geo/coverage';
import type { FileOps } from '../storage/fileOps';
import type { RegionPaths } from '../storage/paths';
import type { OfflineRegion } from '../types';

/**
 * Options for creating the tiles phase handler
 */
export interface TilesPhaseHandlerOptions {
  paths: RegionPaths;
  fileOps: FileOps;
  fetcher: TileFetcher;
  writerFactory: () => MbtilesWriter;
  batchSize?: number;
  maxRetries?: number;
  getRegion: (regionId: string) => Promise<OfflineRegion | null>;
  getTilesToDownload: (regionId: string) => Promise<TileCoord[]>;
}

/**
 * Default batch size for tile inserts
 */
const DEFAULT_BATCH_SIZE = 250;

/**
 * Default number of retries for failed tile fetches
 */
const DEFAULT_MAX_RETRIES = 3;

/**
 * Creates a phase handler for the tiles download phase
 */
export function createTilesPhaseHandler(
  opts: TilesPhaseHandlerOptions,
): PhaseHandler {
  const batchSize = opts.batchSize ?? DEFAULT_BATCH_SIZE;
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;

  return async (ctx: PhaseHandlerContext): Promise<void> => {
    const { regionId } = ctx;
    let writer: MbtilesWriter | null = null;

    try {
      // 1. Ensure temp region directory exists
      const tmpDir = opts.paths.tmpRegionDir(regionId);
      await opts.fileOps.ensureDir(tmpDir);

      // 2. Get region info and tile list
      const region = await opts.getRegion(regionId);
      if (!region) {
        throw new Error(`Region ${regionId} not found`);
      }

      const tiles = await opts.getTilesToDownload(regionId);
      if (tiles.length === 0) {
        await ctx.report({
          phase: 'tiles',
          percent: 100,
          message: 'No tiles to download',
        });
        return;
      }

      // 3. Create/open MBTiles database
      const mbtilesPath = opts.paths.tmpTilesMbtiles(regionId);
      writer = opts.writerFactory();
      await writer.open(mbtilesPath);
      await writer.initSchema();

      // 4. Set metadata
      const minZoom = Math.min(...tiles.map((t) => t.z));
      const maxZoom = Math.max(...tiles.map((t) => t.z));

      // Compute bounds from region using its actual radius
      const bounds = regionToBounds(
        { lat: region.centerLat, lng: region.centerLng },
        region.radiusMiles,
      );

      const metadata = createDefaultMetadata(bounds, minZoom, maxZoom);
      // Convert metadata to Record<string, string> format expected by setMetadata
      const metadataRecord: Record<string, string> = Object.entries(
        metadata,
      ).reduce(
        (acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        },
        {} as Record<string, string>,
      );
      await writer.setMetadata(metadataRecord);

      // 5. Download and insert tiles in batches
      let batch: Array<{ z: number; x: number; y: number; data: Uint8Array }> =
        [];
      let downloadedBytes = 0;
      let downloadedTiles = 0;
      const totalTiles = tiles.length;

      for (let i = 0; i < tiles.length; i++) {
        // Check for pause/cancel before each tile
        if (ctx.isCancelled()) {
          throw new Error('Tile download cancelled');
        }

        if (ctx.isPaused()) {
          // Flush any remaining batch before pausing
          if (batch.length > 0) {
            await writer.insertTilesBatch(batch);
            batch = [];

            // Report progress after flushing the final batch before pausing
            const percent = (downloadedTiles / totalTiles) * 100;
            await ctx.report({
              phase: 'tiles',
              downloadedBytes,
              percent,
              message: `Downloading tiles (${downloadedTiles}/${totalTiles})`,
            });
          }
          return;
        }

        const tile = tiles[i];

        // Fetch tile data with retry logic
        let tileData: Uint8Array;
        try {
          tileData = await withRetry(
            () =>
              opts.fetcher.fetchTile({
                z: tile.z,
                x: tile.x,
                y: tile.y,
              }),
            {
              retries: maxRetries,
              baseDelayMs: 1000,
              maxDelayMs: 10000,
              jitter: true,
              retryOn: (err) => {
                // Retry on network errors but not on other types of errors
                if (!err) return false;
                if (typeof err === 'object' && err !== null) {
                  const error = err as { code?: string; message?: string };
                  // Retry on common network errors
                  const transientCodes = [
                    'ETIMEDOUT',
                    'ECONNRESET',
                    'EAI_AGAIN',
                    'TRANSIENT',
                    'ENOTFOUND',
                    'ENETUNREACH',
                  ];
                  if (error.code && transientCodes.includes(error.code)) {
                    return true;
                  }
                  if (
                    error.message &&
                    (error.message.toLowerCase().includes('timeout') ||
                      error.message.toLowerCase().includes('network'))
                  ) {
                    return true;
                  }
                }
                return false;
              },
            },
          );
        } catch (error) {
          throw new Error(
            `Failed to fetch tile z=${tile.z} x=${tile.x} y=${tile.y} after ${maxRetries} retries: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }

        // Add to batch
        batch.push({
          z: tile.z,
          x: tile.x,
          y: tile.y,
          data: tileData,
        });

        downloadedBytes += tileData.length;
        downloadedTiles++;

        // Write batch when full
        if (batch.length >= batchSize) {
          await writer.insertTilesBatch(batch);
          batch = [];

          // Report progress
          const percent = (downloadedTiles / totalTiles) * 100;
          await ctx.report({
            phase: 'tiles',
            downloadedBytes,
            percent,
            message: `Downloading tiles (${downloadedTiles}/${totalTiles})`,
          });
        }
      }

      // 6. Flush final batch
      if (batch.length > 0) {
        await writer.insertTilesBatch(batch);
      }

      // 7. Integrity check: verify we can read a tile
      if (tiles.length > 0) {
        const sampleTile = tiles[0];
        const retrieved = await writer.getTile(
          sampleTile.z,
          sampleTile.x,
          sampleTile.y,
        );

        if (!retrieved || retrieved.length === 0) {
          throw new Error(
            `Integrity check failed: cannot retrieve tile z=${sampleTile.z} x=${sampleTile.x} y=${sampleTile.y}`,
          );
        }
      }

      // 8. Report completion
      await ctx.report({
        phase: 'tiles',
        downloadedBytes,
        percent: 100,
        message: `Downloaded ${downloadedTiles} tiles`,
      });
    } finally {
      // 9. Always close the database
      if (writer) {
        await writer.close();
      }
    }
  };
}
