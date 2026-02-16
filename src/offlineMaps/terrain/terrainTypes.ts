/**
 * Terrain analysis type definitions
 * @format
 */

/**
 * A point on the terrain with coordinates and elevation
 */
export interface TerrainPoint {
  lat: number;
  lng: number;
  elevationM: number;
}

/**
 * Options for highest point search
 */
export interface HighestPointOptions {
  /**
   * Search radius in meters
   */
  radiusMeters: number;

  /**
   * Step size in meters for the search grid.
   * If omitted, derived from DEM resolution.
   */
  stepMeters?: number;

  /**
   * Optional cap to avoid doing too much work on huge regions.
   * Defaults to 50000 samples.
   */
  maxSamples?: number;
}
