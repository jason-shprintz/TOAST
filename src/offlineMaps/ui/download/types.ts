/**
 * Types for Download Region UI
 * @format
 */

import type { OfflineRegion, OfflineRegionDraft } from '../../types';

export interface DownloadRegionEstimate {
  tileCount: number;
  estimatedTotalMB: number;
  estimatedTilesMB: number;
  estimatedDemMB: number;
  estimatedMetaMB: number;
}

export type DownloadStatus =
  | 'idle'
  | 'estimating'
  | 'readyToDownload'
  | 'downloading'
  | 'paused'
  | 'error'
  | 'complete';

export interface DownloadState {
  draft?: OfflineRegionDraft;
  estimate?: DownloadRegionEstimate;
  region?: OfflineRegion | null;
  jobId?: string;
  phase?: string;
  percent?: number;
  message?: string;
  status: DownloadStatus;
  error?: string;
}
