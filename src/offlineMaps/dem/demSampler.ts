/**
 * DEM sampler with bilinear interpolation
 * @format
 */

import type { DemMetadataV1 } from './demTypes';

/**
 * DEM sampler interface for elevation queries
 */
export interface DemSampler {
  getElevation(lat: number, lng: number): number | null;
}

/**
 * Creates a DEM sampler from metadata and raw buffer
 */
export function createDemSampler(
  meta: DemMetadataV1,
  buffer: ArrayBuffer,
): DemSampler {
  const view = new DataView(buffer);
  const { width, height, bounds, nodata, encoding } = meta;
  const { minLat, minLng, maxLat, maxLng } = bounds;

  // Helper to read a single elevation value at grid position
  const readValue = (row: number, col: number): number => {
    if (row < 0 || row >= height || col < 0 || col >= width) {
      return nodata;
    }

    const index = row * width + col;

    if (encoding === 'int16') {
      return view.getInt16(index * 2, true); // true = little-endian
    } else {
      // float32
      return view.getFloat32(index * 4, true);
    }
  };

  return {
    getElevation(lat: number, lng: number): number | null {
      // Check bounds
      if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) {
        return null;
      }

      // Map lat/lng to normalized coordinates [0, 1]
      const u = (lng - minLng) / (maxLng - minLng);
      const v = (maxLat - lat) / (maxLat - minLat); // Note: inverted for top-down grid

      // Map to grid coordinates
      const x = u * (width - 1);
      const y = v * (height - 1);

      // Get integer coordinates for the four surrounding cells
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const x1 = Math.min(x0 + 1, width - 1);
      const y1 = Math.min(y0 + 1, height - 1);

      // Read the four corner values
      const v00 = readValue(y0, x0);
      const v10 = readValue(y0, x1);
      const v01 = readValue(y1, x0);
      const v11 = readValue(y1, x1);

      // Check for nodata values
      const validValues: number[] = [];
      if (v00 !== nodata) validValues.push(v00);
      if (v10 !== nodata) validValues.push(v10);
      if (v01 !== nodata) validValues.push(v01);
      if (v11 !== nodata) validValues.push(v11);

      // If all values are nodata, return null
      if (validValues.length === 0) {
        return null;
      }

      // If some values are nodata, use simple average of valid values
      // (This is a simplified approach; more sophisticated methods could be used)
      if (validValues.length < 4) {
        const sum = validValues.reduce((acc, val) => acc + val, 0);
        return sum / validValues.length;
      }

      // All four values are valid, perform bilinear interpolation
      const fx = x - x0;
      const fy = y - y0;

      // Bilinear interpolation formula:
      // f(x,y) = f(0,0)(1-fx)(1-fy) + f(1,0)fx(1-fy) + f(0,1)(1-fx)fy + f(1,1)fxfy
      const result =
        v00 * (1 - fx) * (1 - fy) +
        v10 * fx * (1 - fy) +
        v01 * (1 - fx) * fy +
        v11 * fx * fy;

      return result;
    },
  };
}
