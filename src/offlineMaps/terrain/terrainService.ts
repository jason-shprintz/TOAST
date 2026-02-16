/**
 * Terrain service for elevation, slope, and highest point queries
 * @format
 */

import { createDemSampler } from '../dem/demSampler';
import { findHighestPointInRadius } from './highestPoint';
import { computeSlopePercent } from './slope';
import type { TerrainPoint, HighestPointOptions } from './terrainTypes';
import type { DemMetadataV1 } from '../dem/demTypes';

/**
 * Service interface for terrain analysis operations
 */
export interface TerrainService {
  /**
   * Get elevation at a point in meters
   */
  getElevation(lat: number, lng: number): number | null;

  /**
   * Get slope at a point as percent grade (e.g., 10 = 10% grade)
   */
  getSlope(lat: number, lng: number): number | null;

  /**
   * Find the highest point within a radius
   */
  findHighestPointWithin(
    centerLat: number,
    centerLng: number,
    opts: HighestPointOptions,
  ): TerrainPoint | null;
}

/**
 * Create a terrain service from DEM metadata and buffer.
 * Constructs once and does not read files per call.
 *
 * @param meta - DEM metadata
 * @param buffer - Raw DEM data buffer
 * @returns TerrainService instance
 */
export function createTerrainService(
  meta: DemMetadataV1,
  buffer: ArrayBuffer,
): TerrainService {
  // Create DEM sampler once
  const sampler = createDemSampler(meta, buffer);

  // Calculate sample distance for slope based on DEM resolution
  const { bounds, height } = meta;
  const latCellDeg = (bounds.maxLat - bounds.minLat) / (height - 1);
  const metersPerLatDeg = 111320; // approximate meters per degree latitude
  const cellMeters = latCellDeg * metersPerLatDeg;

  // Clamp to reasonable bounds (30-200 meters)
  const sampleDistanceMeters = Math.max(30, Math.min(200, cellMeters));

  // Derive default step size for highest point search from DEM resolution
  const defaultStepMeters = Math.max(cellMeters, 60);

  return {
    getElevation(lat: number, lng: number): number | null {
      return sampler.getElevation(lat, lng);
    },

    getSlope(lat: number, lng: number): number | null {
      return computeSlopePercent(
        sampler.getElevation.bind(sampler),
        lat,
        lng,
        sampleDistanceMeters,
      );
    },

    findHighestPointWithin(
      centerLat: number,
      centerLng: number,
      opts: HighestPointOptions,
    ): TerrainPoint | null {
      // Use default step size if not provided
      const searchOpts: HighestPointOptions = {
        ...opts,
        stepMeters: opts.stepMeters ?? defaultStepMeters,
      };

      return findHighestPointInRadius(
        sampler.getElevation.bind(sampler),
        centerLat,
        centerLng,
        searchOpts,
        meta.bounds,
      );
    },
  };
}
