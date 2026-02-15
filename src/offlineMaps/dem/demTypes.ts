/**
 * DEM (Digital Elevation Model) type definitions
 * @format
 */

/**
 * DEM metadata structure stored in region.json
 */
export interface DemMetadataV1 {
  format: 'grid';
  units: 'meters';
  encoding: 'int16' | 'float32';
  width: number;
  height: number;
  nodata: number;

  bounds: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  };
}

/**
 * DEM request parameters for fetching elevation data
 */
export interface DemRequest {
  regionId: string;
  bounds: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  };
  targetResolutionMeters?: number;
  encoding: 'int16' | 'float32';
}

/**
 * DEM response containing metadata and raw binary data
 */
export interface DemResponse {
  metadata: DemMetadataV1;
  data: Uint8Array;
}

/**
 * Progress callback for DEM download operations
 */
export interface DemProgressInfo {
  downloadedBytes?: number;
  totalBytes?: number;
  message?: string;
}
