/**
 * Core TypeScript types for Offline Terrain Intelligence
 * @format
 */

export type OfflineRegionStatus =
  | 'idle'
  | 'downloading'
  | 'ready'
  | 'error'
  | 'deleting';

export interface OfflineRegion {
  id: string;
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  status: OfflineRegionStatus;
  storageSizeMB?: number;

  tilesPath?: string;
  demPath?: string;
  regionJsonPath?: string;
  waterPath?: string;
  citiesPath?: string;
  roadsPath?: string;
  indexPath?: string;
}

export interface OfflineRegionDraft {
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
}

export interface RegionSizeEstimate {
  estimatedTotalMB: number;
  estimatedTilesMB?: number;
  estimatedDemMB?: number;
  estimatedMetaMB?: number;
  tileCount?: number;
}

export interface DownloadJob {
  id: string;
  regionId: string;
  createdAt: string;
  phase: 'estimating' | 'tiles' | 'dem' | 'overlays' | 'index' | 'finalise';
}

export interface DownloadProgress {
  jobId: string;
  phase: DownloadJob['phase'];
  downloadedBytes?: number;
  totalBytes?: number;
  percent?: number;
  message?: string;
}
