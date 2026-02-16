/**
 * Type definitions for overlay metadata acquisition
 * @format
 */

import type { Bounds } from '../geo/coverage';

/**
 * Types of overlay metadata that can be fetched
 */
export type OverlayKind = 'water' | 'cities' | 'roads';

/**
 * Request parameters for fetching overlay data
 */
export interface OverlayRequest {
  regionId: string;
  bounds: Bounds;
  radiusMiles?: number;
}

/**
 * Progress callback for overlay fetching
 */
export interface OverlayFetchProgress {
  downloadedBytes?: number;
  totalBytes?: number;
  message?: string;
}

/**
 * Provider interface for fetching overlay metadata
 * Returns raw JSON (unknown) to allow schema validation
 */
export interface OverlayProvider {
  fetchOverlay(
    kind: OverlayKind,
    req: OverlayRequest,
    opts?: {
      onProgress?: (progress: OverlayFetchProgress) => void;
    },
  ): Promise<unknown>;
}
