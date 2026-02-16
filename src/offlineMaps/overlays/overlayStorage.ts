/**
 * Overlay storage operations for temp region directory
 * @format
 */

import type { OverlayKind } from './overlayTypes';
import type { FileOps } from '../storage/fileOps';
import type { RegionPaths } from '../storage/paths';

/**
 * Storage interface for overlay JSON files
 */
export interface OverlayStorage {
  writeTempOverlay(
    regionId: string,
    kind: OverlayKind,
    json: unknown,
  ): Promise<void>;
  readTempOverlay(regionId: string, kind: OverlayKind): Promise<string>;
}

/**
 * Get the temp path for an overlay kind
 */
function getTempOverlayPath(
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

/**
 * Create overlay storage implementation
 */
export function createOverlayStorage(
  paths: RegionPaths,
  fileOps: FileOps,
): OverlayStorage {
  return {
    async writeTempOverlay(
      regionId: string,
      kind: OverlayKind,
      json: unknown,
    ): Promise<void> {
      const path = getTempOverlayPath(paths, regionId, kind);
      const jsonString = JSON.stringify(json, null, 2);
      await fileOps.writeFileAtomic(path, jsonString);
    },

    async readTempOverlay(
      regionId: string,
      kind: OverlayKind,
    ): Promise<string> {
      const path = getTempOverlayPath(paths, regionId, kind);
      return await fileOps.readFile(path);
    },
  };
}
