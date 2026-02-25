/**
 * Open Elevation API DEM provider
 * Fetches elevation data by grid-sampling via the Open Elevation public API
 * @format
 */

import type { DemProvider } from './demProvider';
import type { DemRequest, DemResponse, DemProgressInfo } from './demTypes';

const OPEN_ELEVATION_URL = 'https://api.open-elevation.com/api/v1/lookup';

/** Points per HTTP batch request */
const BATCH_SIZE = 100;
/** Minimum grid dimension per axis */
const MIN_GRID_DIM = 10;
/** Maximum grid dimension per axis (caps at 100x100 = 10,000 points) */
const MAX_GRID_DIM = 100;
/** Delay between batch requests to stay within API rate limits */
const REQUEST_DELAY_MS = 300;
/** Timeout per batch HTTP request in milliseconds */
const BATCH_REQUEST_TIMEOUT_MS = 30_000;
/** Default target resolution if none provided */
const DEFAULT_RESOLUTION_METERS = 1000;

interface ElevationPoint {
  latitude: number;
  longitude: number;
}

interface ElevationResult {
  latitude: number;
  longitude: number;
  elevation: number;
}

interface OpenElevationResponse {
  results: ElevationResult[];
}

/**
 * DEM provider that queries the Open Elevation public API.
 * Samples a regular lat/lng grid and packs the results into a binary grid.
 *
 * The API is free and requires no API key, but has rate limits.
 * A 300 ms delay is inserted between batch requests to stay respectful.
 */
export class OpenElevationDemProvider implements DemProvider {
  async fetchDem(
    req: DemRequest,
    opts?: { onProgress?: (p: DemProgressInfo) => void },
  ): Promise<DemResponse> {
    const { bounds, encoding = 'int16' } = req;
    const targetResolutionMeters =
      req.targetResolutionMeters ?? DEFAULT_RESOLUTION_METERS;

    // Compute grid dimensions from geographic extent and desired resolution
    const midLat = (bounds.minLat + bounds.maxLat) / 2;
    const metersPerDegLat = 111320;
    const metersPerDegLng = 111320 * Math.cos((midLat * Math.PI) / 180);

    const latRangeMeters = (bounds.maxLat - bounds.minLat) * metersPerDegLat;
    const lngRangeMeters = (bounds.maxLng - bounds.minLng) * metersPerDegLng;

    const height = Math.max(
      MIN_GRID_DIM,
      Math.min(
        MAX_GRID_DIM,
        Math.ceil(latRangeMeters / targetResolutionMeters),
      ),
    );
    const width = Math.max(
      MIN_GRID_DIM,
      Math.min(
        MAX_GRID_DIM,
        Math.ceil(lngRangeMeters / targetResolutionMeters),
      ),
    );

    opts?.onProgress?.({
      message: `Building ${width}×${height} elevation grid...`,
    });

    // Generate grid points: north-to-south rows, west-to-east columns
    const points: ElevationPoint[] = [];
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const tRow = height > 1 ? row / (height - 1) : 0;
        const tCol = width > 1 ? col / (width - 1) : 0;
        points.push({
          latitude: bounds.maxLat - tRow * (bounds.maxLat - bounds.minLat),
          longitude: bounds.minLng + tCol * (bounds.maxLng - bounds.minLng),
        });
      }
    }

    // Fetch elevations in batches
    const elevations: number[] = new Array(width * height).fill(0);
    const totalPoints = points.length;
    let fetchedPoints = 0;

    for (let i = 0; i < points.length; i += BATCH_SIZE) {
      const batch = points.slice(i, i + BATCH_SIZE);

      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        BATCH_REQUEST_TIMEOUT_MS,
      );

      let response: Response;
      try {
        response = await fetch(OPEN_ELEVATION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ locations: batch }),
          signal: controller.signal,
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error(
            `Open Elevation API request timed out after ${BATCH_REQUEST_TIMEOUT_MS / 1000}s for batch at index ${i}`,
          );
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        throw new Error(
          `Open Elevation API error: HTTP ${response.status} for batch at index ${i}`,
        );
      }

      const data: OpenElevationResponse = await response.json();
      for (let j = 0; j < data.results.length; j++) {
        elevations[i + j] = data.results[j]?.elevation ?? 0;
      }

      fetchedPoints += batch.length;
      opts?.onProgress?.({
        downloadedBytes: fetchedPoints,
        totalBytes: totalPoints,
        message: `Fetching elevation data (${fetchedPoints}/${totalPoints} points)`,
      });

      // Rate-limiting delay between batches
      if (i + BATCH_SIZE < points.length) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, REQUEST_DELAY_MS),
        );
      }
    }

    // Pack elevation values into the requested binary format
    const nodata = encoding === 'int16' ? -32768 : -9999;
    const bytesPerSample = encoding === 'int16' ? 2 : 4;
    const buffer = new ArrayBuffer(width * height * bytesPerSample);
    const view = new DataView(buffer);

    for (let i = 0; i < elevations.length; i++) {
      const elevation = elevations[i];
      const offset = i * bytesPerSample;
      if (encoding === 'int16') {
        const clamped = Math.max(
          -32767,
          Math.min(32767, Math.round(elevation)),
        );
        view.setInt16(offset, clamped, true);
      } else {
        view.setFloat32(offset, elevation, true);
      }
    }

    opts?.onProgress?.({
      downloadedBytes: buffer.byteLength,
      totalBytes: buffer.byteLength,
      message: `Elevation grid complete (${width}×${height})`,
    });

    return {
      metadata: {
        format: 'grid',
        units: 'meters',
        encoding,
        width,
        height,
        nodata,
        bounds,
      },
      data: new Uint8Array(buffer),
    };
  }
}
