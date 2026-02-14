/**
 * Tests for Download Manager
 * @format
 */

import { createDownloadManager } from '../download/downloadManager';
import type {
  DownloadStateStore,
  PersistedDownloadState,
} from '../download/downloadStateStore';
import type {
  PhaseHandlerContext,
  PhaseHandlers,
  DownloadPhase,
} from '../download/downloadTypes';
import type { DownloadProgress } from '../types';

/**
 * Mock state store for testing
 */
function createMockStateStore(): DownloadStateStore {
  const states = new Map<string, PersistedDownloadState>();

  return {
    async load(
      jobId: string,
      regionId: string,
    ): Promise<PersistedDownloadState | null> {
      const key = `${jobId}:${regionId}`;
      return states.get(key) || null;
    },

    async save(state: PersistedDownloadState): Promise<void> {
      const key = `${state.jobId}:${state.regionId}`;
      states.set(key, { ...state });
    },

    async remove(jobId: string, regionId: string): Promise<void> {
      const key = `${jobId}:${regionId}`;
      states.delete(key);
    },
  };
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('DownloadManager', () => {
  describe('Happy path', () => {
    it('runs all phases in order', async () => {
      const store = createMockStateStore();
      const phasesExecuted: DownloadPhase[] = [];
      const progressEvents: DownloadProgress[] = [];

      const handlers: PhaseHandlers = {
        estimating: async (ctx: PhaseHandlerContext) => {
          phasesExecuted.push('estimating');
          await ctx.report({ message: 'Estimating size', totalBytes: 1000 });
        },
        tiles: async (ctx: PhaseHandlerContext) => {
          phasesExecuted.push('tiles');
          await ctx.report({
            downloadedBytes: 100,
            message: 'Downloading tiles',
          });
          await ctx.report({
            downloadedBytes: 500,
            message: 'Downloading tiles',
          });
        },
        dem: async (ctx: PhaseHandlerContext) => {
          phasesExecuted.push('dem');
          await ctx.report({
            downloadedBytes: 700,
            message: 'Downloading DEM',
          });
        },
        overlays: async (ctx: PhaseHandlerContext) => {
          phasesExecuted.push('overlays');
          await ctx.report({
            downloadedBytes: 900,
            message: 'Downloading overlays',
          });
        },
        index: async (ctx: PhaseHandlerContext) => {
          phasesExecuted.push('index');
          await ctx.report({ downloadedBytes: 950, message: 'Building index' });
        },
        finalise: async (ctx: PhaseHandlerContext) => {
          phasesExecuted.push('finalise');
          await ctx.report({ downloadedBytes: 1000, message: 'Finalizing' });
        },
      };

      const manager = createDownloadManager({ store, handlers });

      // Start job
      const startPromise = manager.start({
        jobId: 'job1',
        regionId: 'region1',
      });

      // Subscribe to progress after starting
      manager.onProgress('job1', (progress) => {
        progressEvents.push({ ...progress });
      });

      // Wait for completion
      await startPromise;
      await sleep(50);

      // Verify all phases executed
      expect(phasesExecuted).toEqual([
        'estimating',
        'tiles',
        'dem',
        'overlays',
        'index',
        'finalise',
      ]);

      // Verify status
      expect(manager.getStatus('job1')).toBe('completed');

      // Verify progress events were emitted
      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[progressEvents.length - 1].message).toContain(
        'completed',
      );
    });
  });

  describe('Pause and resume', () => {
    it('pauses during phase execution', async () => {
      const store = createMockStateStore();
      const phasesExecuted: DownloadPhase[] = [];

      const handlers: PhaseHandlers = {
        estimating: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('estimating');
        },
        tiles: async (ctx: PhaseHandlerContext) => {
          phasesExecuted.push('tiles');
          // Simulate long-running phase with pause checks
          for (let i = 0; i < 100; i++) {
            if (ctx.isPaused()) {
              break;
            }
            await sleep(10);
          }
        },
        dem: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('dem');
        },
        overlays: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('overlays');
        },
        index: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('index');
        },
        finalise: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('finalise');
        },
      };

      const manager = createDownloadManager({ store, handlers });

      // Start job
      manager.start({ jobId: 'job2', regionId: 'region2' });

      // Wait a bit then pause
      await sleep(50);
      await manager.pause('job2');

      // Verify paused
      expect(manager.getStatus('job2')).toBe('paused');

      // Verify not all phases executed
      expect(phasesExecuted).toContain('estimating');
      expect(phasesExecuted).toContain('tiles');
      expect(phasesExecuted).not.toContain('finalise');
    });

    it('resumes from paused phase and completes', async () => {
      const store = createMockStateStore();
      const phasesExecuted: DownloadPhase[] = [];

      const handlers: PhaseHandlers = {
        estimating: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('estimating');
        },
        tiles: async (ctx: PhaseHandlerContext) => {
          phasesExecuted.push('tiles');
          // Simulate long-running phase with pause checks
          for (let i = 0; i < 50; i++) {
            if (ctx.isPaused()) {
              break;
            }
            await sleep(5);
          }
        },
        dem: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('dem');
        },
        overlays: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('overlays');
        },
        index: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('index');
        },
        finalise: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('finalise');
        },
      };

      const manager = createDownloadManager({ store, handlers });

      // Start job
      manager.start({ jobId: 'job3', regionId: 'region3' });

      // Wait a bit then pause
      await sleep(50);
      await manager.pause('job3');

      expect(manager.getStatus('job3')).toBe('paused');

      // Resume
      manager.resume('job3');

      // Wait for completion with more time
      await sleep(300);

      // Verify completed
      expect(manager.getStatus('job3')).toBe('completed');

      // Verify all phases executed (tiles might run twice)
      expect(phasesExecuted).toContain('estimating');
      expect(phasesExecuted).toContain('tiles');
      expect(phasesExecuted).toContain('dem');
      expect(phasesExecuted).toContain('overlays');
      expect(phasesExecuted).toContain('index');
      expect(phasesExecuted).toContain('finalise');
    });
  });

  describe('Cancel', () => {
    it('cancels during phase execution', async () => {
      const store = createMockStateStore();
      const phasesExecuted: DownloadPhase[] = [];

      const handlers: PhaseHandlers = {
        estimating: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('estimating');
        },
        tiles: async (ctx: PhaseHandlerContext) => {
          phasesExecuted.push('tiles');
          // Simulate long-running phase with cancel checks
          for (let i = 0; i < 100; i++) {
            if (ctx.isCancelled()) {
              break;
            }
            await sleep(10);
          }
        },
        dem: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('dem');
        },
        overlays: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('overlays');
        },
        index: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('index');
        },
        finalise: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('finalise');
        },
      };

      const manager = createDownloadManager({ store, handlers });

      // Start job
      manager.start({ jobId: 'job4', regionId: 'region4' });

      // Wait a bit then cancel
      await sleep(50);
      await manager.cancel('job4');

      // Verify cancelled
      expect(manager.getStatus('job4')).toBeUndefined(); // Removed from active jobs

      // Verify not all phases executed
      expect(phasesExecuted).toContain('estimating');
      expect(phasesExecuted).toContain('tiles');
      expect(phasesExecuted).not.toContain('finalise');
    });

    it('cancel is idempotent', async () => {
      const store = createMockStateStore();

      const handlers: PhaseHandlers = {
        estimating: async (_ctx: PhaseHandlerContext) => {
          for (let i = 0; i < 100; i++) {
            if (ctx.isCancelled()) {
              break;
            }
            await sleep(10);
          }
        },
        tiles: async () => {},
        dem: async () => {},
        overlays: async () => {},
        index: async () => {},
        finalise: async () => {},
      };

      const manager = createDownloadManager({ store, handlers });

      manager.start({ jobId: 'job5', regionId: 'region5' });
      await sleep(50);

      // Cancel multiple times
      await manager.cancel('job5');
      await manager.cancel('job5');
      await manager.cancel('job5');

      // Should not throw
      expect(manager.getStatus('job5')).toBeUndefined();
    });
  });

  describe('Retry on transient errors', () => {
    it('retries transient errors and succeeds', async () => {
      const store = createMockStateStore();
      const phasesExecuted: DownloadPhase[] = [];
      let tilesAttempts = 0;

      const handlers: PhaseHandlers = {
        estimating: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('estimating');
        },
        tiles: async (_ctx: PhaseHandlerContext) => {
          tilesAttempts++;
          phasesExecuted.push('tiles');

          // Fail first 2 times with transient error
          if (tilesAttempts <= 2) {
            const err = new Error('Network timeout') as Error & {
              code: string;
            };
            err.code = 'TRANSIENT';
            throw err;
          }
        },
        dem: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('dem');
        },
        overlays: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('overlays');
        },
        index: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('index');
        },
        finalise: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('finalise');
        },
      };

      const manager = createDownloadManager({
        store,
        handlers,
        retryOptions: {
          retries: 5,
          baseDelayMs: 10,
          maxDelayMs: 50,
          jitter: false,
        },
      });

      await manager.start({ jobId: 'job6', regionId: 'region6' });

      // Wait for completion
      await sleep(500);

      // Verify tiles was attempted 3 times
      expect(tilesAttempts).toBe(3);

      // Verify completed successfully
      expect(manager.getStatus('job6')).toBe('completed');

      // Verify all phases executed
      expect(phasesExecuted).toContain('estimating');
      expect(phasesExecuted).toContain('dem');
      expect(phasesExecuted).toContain('finalise');
    });

    it('does not retry non-transient errors', async () => {
      const store = createMockStateStore();
      let tilesAttempts = 0;

      const handlers: PhaseHandlers = {
        estimating: async (_ctx: PhaseHandlerContext) => {},
        tiles: async (_ctx: PhaseHandlerContext) => {
          tilesAttempts++;
          throw new Error('Validation failed');
        },
        dem: async () => {},
        overlays: async () => {},
        index: async () => {},
        finalise: async () => {},
      };

      const manager = createDownloadManager({
        store,
        handlers,
        retryOptions: {
          retries: 5,
          baseDelayMs: 10,
          maxDelayMs: 50,
          jitter: false,
        },
      });

      await manager.start({ jobId: 'job7', regionId: 'region7' });

      // Wait for error
      await sleep(200);

      // Verify only attempted once (no retry)
      expect(tilesAttempts).toBe(1);

      // Verify error status
      expect(manager.getStatus('job7')).toBe('error');
    });
  });

  describe('Progress subscriptions', () => {
    it('emits progress events to subscribers', async () => {
      const store = createMockStateStore();
      const progressEvents1: DownloadProgress[] = [];
      const progressEvents2: DownloadProgress[] = [];

      const handlers: PhaseHandlers = {
        estimating: async (_ctx: PhaseHandlerContext) => {
          await ctx.report({ message: 'Estimating', totalBytes: 100 });
        },
        tiles: async (ctx: PhaseHandlerContext) => {
          await ctx.report({ downloadedBytes: 50, message: 'Tiles' });
        },
        dem: async () => {},
        overlays: async () => {},
        index: async () => {},
        finalise: async () => {},
      };

      const manager = createDownloadManager({ store, handlers });

      // Start job first
      const startPromise = manager.start({
        jobId: 'job8',
        regionId: 'region8',
      });

      // Subscribe two callbacks after job started
      const unsub1 = manager.onProgress('job8', (p) =>
        progressEvents1.push({ ...p }),
      );
      const unsub2 = manager.onProgress('job8', (p) =>
        progressEvents2.push({ ...p }),
      );

      await startPromise;
      await sleep(50);

      // Both should receive events (at least the ones emitted after subscription)
      expect(progressEvents1.length).toBeGreaterThan(0);
      expect(progressEvents2.length).toBeGreaterThan(0);
      expect(progressEvents1.length).toBe(progressEvents2.length);

      // Unsubscribe
      unsub1();
      unsub2();
    });

    it('allows unsubscribing', async () => {
      const store = createMockStateStore();
      const progressEvents: DownloadProgress[] = [];

      const handlers: PhaseHandlers = {
        estimating: async (_ctx: PhaseHandlerContext) => {
          await ctx.report({ message: 'Step 1' });
          await sleep(50);
          await ctx.report({ message: 'Step 2' });
        },
        tiles: async () => {},
        dem: async () => {},
        overlays: async () => {},
        index: async () => {},
        finalise: async () => {},
      };

      const manager = createDownloadManager({ store, handlers });

      // Start job first
      manager.start({ jobId: 'job9', regionId: 'region9' });

      // Subscribe after start
      await sleep(10);
      const unsub = manager.onProgress('job9', (p) =>
        progressEvents.push({ ...p }),
      );

      // Wait a bit then unsubscribe
      await sleep(25);
      const countBeforeUnsub = progressEvents.length;
      unsub();

      // Wait for job to finish
      await sleep(100);

      // Should not receive more events after unsubscribe
      // (or very few if timing is tight)
      expect(progressEvents.length).toBeLessThanOrEqual(countBeforeUnsub + 1);
    });
  });

  describe('State persistence', () => {
    it('persists state during execution', async () => {
      const store = createMockStateStore();
      let savedStates: PersistedDownloadState[] = [];

      // Wrap save to capture states
      const originalSave = store.save.bind(store);
      store.save = async (state: PersistedDownloadState) => {
        savedStates.push({ ...state });
        await originalSave(state);
      };

      const handlers: PhaseHandlers = {
        estimating: async (ctx: PhaseHandlerContext) => {
          await ctx.report({ totalBytes: 1000 });
        },
        tiles: async (ctx: PhaseHandlerContext) => {
          await ctx.report({ downloadedBytes: 500 });
        },
        dem: async () => {},
        overlays: async () => {},
        index: async () => {},
        finalise: async () => {},
      };

      const manager = createDownloadManager({ store, handlers });

      await manager.start({ jobId: 'job10', regionId: 'region10' });
      await sleep(100);

      // Verify state was saved multiple times
      expect(savedStates.length).toBeGreaterThan(0);

      // Verify last state is completed
      const lastState = savedStates[savedStates.length - 1];
      expect(lastState.status).toBe('completed');
      expect(lastState.jobId).toBe('job10');
    });

    it('resumes from persisted state after restart', async () => {
      const store = createMockStateStore();
      const phasesExecuted: DownloadPhase[] = [];

      // Pre-populate store with paused state
      await store.save({
        schemaVersion: 1,
        jobId: 'job11',
        regionId: 'region11',
        status: 'paused',
        currentPhase: 'dem',
        phaseIndex: 2,
        downloadedBytes: 500,
        totalBytes: 1000,
        updatedAt: new Date().toISOString(),
      });

      const handlers: PhaseHandlers = {
        estimating: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('estimating');
        },
        tiles: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('tiles');
        },
        dem: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('dem');
        },
        overlays: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('overlays');
        },
        index: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('index');
        },
        finalise: async (_ctx: PhaseHandlerContext) => {
          phasesExecuted.push('finalise');
        },
      };

      const manager = createDownloadManager({ store, handlers });

      // Resume from persisted state - pass regionId
      manager.resume('job11', 'region11');
      await sleep(100);

      // Verify only remaining phases executed
      expect(phasesExecuted).not.toContain('estimating');
      expect(phasesExecuted).not.toContain('tiles');
      expect(phasesExecuted).toContain('dem');
      expect(phasesExecuted).toContain('overlays');
      expect(phasesExecuted).toContain('index');
      expect(phasesExecuted).toContain('finalise');

      expect(manager.getStatus('job11')).toBe('completed');
    });
  });
});
