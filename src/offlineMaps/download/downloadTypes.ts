/**
 * Types for download manager and phase handlers
 * @format
 */

import type { DownloadProgress } from '../types';

/**
 * Download phases that run in sequence
 */
export type DownloadPhase =
  | 'estimating'
  | 'tiles'
  | 'dem'
  | 'overlays'
  | 'index'
  | 'finalise';

/**
 * Context provided to phase handlers
 */
export interface PhaseHandlerContext {
  jobId: string;
  regionId: string;
  /**
   * Report progress updates. Can be called multiple times during phase execution.
   * Progress will be persisted and emitted to subscribers.
   */
  report: (progress: Partial<DownloadProgress>) => Promise<void>;
  /**
   * Check if the job has been cancelled. Handlers should check this frequently
   * and exit early if true.
   */
  isCancelled: () => boolean;
  /**
   * Check if the job has been paused. Handlers should check this frequently
   * and exit early if true (throwing a special pause error).
   */
  isPaused: () => boolean;
}

/**
 * Handler function for a single download phase
 */
export type PhaseHandler = (ctx: PhaseHandlerContext) => Promise<void>;

/**
 * Map of all phase handlers
 */
export interface PhaseHandlers {
  estimating: PhaseHandler;
  tiles: PhaseHandler;
  dem: PhaseHandler;
  overlays: PhaseHandler;
  index: PhaseHandler;
  finalise: PhaseHandler;
}

/**
 * Download manager interface
 */
export interface DownloadManager {
  /**
   * Start a new download job
   */
  start(job: { jobId: string; regionId: string }): Promise<void>;
  /**
   * Pause a running download job
   */
  pause(jobId: string): Promise<void>;
  /**
   * Resume a paused or failed download job
   */
  resume(jobId: string, regionId?: string): Promise<void>;
  /**
   * Cancel a download job and clean up
   */
  cancel(jobId: string): Promise<void>;
  /**
   * Subscribe to progress updates for a job
   * @returns unsubscribe function
   */
  onProgress(jobId: string, cb: ProgressCallback): () => void;
  /**
   * Get the current status of a job
   */
  getStatus(jobId: string): DownloadJobStatus | undefined;
}

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: DownloadProgress) => void;

/**
 * Internal job status
 */
export type DownloadJobStatus =
  | 'running'
  | 'paused'
  | 'cancelled'
  | 'completed'
  | 'error';
