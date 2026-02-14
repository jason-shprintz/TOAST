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
    regionDir: (regionId: string) => `${regionsDir}/${regionId}`,
    tmpRegionDir: (regionId: string) => `${tmpDir}/${regionId}`,

    // Final region file paths
    regionJson: (regionId: string) => `${regionsDir}/${regionId}/region.json`,
    tilesMbtiles: (regionId: string) =>
      `${regionsDir}/${regionId}/tiles.mbtiles`,
    dem: (regionId: string) => `${regionsDir}/${regionId}/elevation.dem`,
    water: (regionId: string) => `${regionsDir}/${regionId}/water.json`,
    cities: (regionId: string) => `${regionsDir}/${regionId}/cities.json`,
    roads: (regionId: string) => `${regionsDir}/${regionId}/roads.json`,
    index: (regionId: string) => `${regionsDir}/${regionId}/index.sqlite`,
    manifest: (regionId: string) => `${regionsDir}/${regionId}/manifest.json`,

    // Temp region file paths
    tmpRegionJson: (regionId: string) => `${tmpDir}/${regionId}/region.json`,
    tmpTilesMbtiles: (regionId: string) =>
      `${tmpDir}/${regionId}/tiles.mbtiles`,
    tmpDem: (regionId: string) => `${tmpDir}/${regionId}/elevation.dem`,
    tmpWater: (regionId: string) => `${tmpDir}/${regionId}/water.json`,
    tmpCities: (regionId: string) => `${tmpDir}/${regionId}/cities.json`,
    tmpRoads: (regionId: string) => `${tmpDir}/${regionId}/roads.json`,
    tmpIndex: (regionId: string) => `${tmpDir}/${regionId}/index.sqlite`,
    tmpManifest: (regionId: string) => `${tmpDir}/${regionId}/manifest.json`,
  };
}
