/**
 * Type definitions for Tap Inspector
 * @format
 */

export interface TapLocation {
  lat: number;
  lng: number;
}

export interface TapInspectorFeature {
  kind: 'water' | 'city' | 'road';
  id: string;
  title: string; // name or fallback label
  subtitle?: string; // type/class/tier
  distanceMeters: number;
}

export interface TapInspectorResult {
  location: TapLocation;
  elevationM: number | null;
  slopePercent: number | null;
  features: TapInspectorFeature[];
}
