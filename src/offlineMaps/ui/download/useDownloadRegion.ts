/**
 * Hook for managing region download lifecycle
 * @format
 */

import { useState, useEffect, useCallback } from 'react';
import type { RegionRepository } from '../../db/regionRepository';
import type { DownloadManager } from '../../download/downloadTypes';
import type { OfflineRegion, OfflineRegionDraft } from '../../types';
import { estimateRegionSize } from './estimator';
import type { DownloadRegionEstimate, DownloadStatus } from './types';

export interface UseDownloadRegionOptions {
  regionRepo: RegionRepository;
  downloadManager: DownloadManager;
  getCurrentLocation: () => Promise<{ lat: number; lng: number } | null>;
  defaultRadiusMiles?: number;
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
  } = opts;

  const [draft, setDraft] = useState<OfflineRegionDraft | undefined>();
  const [estimate, setEstimate] = useState<DownloadRegionEstimate | undefined>();
  const [region, setRegion] = useState<OfflineRegion | null | undefined>();
  const [jobId, setJobId] = useState<string | undefined>();
  const [phase, setPhase] = useState<string | undefined>();
  const [percent, setPercent] = useState<number | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [error, setError] = useState<string | undefined>();

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
      setError(
        err instanceof Error ? err.message : 'Failed to get location',
      );
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
      // Create region ID
      const newRegionId = `region-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

      // Subscribe to progress updates
      const unsubscribe = downloadManager.onProgress(newJobId, (progress) => {
        setPhase(progress.phase);
        setPercent(progress.percent);
        setMessage(progress.message);

        // Update status based on phase completion
        if (progress.phase === 'finalise' && progress.percent === 100) {
          setStatus('complete');
        }
      });

      // Start download
      await downloadManager.start({
        jobId: newJobId,
        regionId: newRegionId,
      });

      setStatus('downloading');
      setError(undefined);

      // Store unsubscribe function for cleanup
      return () => unsubscribe();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start download',
      );
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
      setError(
        err instanceof Error ? err.message : 'Failed to pause download',
      );
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
      await downloadManager.resume(jobId, region?.id);
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
      await downloadManager.cancel(jobId);
      setStatus('idle');
      setJobId(undefined);
      setPhase(undefined);
      setPercent(undefined);
      setMessage(undefined);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to cancel download',
      );
      setStatus('error');
    }
  }, [jobId, downloadManager]);

  /**
   * Delete temporary files
   */
  const deleteTemp = useCallback(async () => {
    if (!region?.id) {
      return;
    }

    try {
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
        err instanceof Error
          ? err.message
          : 'Failed to delete temporary files',
      );
      setStatus('error');
    }
  }, [region, regionRepo]);

  /**
   * Check for existing download on mount
   */
  useEffect(() => {
    const checkExistingDownload = async () => {
      try {
        const activeRegion = await regionRepo.getActiveRegion();

        if (activeRegion && activeRegion.status === 'downloading') {
          setRegion(activeRegion);
          setStatus('paused'); // Default to paused for recovery
          const recoveryJobId = `job-${activeRegion.id}`;
          setJobId(recoveryJobId);

          // Check download manager status
          const dmStatus = downloadManager.getStatus(recoveryJobId);
          if (dmStatus === 'running') {
            setStatus('downloading');
          }
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
