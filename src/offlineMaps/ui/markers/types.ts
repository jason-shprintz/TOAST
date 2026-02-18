/**
 * Marker types for offline map
 * @format
 */

export type MarkerKind = 'nearestWater' | 'highestElevation';

export interface MapMarker {
  id: string; // deterministic per kind (e.g. "nearestWater")
  kind: MarkerKind;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  distanceMeters?: number; // if applicable
  elevationM?: number; // if applicable
}
