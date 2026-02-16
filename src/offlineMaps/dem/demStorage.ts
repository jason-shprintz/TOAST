/**
 * DEM storage operations
 * @format
 */

import RNFS from 'react-native-fs';
import type { FileOps } from '../storage/fileOps';
import type { RegionPaths } from '../storage/paths';

/**
 * DEM storage interface
 */
export interface DemStorage {
  writeTempDem(regionId: string, bytes: Uint8Array): Promise<void>;
  readDemBytes(path: string): Promise<Uint8Array>;
}

/**
 * Creates DEM storage operations
 */
export function createDemStorage(
  paths: RegionPaths,
  fileOps: FileOps,
): DemStorage {
  return {
    /**
     * Writes DEM data to temp region directory
     */
    async writeTempDem(regionId: string, bytes: Uint8Array): Promise<void> {
      const dirPath = paths.tmpRegionDir(regionId);
      await fileOps.ensureDir(dirPath);

      const filePath = paths.tmpDem(regionId);
      await fileOps.writeFileAtomic(filePath, bytes);
    },

    /**
     * Reads DEM bytes from a file path
     */
    async readDemBytes(path: string): Promise<Uint8Array> {
      // Use RNFS to read as base64, then convert to Uint8Array
      const base64Data = await RNFS.readFile(path, 'base64');

      // Convert base64 to Uint8Array efficiently
      // Note: atob is available in React Native's JavaScript environment
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);

      // Batch conversion is more efficient than individual character access
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return bytes;
    },
  };
}
