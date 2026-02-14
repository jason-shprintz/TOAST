/**
 * Download manager for resumable download jobs
 * @format
 */

import { withRetry, type RetryOptions } from './retry';
import type { DownloadProgress } from '../types';
import type {
  DownloadStateStore,
  PersistedDownloadState,
} from './downloadStateStore';
import type {
  DownloadManager,
  DownloadJobStatus,
  DownloadPhase,
  PhaseHandlers,
  PhaseHandlerContext,
  ProgressCallback,
} from './downloadTypes';

/**
 * Special error thrown when a job is paused
 */
class PausedError extends Error {
  constructor() {
    super('Job paused');
    this.name = 'PausedError';
  }
}

/**
 * Special error thrown when a job is cancelled
 */
class CancelledError extends Error {
  constructor() {
    super('Job cancelled');
    this.name = 'CancelledError';
  }
}

/**
 * Ordered list of phases
 */
const PHASE_ORDER: DownloadPhase[] = [
  'estimating',
  'tiles',
  'dem',
  'overlays',
  'index',
  'finalise',
];

/**
 * Internal state for a running job
 */
interface JobState {
  jobId: string;
  regionId: string;
  status: DownloadJobStatus;
  currentPhase: DownloadPhase;
  phaseIndex: number;
  downloadedBytes?: number;
  totalBytes?: number;
  error?: { message: string; phase: DownloadPhase; code?: string };
  progressCallbacks: Set<ProgressCallback>;
  cancelled: boolean;
  paused: boolean;
  running: Promise<void> | null;
}

/**
 * Options for creating download manager
 */
export interface DownloadManagerOptions {
  store: DownloadStateStore;
  handlers: PhaseHandlers;
  retryOptions?: Partial<RetryOptions>;
}

/**
 * Create a download manager
 */
export function createDownloadManager(
  opts: DownloadManagerOptions,
): DownloadManager {
  const { store, handlers } = opts;

  // Default retry options
  const retryOptions: RetryOptions = {
    retries: 5,
    baseDelayMs: 500,
    maxDelayMs: 8000,
    jitter: true,
    retryOn: (err: unknown) => {
      if (!err || typeof err !== 'object') {
        return false;
      }
      const error = err as { code?: string; message?: string };
      const transientCodes = [
        'ETIMEDOUT',
        'ECONNRESET',
        'EAI_AGAIN',
        'TRANSIENT',
      ];
      if (error.code && transientCodes.includes(error.code)) {
        return true;
      }
      if (error.message && error.message.toLowerCase().includes('timeout')) {
        return true;
      }
      return false;
    },
    ...opts.retryOptions,
  };

  // Active jobs map
  const jobs = new Map<string, JobState>();

  /**
   * Emit progress to all subscribers
   */
  function emitProgress(jobId: string, progress: DownloadProgress): void {
    const job = jobs.get(jobId);
    if (job) {
      job.progressCallbacks.forEach((cb) => {
        try {
          cb(progress);
        } catch (err) {
          // Ignore callback errors
          console.error('Progress callback error:', err);
        }
      });
    }
  }

  /**
   * Save current state to disk
   */
  async function persistState(job: JobState): Promise<void> {
    const state: PersistedDownloadState = {
      schemaVersion: 1,
      jobId: job.jobId,
      regionId: job.regionId,
      status: job.status,
      currentPhase: job.currentPhase,
      phaseIndex: job.phaseIndex,
      downloadedBytes: job.downloadedBytes,
      totalBytes: job.totalBytes,
      updatedAt: new Date().toISOString(),
      error: job.error,
    };

    await store.save(state);
  }

  /**
   * Execute a single phase with retry
   */
  async function executePhase(
    job: JobState,
    phase: DownloadPhase,
  ): Promise<void> {
    const handler = handlers[phase];

    // Create context for handler
    const ctx: PhaseHandlerContext = {
      jobId: job.jobId,
      regionId: job.regionId,
      report: async (progress: Partial<DownloadProgress>) => {
        // Update job state
        if (progress.downloadedBytes !== undefined) {
          job.downloadedBytes = progress.downloadedBytes;
        }
        if (progress.totalBytes !== undefined) {
          job.totalBytes = progress.totalBytes;
        }

        // Build full progress
        const fullProgress: DownloadProgress = {
          jobId: job.jobId,
          phase: job.currentPhase,
          downloadedBytes: job.downloadedBytes,
          totalBytes: job.totalBytes,
          percent:
            job.totalBytes && job.downloadedBytes
              ? (job.downloadedBytes / job.totalBytes) * 100
              : undefined,
          message: progress.message,
        };

        // Emit to subscribers
        emitProgress(job.jobId, fullProgress);

        // Persist state
        await persistState(job);
      },
      isCancelled: () => job.cancelled,
      isPaused: () => job.paused,
    };

    // Execute with retry, but don't retry if paused or cancelled
    await withRetry(
      async () => {
        // Check if paused or cancelled before starting
        if (job.cancelled) {
          throw new CancelledError();
        }
        if (job.paused) {
          throw new PausedError();
        }

        await handler(ctx);
      },
      {
        ...retryOptions,
        retryOn: (err: unknown) => {
          // Don't retry if paused or cancelled
          if (err instanceof PausedError || err instanceof CancelledError) {
            return false;
          }
          return retryOptions.retryOn(err);
        },
      },
    );
  }

  /**
   * Run the job through all phases
   */
  async function runJob(job: JobState): Promise<void> {
    try {
      // Emit initial progress
      emitProgress(job.jobId, {
        jobId: job.jobId,
        phase: job.currentPhase,
        downloadedBytes: job.downloadedBytes,
        totalBytes: job.totalBytes,
        message: `Starting phase: ${job.currentPhase}`,
      });

      // Execute phases from current index
      for (let i = job.phaseIndex; i < PHASE_ORDER.length; i++) {
        const phase = PHASE_ORDER[i];
        job.currentPhase = phase;
        job.phaseIndex = i;

        // Emit phase start
        emitProgress(job.jobId, {
          jobId: job.jobId,
          phase,
          downloadedBytes: job.downloadedBytes,
          totalBytes: job.totalBytes,
          message: `Starting phase: ${phase}`,
        });

        // Execute phase
        await executePhase(job, phase);

        // Check if cancelled or paused after phase
        if (job.cancelled) {
          throw new CancelledError();
        }
        if (job.paused) {
          throw new PausedError();
        }
      }

      // All phases complete
      job.status = 'completed';
      await persistState(job);

      emitProgress(job.jobId, {
        jobId: job.jobId,
        phase: 'finalise',
        downloadedBytes: job.downloadedBytes,
        totalBytes: job.totalBytes,
        percent: 100,
        message: 'Download completed',
      });
    } catch (err) {
      if (err instanceof PausedError) {
        job.status = 'paused';
        await persistState(job);
        emitProgress(job.jobId, {
          jobId: job.jobId,
          phase: job.currentPhase,
          downloadedBytes: job.downloadedBytes,
          totalBytes: job.totalBytes,
          message: 'Download paused',
        });
      } else if (err instanceof CancelledError) {
        job.status = 'cancelled';
        await persistState(job);
        emitProgress(job.jobId, {
          jobId: job.jobId,
          phase: job.currentPhase,
          downloadedBytes: job.downloadedBytes,
          totalBytes: job.totalBytes,
          message: 'Download cancelled',
        });
      } else {
        // Error occurred
        const error = err as Error;
        job.status = 'error';
        job.error = {
          message: error.message || 'Unknown error',
          phase: job.currentPhase,
          code: (error as { code?: string }).code,
        };
        await persistState(job);
        emitProgress(job.jobId, {
          jobId: job.jobId,
          phase: job.currentPhase,
          downloadedBytes: job.downloadedBytes,
          totalBytes: job.totalBytes,
          message: `Error: ${job.error.message}`,
        });
      }
    } finally {
      job.running = null;
    }
  }

  return {
    async start(jobConfig: { jobId: string; regionId: string }): Promise<void> {
      const { jobId, regionId } = jobConfig;

      // Check if already running
      if (jobs.has(jobId)) {
        throw new Error(`Job ${jobId} is already running`);
      }

      // Create new job state
      const job: JobState = {
        jobId,
        regionId,
        status: 'running',
        currentPhase: 'estimating',
        phaseIndex: 0,
        progressCallbacks: new Set(),
        cancelled: false,
        paused: false,
        running: null,
      };

      jobs.set(jobId, job);

      // Start job execution
      job.running = runJob(job);
    },

    async pause(jobId: string): Promise<void> {
      const job = jobs.get(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (job.status !== 'running') {
        throw new Error(`Job ${jobId} is not running`);
      }

      // Set paused flag
      job.paused = true;

      // Wait for job to pause
      if (job.running) {
        await job.running;
      }
    },

    async resume(jobId: string, regionId?: string): Promise<void> {
      // Check if job exists in memory
      let job = jobs.get(jobId);

      if (!job) {
        // Try to load from disk
        // If regionId not provided, try jobId as regionId (common pattern)
        const lookupRegionId = regionId || jobId;
        const state = await store.load(jobId, lookupRegionId);
        if (!state) {
          throw new Error(`Job ${jobId} not found`);
        }

        // Create job from persisted state
        job = {
          jobId: state.jobId,
          regionId: state.regionId,
          status: state.status,
          currentPhase: state.currentPhase,
          phaseIndex: state.phaseIndex,
          downloadedBytes: state.downloadedBytes,
          totalBytes: state.totalBytes,
          error: state.error,
          progressCallbacks: new Set(),
          cancelled: false,
          paused: false,
          running: null,
        };

        jobs.set(jobId, job);
      }

      // Check status
      if (job.status === 'completed') {
        // Already completed, nothing to do
        return;
      }

      if (job.status === 'running') {
        throw new Error(`Job ${jobId} is already running`);
      }

      // If error, restart from failed phase
      if (job.status === 'error') {
        // Keep same phase index to retry
      }

      // Reset flags and status
      job.paused = false;
      job.cancelled = false;
      job.status = 'running';

      // Start job execution
      job.running = runJob(job);
    },

    async cancel(jobId: string): Promise<void> {
      const job = jobs.get(jobId);
      if (!job) {
        // Job not in memory, might be on disk
        // Just return silently (idempotent)
        return;
      }

      if (job.status === 'cancelled') {
        // Already cancelled
        return;
      }

      // Set cancelled flag
      job.cancelled = true;

      // Wait for job to stop
      if (job.running) {
        await job.running;
      }

      // Remove from active jobs
      jobs.delete(jobId);
    },

    onProgress(jobId: string, cb: ProgressCallback): () => void {
      const job = jobs.get(jobId);

      if (job) {
        job.progressCallbacks.add(cb);
      }

      // Return unsubscribe function
      return () => {
        const currentJob = jobs.get(jobId);
        if (currentJob) {
          currentJob.progressCallbacks.delete(cb);
        }
      };
    },

    getStatus(jobId: string): DownloadJobStatus | undefined {
      const job = jobs.get(jobId);
      return job?.status;
    },
  };
}
