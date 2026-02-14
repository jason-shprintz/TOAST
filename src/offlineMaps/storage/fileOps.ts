/**
 * Safe file operations for offline maps storage
 * @format
 */

import RNFS from 'react-native-fs';

/**
 * Interface defining safe file operations
 */
export interface FileOps {
  ensureDir(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  remove(path: string): Promise<void>;
  moveAtomic(from: string, to: string): Promise<void>;
  writeFileAtomic(path: string, data: string | Uint8Array): Promise<void>;
  readFile(path: string): Promise<string>;
  listDir(path: string): Promise<string[]>;
  stat(path: string): Promise<{ size: number; isDirectory: boolean }>;
}

/**
 * Creates file operations using react-native-fs
 */
export function createFileOps(): FileOps {
  return {
    /**
     * Ensures a directory exists, creating it if necessary
     */
    async ensureDir(path: string): Promise<void> {
      const exists = await RNFS.exists(path);
      if (!exists) {
        await RNFS.mkdir(path, { NSURLIsExcludedFromBackupKey: true });
      }
    },

    /**
     * Checks if a file or directory exists
     */
    async exists(path: string): Promise<boolean> {
      return await RNFS.exists(path);
    },

    /**
     * Removes a file or directory recursively
     * Does not throw if the path doesn't exist
     */
    async remove(path: string): Promise<void> {
      try {
        const exists = await RNFS.exists(path);
        if (exists) {
          await RNFS.unlink(path);
        }
      } catch (error) {
        // If the file/directory doesn't exist, we consider it a success
        if (
          error instanceof Error &&
          !error.message.includes('does not exist')
        ) {
          throw error;
        }
      }
    },

    /**
     * Moves a file or directory atomically
     * On most platforms, this is a rename operation which is atomic
     */
    async moveAtomic(from: string, to: string): Promise<void> {
      // First check if destination exists and remove it
      const destExists = await RNFS.exists(to);
      if (destExists) {
        await RNFS.unlink(to);
      }

      // moveFile is atomic on most platforms (uses rename syscall)
      await RNFS.moveFile(from, to);
    },

    /**
     * Writes a file atomically by writing to a temp file first, then moving it
     * This prevents corruption if the write operation is interrupted
     */
    async writeFileAtomic(
      path: string,
      data: string | Uint8Array,
    ): Promise<void> {
      const tmpPath = `${path}.tmp`;

      try {
        // Write to temporary file
        if (typeof data === 'string') {
          await RNFS.writeFile(tmpPath, data, 'utf8');
        } else {
          // For Uint8Array, convert to base64 and write
          const base64 = Buffer.from(data).toString('base64');
          await RNFS.writeFile(tmpPath, base64, 'base64');
        }

        // Atomic move to final location
        await RNFS.moveFile(tmpPath, path);
      } catch (error) {
        // Clean up temp file on error
        try {
          const tmpExists = await RNFS.exists(tmpPath);
          if (tmpExists) {
            await RNFS.unlink(tmpPath);
          }
        } catch {
          // Ignore cleanup errors
        }
        throw error;
      }
    },

    /**
     * Reads a file as a UTF-8 string
     */
    async readFile(path: string): Promise<string> {
      return await RNFS.readFile(path, 'utf8');
    },

    /**
     * Lists all items in a directory
     */
    async listDir(path: string): Promise<string[]> {
      const items = await RNFS.readDir(path);
      return items.map((item) => item.name);
    },

    /**
     * Gets file/directory stats
     */
    async stat(path: string): Promise<{ size: number; isDirectory: boolean }> {
      const stat = await RNFS.stat(path);
      return {
        size: Number(stat.size),
        isDirectory: stat.isDirectory(),
      };
    },
  };
}
