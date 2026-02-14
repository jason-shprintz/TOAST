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
      // If destination exists, move it to a temporary backup first.
      const destExists = await RNFS.exists(to);
      let backupPath: string | null = null;

      if (destExists) {
        // Use a unique backup name in the same directory so the rename stays atomic.
        const backupSuffix =
          '.bak.' +
          Date.now().toString() +
          '-' +
          Math.random().toString(36).slice(2);
        backupPath = to + backupSuffix;

        // Rename existing destination to backup; this should be atomic on most platforms.
        await RNFS.moveFile(to, backupPath);
      }

      try {
        // moveFile is atomic on most platforms (uses rename syscall)
        await RNFS.moveFile(from, to);

        // New file is in place; remove the backup if we created one.
        if (backupPath !== null) {
          try {
            await RNFS.unlink(backupPath);
          } catch {
            // If cleanup of the backup fails, we still consider the move successful.
          }
        }
      } catch (error) {
        // Move failed; try to restore the original destination from the backup.
        if (backupPath !== null) {
          try {
            const backupStillExists = await RNFS.exists(backupPath);
            if (backupStillExists) {
              await RNFS.moveFile(backupPath, to);
            }
          } catch {
            // If restoration fails, we swallow this to avoid masking the original error.
          }
        }
        throw error;
      }
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
          // For Uint8Array, convert to base64 using btoa-based approach
          // that works in React Native without Buffer polyfill
          let base64 = '';
          const bytes = new Uint8Array(data);
          const len = bytes.length;
          for (let i = 0; i < len; i++) {
            base64 += String.fromCharCode(bytes[i]);
          }
          await RNFS.writeFile(tmpPath, btoa(base64), 'base64');
        }

        // Use moveAtomic to handle existing destination properly
        await this.moveAtomic(tmpPath, path);
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
