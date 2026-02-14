/**
 * Persistent state storage for download jobs
 * @format
 */

import type { DownloadPhase } from './downloadTypes';
import type { FileOps } from '../storage/fileOps';

/**
 * Persisted download state schema
 */
export interface PersistedDownloadState {
  schemaVersion: 1;
  jobId: string;
  regionId: string;

  status: 'running' | 'paused' | 'cancelled' | 'completed' | 'error';

  currentPhase: DownloadPhase;
  phaseIndex: number; // 0..N-1

  // If totals unknown, allow undefined
  downloadedBytes?: number;
  totalBytes?: number;

  updatedAt: string; // ISO
  error?: { message: string; phase: DownloadPhase; code?: string };
}

/**
 * Interface for download state persistence
 */
export interface DownloadStateStore {
  load(jobId: string, regionId: string): Promise<PersistedDownloadState | null>;
  save(state: PersistedDownloadState): Promise<void>;
  remove(jobId: string, regionId: string): Promise<void>;
}

/**
 * Creates a download state store
 * @param fileOps File operations interface
 * @param tmpDir Base temporary directory path
 */
export function createDownloadStateStore(
  fileOps: FileOps,
  tmpDir: string,
): DownloadStateStore {
  /**
   * Get the path to the state file for a region
   */
  function getStatePath(regionId: string): string {
    return `${tmpDir}/${regionId}/download_state.json`;
  }

  return {
    /**
     * Load persisted state for a job
     */
    async load(
      jobId: string,
      regionId: string,
    ): Promise<PersistedDownloadState | null> {
      const path = getStatePath(regionId);
      const exists = await fileOps.exists(path);

      if (!exists) {
        return null;
      }

      try {
        const content = await fileOps.readFile(path);
        const state = JSON.parse(content) as PersistedDownloadState;

        // Verify the state belongs to this job
        if (state.jobId !== jobId) {
          return null;
        }

        return state;
      } catch {
        // If we can't parse the state, treat it as not found
        return null;
      }
    },

    /**
     * Save state atomically
     */
    async save(state: PersistedDownloadState): Promise<void> {
      const path = getStatePath(state.regionId);

      // Ensure directory exists
      const dir = path.substring(0, path.lastIndexOf('/'));
      await fileOps.ensureDir(dir);

      // Update timestamp
      state.updatedAt = new Date().toISOString();

      // Write atomically
      const content = JSON.stringify(state, null, 2);
      await fileOps.writeFileAtomic(path, content);
    },

    /**
     * Remove state file
     */
    async remove(jobId: string, regionId: string): Promise<void> {
      const path = getStatePath(regionId);
      await fileOps.remove(path);
    },
  };
}
