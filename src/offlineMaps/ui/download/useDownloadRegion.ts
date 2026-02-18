/**
 * Hook for managing region download lifecycle
 * @format
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { estimateRegionSize } from './estimator';
import type { DownloadRegionEstimate, DownloadStatus } from './types';
import type { RegionRepository } from '../../db/regionRepository';
import type { DownloadManager } from '../../download/downloadTypes';
import type { OfflineRegion, OfflineRegionDraft } from '../../types';

export interface UseDownloadRegionOptions {
  regionRepo: RegionRepository;
  downloadManager: DownloadManager;
  getCurrentLocation: () => Promise<{ lat: number; lng: number } | null>;
  defaultRadiusMiles?: number;
  // Optional RegionStorage for temp file cleanup
  regionStorage?: {
    deleteTemp(regionId: string): Promise<void>;
  };
}

export interface UseDownloadRegionResult {
  draft?: OfflineRegionDraft;
  estimate?: DownloadRegionEstimate;
  region?: OfflineRegion | null;
  jobId?: string;
  phase?: string;
  percent?: number;
  message?: string;
  status: DownloadStatus;
  error?: string;

  initDraft: () => Promise<void>;
  runEstimate: () => Promise<void>;
  startDownload: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  cancel: () => Promise<void>;
  deleteTemp: () => Promise<void>;
}

/**
 * Hook for orchestrating region download flow
 */
export function useDownloadRegion(
  opts: UseDownloadRegionOptions,
): UseDownloadRegionResult {
  const {
    regionRepo,
    downloadManager,
    getCurrentLocation,
    defaultRadiusMiles = 25,
    regionStorage,
  } = opts;

  const [draft, setDraft] = useState<OfflineRegionDraft | undefined>();
  const [estimate, setEstimate] = useState<
    DownloadRegionEstimate | undefined
  >();
  const [region, setRegion] = useState<OfflineRegion | null | undefined>();
  const [jobId, setJobId] = useState<string | undefined>();
  const [phase, setPhase] = useState<string | undefined>();
  const [percent, setPercent] = useState<number | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [error, setError] = useState<string | undefined>();

  // Store unsubscribe function for progress updates
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Cleanup progress subscription on unmount or when jobId changes
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [jobId]);

  /**
   * Initialize draft with current location
   */
  const initDraft = useCallback(async () => {
    try {
      setStatus('estimating');
      const location = await getCurrentLocation();

      if (!location) {
        setError('Location required to download region');
        setStatus('error');
        return;
      }

      const newDraft: OfflineRegionDraft = {
        centerLat: location.lat,
        centerLng: location.lng,
        radiusMiles: defaultRadiusMiles,
      };

      setDraft(newDraft);
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
      setStatus('error');
    }
  }, [getCurrentLocation, defaultRadiusMiles]);

  /**
   * Run size estimation
   */
  const runEstimate = useCallback(async () => {
    if (!draft) {
      setError('Draft not initialized');
      setStatus('error');
      return;
    }

    try {
      setStatus('estimating');
      const est = estimateRegionSize(
        { lat: draft.centerLat, lng: draft.centerLng },
        draft.radiusMiles,
      );

      setEstimate(est);
      setStatus('readyToDownload');
      setError(undefined);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to estimate region size',
      );
      setStatus('error');
    }
  }, [draft]);

  /**
   * Start download job
   */
  const startDownload = useCallback(async () => {
    if (!draft) {
      setError('No draft to download');
      setStatus('error');
      return;
    }

    try {
      // Ensure repository is initialized
      await regionRepo.init();

      // Create region ID
      const newRegionId = `region-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const newJobId = `job-${newRegionId}`;

      // Create region record
      const newRegion: OfflineRegion = {
        id: newRegionId,
        centerLat: draft.centerLat,
        centerLng: draft.centerLng,
        radiusMiles: draft.radiusMiles,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        status: 'downloading',
      };

      await regionRepo.createRegion(newRegion);
      setRegion(newRegion);
      setJobId(newJobId);

      // Start download first
      await downloadManager.start({
        jobId: newJobId,
        regionId: newRegionId,
      });

      // Then subscribe to progress updates
      // Cleanup any existing subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = downloadManager.onProgress(
        newJobId,
        async (progress) => {
          setPhase(progress.phase);
          setPercent(progress.percent);
          setMessage(progress.message);

          // Update status based on phase completion
          if (progress.phase === 'finalise' && progress.percent === 100) {
            setStatus('complete');

            // Update region status to 'ready' in repository
            try {
              await regionRepo.updateRegionStatus(newRegionId, 'ready');
              const updatedRegion = await regionRepo.getRegion(newRegionId);
              if (updatedRegion) {
                setRegion(updatedRegion);
              }
            } catch (repoError) {
              console.warn(
                'Failed to update region to ready status',
                repoError,
              );
            }
          }
        },
      );

      setStatus('downloading');
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start download');
      setStatus('error');
    }
  }, [draft, regionRepo, downloadManager]);

  /**
   * Pause download
   */
  const pause = useCallback(async () => {
    if (!jobId) {
      return;
    }

    try {
      await downloadManager.pause(jobId);
      setStatus('paused');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause download');
      setStatus('error');
    }
  }, [jobId, downloadManager]);

  /**
   * Resume download
   */
  const resume = useCallback(async () => {
    if (!jobId) {
      return;
    }

    try {
      // Extract regionId from jobId (format: "job-{regionId}")
      const regionId =
        region?.id ??
        (jobId.startsWith('job-') ? jobId.substring(4) : undefined);

      if (!regionId) {
        throw new Error('Cannot determine regionId for resume');
      }

      await downloadManager.resume(jobId, regionId);
      setStatus('downloading');
      setError(undefined);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to resume download',
      );
      setStatus('error');
    }
  }, [jobId, region, downloadManager]);

  /**
   * Cancel download
   */
  const cancel = useCallback(async () => {
    if (!jobId) {
      return;
    }

    try {
      // Try to resume the job first to ensure it's loaded in memory
      // This is best-effort; ignore failures
      try {
        const dmStatus = downloadManager.getStatus(jobId);
        if (!dmStatus || dmStatus !== 'running') {
          const regionId = region?.id ?? jobId.substring(4);
          await downloadManager.resume(jobId, regionId);
        }
      } catch {
        // Ignore resume failures; proceed with cancel
      }

      // Cancel the download job
      await downloadManager.cancel(jobId);

      // Delete the region record from database
      if (region?.id) {
        await regionRepo.deleteRegion(region.id);
      }

      // Delete temporary files if regionStorage is available
      if (regionStorage && region?.id) {
        try {
          await regionStorage.deleteTemp(region.id);
        } catch (cleanupErr) {
          console.warn('Failed to delete temp files:', cleanupErr);
        }
      }

      // Reset local UI state to idle
      setRegion(null);
      setStatus('idle');
      setJobId(undefined);
      setPhase(undefined);
      setPercent(undefined);
      setMessage(undefined);
      setError(undefined);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to cancel download',
      );
      setStatus('error');
    }
  }, [jobId, region, downloadManager, regionRepo, regionStorage]);

  /**
   * Delete temporary files
   */
  const deleteTemp = useCallback(async () => {
    if (!region?.id) {
      return;
    }

    try {
      // Delete temporary files if regionStorage is available
      if (regionStorage) {
        await regionStorage.deleteTemp(region.id);
      }

      // Delete region from database
      await regionRepo.deleteRegion(region.id);

      setRegion(null);
      setStatus('idle');
      setJobId(undefined);
      setPhase(undefined);
      setPercent(undefined);
      setMessage(undefined);
      setError(undefined);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete temporary files',
      );
      setStatus('error');
    }
  }, [region, regionRepo, regionStorage]);

  /**
   * Check for existing download on mount
   */
  useEffect(() => {
    const checkExistingDownload = async () => {
      try {
        // Initialize repository first
        await regionRepo.init();

        // Use listRegions to find downloading regions (getActiveRegion only returns 'ready')
        const regions = await regionRepo.listRegions();
        const downloadingRegion = regions.find(
          (r) => r.status === 'downloading',
        );

        if (downloadingRegion) {
          setRegion(downloadingRegion);
          setStatus('paused'); // Default to paused for recovery (no silent auto-download)
          const recoveryJobId = `job-${downloadingRegion.id}`;
          setJobId(recoveryJobId);

          // Note: We intentionally keep status as 'paused' even if DownloadManager
          // reports 'running', to avoid silent background downloads after restart
        }
      } catch (err) {
        console.error('Failed to check for existing download:', err);
      }
    };

    checkExistingDownload();
  }, [regionRepo, downloadManager]);

  return {
    draft,
    estimate,
    region,
    jobId,
    phase,
    percent,
    message,
    status,
    error,
    initDraft,
    runEstimate,
    startDownload,
    pause,
    resume,
    cancel,
    deleteTemp,
  };
}
