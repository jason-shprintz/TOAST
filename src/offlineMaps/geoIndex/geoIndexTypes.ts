/**
 * Type definitions for GeoIndex - offline spatial queries
 * @format
 */

/**
 * Types of map features that can be indexed
 */
export type MapFeatureKind = 'water' | 'city' | 'road';

/**
 * Lightweight reference to a map feature for spatial queries
 */
export interface MapFeatureRef {
  kind: MapFeatureKind;
  id: string;
  // Lightweight data for UI
  name?: string;
  // Primary point for nearest queries
  lat: number;
  lng: number;
  // Optional extra properties
  props?: Record<string, unknown>;
  // Optional minimal geometry for hit-testing
  geometry?: FeatureGeometry;
}

/**
 * Minimal geometry for hit-testing
 */
export type FeatureGeometry =
  | { kind: 'Point'; coordinates: [number, number] }
  | { kind: 'LineString'; coordinates: [number, number][] }
  | { kind: 'Polygon'; coordinates: [number, number][][] };

/**
 * GeoIndex interface for offline spatial queries
 */
export interface GeoIndex {
  /**
   * Load index for a region into memory
   */
  load(regionId: string): Promise<void>;

  /**
   * Unload current index from memory
   */
  unload(): void;

  /**
   * Find the nearest water feature to a point
   */
  nearestWater(lat: number, lng: number): MapFeatureRef | null;

  /**
   * Find the nearest city to a point
   */
  nearestCity(lat: number, lng: number): MapFeatureRef | null;

  /**
   * Find all features within tolerance distance of a point
   */
  featuresAtPoint(
    lat: number,
    lng: number,
    toleranceMeters: number,
  ): MapFeatureRef[];
}
