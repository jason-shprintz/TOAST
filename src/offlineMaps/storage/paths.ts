/**
 * Region path helpers for offline maps storage
 * @format
 */

import RNFS from 'react-native-fs';

/**
 * Interface defining all path helpers for region storage
 */
export interface RegionPaths {
  baseDir: string;
  regionsDir: string;
  tmpDir: string;

  regionDir(regionId: string): string;
  tmpRegionDir(regionId: string): string;

  // Final region file paths
  regionJson(regionId: string): string;
  tilesMbtiles(regionId: string): string;
  dem(regionId: string): string;
  water(regionId: string): string;
  cities(regionId: string): string;
  roads(regionId: string): string;
  index(regionId: string): string;
  manifest(regionId: string): string;

  // Temp region file paths
  tmpRegionJson(regionId: string): string;
  tmpTilesMbtiles(regionId: string): string;
  tmpDem(regionId: string): string;
  tmpWater(regionId: string): string;
  tmpCities(regionId: string): string;
  tmpRoads(regionId: string): string;
  tmpIndex(regionId: string): string;
  tmpManifest(regionId: string): string;
}

/**
 * Validates that a regionId is safe for use in filesystem paths
 * Prevents path traversal attacks by rejecting IDs with path separators
 */
function validateRegionId(regionId: string): void {
  if (!regionId || typeof regionId !== 'string') {
    throw new Error('regionId must be a non-empty string');
  }

  // Reject path separators and special path components
  if (
    regionId.includes('/') ||
    regionId.includes('\\') ||
    regionId.includes('..')
  ) {
    throw new Error(
      `Invalid regionId: "${regionId}". Region IDs cannot contain path separators or '..'`,
    );
  }

  // Reject other potentially problematic characters
  if (regionId.startsWith('.') || regionId.includes('\0')) {
    throw new Error(
      `Invalid regionId: "${regionId}". Region IDs cannot start with '.' or contain null characters`,
    );
  }
}

/**
 * Creates region path helpers using the app's document directory
 */
export function createRegionPaths(): RegionPaths {
  const baseDir = `${RNFS.DocumentDirectoryPath}/offline`;
  const regionsDir = `${baseDir}/regions`;
  const tmpDir = `${baseDir}/tmp`;

  return {
    baseDir,
    regionsDir,
    tmpDir,

    // Region directories
    regionDir: (regionId: string) => {
      validateRegionId(regionId);
      return `${regionsDir}/${regionId}`;
    },
    tmpRegionDir: (regionId: string) => {
      validateRegionId(regionId);
      return `${tmpDir}/${regionId}`;
    },

    // Final region file paths
    regionJson: (regionId: string) => {
      validateRegionId(regionId);
      return `${regionsDir}/${regionId}/region.json`;
    },
    tilesMbtiles: (regionId: string) => {
      validateRegionId(regionId);
      return `${regionsDir}/${regionId}/tiles.mbtiles`;
    },
    dem: (regionId: string) => {
      validateRegionId(regionId);
      return `${regionsDir}/${regionId}/elevation.dem`;
    },
    water: (regionId: string) => {
      validateRegionId(regionId);
      return `${regionsDir}/${regionId}/water.json`;
    },
    cities: (regionId: string) => {
      validateRegionId(regionId);
      return `${regionsDir}/${regionId}/cities.json`;
    },
    roads: (regionId: string) => {
      validateRegionId(regionId);
      return `${regionsDir}/${regionId}/roads.json`;
    },
    index: (regionId: string) => {
      validateRegionId(regionId);
      return `${regionsDir}/${regionId}/index.sqlite`;
    },
    manifest: (regionId: string) => {
      validateRegionId(regionId);
      return `${regionsDir}/${regionId}/manifest.json`;
    },

    // Temp region file paths
    tmpRegionJson: (regionId: string) => {
      validateRegionId(regionId);
      return `${tmpDir}/${regionId}/region.json`;
    },
    tmpTilesMbtiles: (regionId: string) => {
      validateRegionId(regionId);
      return `${tmpDir}/${regionId}/tiles.mbtiles`;
    },
    tmpDem: (regionId: string) => {
      validateRegionId(regionId);
      return `${tmpDir}/${regionId}/elevation.dem`;
    },
    tmpWater: (regionId: string) => {
      validateRegionId(regionId);
      return `${tmpDir}/${regionId}/water.json`;
    },
    tmpCities: (regionId: string) => {
      validateRegionId(regionId);
      return `${tmpDir}/${regionId}/cities.json`;
    },
    tmpRoads: (regionId: string) => {
      validateRegionId(regionId);
      return `${tmpDir}/${regionId}/roads.json`;
    },
    tmpIndex: (regionId: string) => {
      validateRegionId(regionId);
      return `${tmpDir}/${regionId}/index.sqlite`;
    },
    tmpManifest: (regionId: string) => {
      validateRegionId(regionId);
      return `${tmpDir}/${regionId}/manifest.json`;
    },
  };
}
