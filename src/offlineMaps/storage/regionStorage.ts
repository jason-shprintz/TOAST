/**
 * Region package lifecycle operations for offline maps
 * @format
 */

import { createFileOps, FileOps } from './fileOps';
import { createRegionPaths, RegionPaths } from './paths';

/**
 * Manifest file structure
 */
interface ManifestFile {
  name: string;
  sizeBytes: number;
}

interface Manifest {
  schemaVersion: number;
  generatedAt: string;
  regionId: string;
  files: ManifestFile[];
}

/**
 * Interface defining region storage operations
 */
export interface RegionStorage {
  init(): Promise<void>;
  ensureTempRegionDir(regionId: string): Promise<string>;
  ensureFinalRegionDir(regionId: string): Promise<string>;
  writeTempJson(
    regionId: string,
    filename: string,
    json: unknown,
  ): Promise<void>;
  validateTempPackage(regionId: string): Promise<void>;
  finaliseTempToFinal(regionId: string): Promise<void>;
  deleteRegion(regionId: string): Promise<void>;
  deleteTemp(regionId: string): Promise<void>;
  getTempSizeBytes(regionId: string): Promise<number>;
  getFinalSizeBytes(regionId: string): Promise<number>;
}

/**
 * Required files for a valid region package
 */
const REQUIRED_FILES = [
  'region.json',
  'tiles.mbtiles',
  'water.json',
  'cities.json',
  'roads.json',
];

/**
 * Validates that a filename is safe (no path traversal)
 */
function validateFilename(filename: string): void {
  if (!filename || typeof filename !== 'string') {
    throw new Error('filename must be a non-empty string');
  }

  // Reject path separators and path traversal attempts
  if (
    filename.includes('/') ||
    filename.includes('\\') ||
    filename.includes('..')
  ) {
    throw new Error(
      `Invalid filename: "${filename}". Filenames cannot contain path separators or '..'`,
    );
  }

  // Reject filenames starting with '.' or containing null characters
  if (filename.startsWith('.') || filename.includes('\0')) {
    throw new Error(
      `Invalid filename: "${filename}". Filenames cannot start with '.' or contain null characters`,
    );
  }
}

/**
 * Creates region storage operations
 */
export function createRegionStorage(
  paths?: RegionPaths,
  fileOps?: FileOps,
): RegionStorage {
  const regionPaths = paths || createRegionPaths();
  const ops = fileOps || createFileOps();

  return {
    /**
     * Initializes the storage directories
     */
    async init(): Promise<void> {
      await ops.ensureDir(regionPaths.baseDir);
      await ops.ensureDir(regionPaths.regionsDir);
      await ops.ensureDir(regionPaths.tmpDir);
    },

    /**
     * Ensures temp region directory exists and returns its path
     */
    async ensureTempRegionDir(regionId: string): Promise<string> {
      const dirPath = regionPaths.tmpRegionDir(regionId);
      await ops.ensureDir(dirPath);
      return dirPath;
    },

    /**
     * Ensures final region directory exists and returns its path
     */
    async ensureFinalRegionDir(regionId: string): Promise<string> {
      const dirPath = regionPaths.regionDir(regionId);
      await ops.ensureDir(dirPath);
      return dirPath;
    },

    /**
     * Writes JSON to a temp region file atomically
     */
    async writeTempJson(
      regionId: string,
      filename: string,
      json: unknown,
    ): Promise<void> {
      // Validate filename to prevent path traversal
      validateFilename(filename);

      const dirPath = regionPaths.tmpRegionDir(regionId);
      await ops.ensureDir(dirPath);

      const filePath = `${dirPath}/${filename}`;
      const data = JSON.stringify(json, null, 2);
      await ops.writeFileAtomic(filePath, data);
    },

    /**
     * Validates that a temp region package contains all required files
     * Throws an error if validation fails
     */
    async validateTempPackage(regionId: string): Promise<void> {
      const tmpDir = regionPaths.tmpRegionDir(regionId);

      // Check if temp directory exists
      const tmpDirExists = await ops.exists(tmpDir);
      if (!tmpDirExists) {
        throw new Error(
          `Validation failed: Temp directory does not exist for region ${regionId}`,
        );
      }

      // Check all required files exist and are valid
      for (const filename of REQUIRED_FILES) {
        const filePath = `${tmpDir}/${filename}`;
        const exists = await ops.exists(filePath);

        if (!exists) {
          throw new Error(
            `Validation failed: Required file ${filename} is missing for region ${regionId}`,
          );
        }

        // Check file size is greater than 0 and that it's actually a file
        const stat = await ops.stat(filePath);
        if (stat.isDirectory) {
          throw new Error(
            `Validation failed: Required file ${filename} is a directory, not a file, for region ${regionId}`,
          );
        }
        if (stat.size === 0) {
          throw new Error(
            `Validation failed: Required file ${filename} is empty for region ${regionId}`,
          );
        }

        // Validate JSON files can be parsed
        if (filename.endsWith('.json')) {
          try {
            const content = await ops.readFile(filePath);
            JSON.parse(content);
          } catch (error) {
            throw new Error(
              `Validation failed: File ${filename} is not valid JSON for region ${regionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          }
        }
      }

      // Check manifest exists if present
      const manifestPath = regionPaths.tmpManifest(regionId);
      const manifestExists = await ops.exists(manifestPath);
      if (manifestExists) {
        try {
          const content = await ops.readFile(manifestPath);
          const manifest: Manifest = JSON.parse(content);

          // Validate manifest structure with explicit type checks
          if (
            typeof manifest.schemaVersion !== 'number' ||
            typeof manifest.generatedAt !== 'string' ||
            typeof manifest.regionId !== 'string' ||
            !Array.isArray(manifest.files)
          ) {
            throw new Error(
              'Invalid manifest structure: missing or incorrect types for required fields',
            );
          }

          // Validate each file entry in manifest
          for (const file of manifest.files) {
            if (
              typeof file !== 'object' ||
              file === null ||
              typeof file.name !== 'string' ||
              typeof file.sizeBytes !== 'number'
            ) {
              throw new Error(
                `Invalid manifest structure: file entry has incorrect shape`,
              );
            }
          }

          // Validate regionId matches
          if (manifest.regionId !== regionId) {
            throw new Error(
              `Manifest regionId ${manifest.regionId} does not match ${regionId}`,
            );
          }

          // Validate all files listed in manifest exist
          for (const file of manifest.files) {
            const filePath = `${tmpDir}/${file.name}`;
            const exists = await ops.exists(filePath);
            if (!exists) {
              throw new Error(
                `Validation failed: File ${file.name} listed in manifest but not found`,
              );
            }

            // Validate file size matches
            const stat = await ops.stat(filePath);
            if (stat.size !== file.sizeBytes) {
              throw new Error(
                `Validation failed: File ${file.name} size mismatch. Expected ${file.sizeBytes}, got ${stat.size}`,
              );
            }
          }
        } catch (error) {
          throw new Error(
            `Validation failed: Invalid manifest for region ${regionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }
    },

    /**
     * Finalizes a temp region package by moving it to the final location atomically
     * This includes backup and rollback logic to ensure existing regions are not corrupted
     */
    async finaliseTempToFinal(regionId: string): Promise<void> {
      console.log(
        `[RegionStorage] Starting finalization for region ${regionId}`,
      );

      // Step 1: Validate the temp package
      await this.validateTempPackage(regionId);
      console.log(`[RegionStorage] Validation passed for region ${regionId}`);

      // Step 2: Generate manifest if not exists
      const manifestPath = regionPaths.tmpManifest(regionId);
      const manifestExists = await ops.exists(manifestPath);
      if (!manifestExists) {
        const tmpDir = regionPaths.tmpRegionDir(regionId);
        const files = await ops.listDir(tmpDir);
        const manifestFiles: ManifestFile[] = [];

        for (const filename of files) {
          const filePath = `${tmpDir}/${filename}`;
          const stat = await ops.stat(filePath);
          if (!stat.isDirectory) {
            manifestFiles.push({
              name: filename,
              sizeBytes: stat.size,
            });
          }
        }

        const manifest: Manifest = {
          schemaVersion: 1,
          generatedAt: new Date().toISOString(),
          regionId,
          files: manifestFiles,
        };

        await ops.writeFileAtomic(
          manifestPath,
          JSON.stringify(manifest, null, 2),
        );
        console.log(
          `[RegionStorage] Generated manifest for region ${regionId}`,
        );
      }

      // Step 3: Ensure regions directory exists
      await ops.ensureDir(regionPaths.regionsDir);

      // Step 4: Backup existing final region if it exists
      const finalDir = regionPaths.regionDir(regionId);
      const finalExists = await ops.exists(finalDir);
      let backupDir: string | null = null;

      if (finalExists) {
        const timestamp = Date.now();
        backupDir = `${regionPaths.regionsDir}/${regionId}.bak.${timestamp}`;
        await ops.moveAtomic(finalDir, backupDir);
        console.log(
          `[RegionStorage] Created backup of existing region ${regionId} at ${backupDir}`,
        );
      }

      // Step 5: Move temp to final atomically
      const tmpDir = regionPaths.tmpRegionDir(regionId);
      try {
        await ops.moveAtomic(tmpDir, finalDir);
        console.log(
          `[RegionStorage] Successfully moved temp to final for region ${regionId}`,
        );

        // Step 6: Delete backup if move succeeded
        if (backupDir) {
          await ops.remove(backupDir);
          console.log(
            `[RegionStorage] Cleaned up backup for region ${regionId}`,
          );
        }

        console.log(
          `[RegionStorage] Finalization completed successfully for region ${regionId}`,
        );
      } catch (error) {
        console.error(
          `[RegionStorage] Finalization failed for region ${regionId}:`,
          error,
        );

        // Step 6 (failure): Restore backup if move failed
        if (backupDir) {
          try {
            await ops.moveAtomic(backupDir, finalDir);
            console.log(
              `[RegionStorage] Restored backup for region ${regionId} after failure`,
            );
          } catch (restoreError) {
            console.error(
              `[RegionStorage] Failed to restore backup for region ${regionId}:`,
              restoreError,
            );
            // If restore fails, we're in a bad state
            throw new Error(
              `Failed to finalize region and restore backup: ${error instanceof Error ? error.message : 'Unknown error'}. Backup restore error: ${restoreError instanceof Error ? restoreError.message : 'Unknown error'}`,
            );
          }
        }
        throw new Error(
          `Failed to finalize region ${regionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },

    /**
     * Deletes a region completely (both final and temp)
     * Does not throw if region doesn't exist
     */
    async deleteRegion(regionId: string): Promise<void> {
      const finalDir = regionPaths.regionDir(regionId);
      const tmpDir = regionPaths.tmpRegionDir(regionId);

      // Remove both directories, best effort
      await ops.remove(finalDir);
      await ops.remove(tmpDir);
    },

    /**
     * Deletes temp region directory
     * Does not throw if directory doesn't exist
     */
    async deleteTemp(regionId: string): Promise<void> {
      const tmpDir = regionPaths.tmpRegionDir(regionId);
      await ops.remove(tmpDir);
    },

    /**
     * Calculates total size of temp region directory in bytes
     */
    async getTempSizeBytes(regionId: string): Promise<number> {
      const tmpDir = regionPaths.tmpRegionDir(regionId);
      return await calculateDirectorySize(tmpDir, ops);
    },

    /**
     * Calculates total size of final region directory in bytes
     */
    async getFinalSizeBytes(regionId: string): Promise<number> {
      const finalDir = regionPaths.regionDir(regionId);
      return await calculateDirectorySize(finalDir, ops);
    },
  };
}

/**
 * Helper function to calculate directory size recursively
 */
async function calculateDirectorySize(
  dirPath: string,
  ops: FileOps,
): Promise<number> {
  const exists = await ops.exists(dirPath);
  if (!exists) {
    return 0;
  }

  const stat = await ops.stat(dirPath);
  if (!stat.isDirectory) {
    return stat.size;
  }

  let totalSize = 0;
  const items = await ops.listDir(dirPath);

  for (const item of items) {
    const itemPath = `${dirPath}/${item}`;
    const itemStat = await ops.stat(itemPath);

    if (itemStat.isDirectory) {
      totalSize += await calculateDirectorySize(itemPath, ops);
    } else {
      totalSize += itemStat.size;
    }
  }

  return totalSize;
}
