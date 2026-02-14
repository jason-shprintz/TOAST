/**
 * Geometry and geodesy math utilities for offline maps
 * @format
 */

// Earth radius in meters (WGS84 approximation)
const EARTH_RADIUS_METERS = 6378137;

// Web Mercator latitude limits
const MAX_LATITUDE = 85.05112878;
const MIN_LATITUDE = -85.05112878;

/**
 * Convert miles to meters
 */
export function milesToMeters(miles: number): number {
  return miles * 1609.344;
}

/**
 * Clamp latitude to Web Mercator supported range
 */
export function clampLat(lat: number): number {
  return Math.max(MIN_LATITUDE, Math.min(MAX_LATITUDE, lat));
}

/**
 * Normalize longitude to [-180, 180] range
 */
export function normalizeLng(lng: number): number {
  lng = lng % 360;
  if (lng > 180) lng -= 360;
  if (lng < -180) lng += 360;
  return lng;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Bounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

/**
 * Convert a circular region (center + radius) to a bounding box
 * Uses simple equirectangular approximation for distance calculations
 */
export function regionToBounds(center: LatLng, radiusMiles: number): Bounds {
  const radiusMeters = milesToMeters(radiusMiles);

  // Convert radius in meters to degrees
  // For latitude: straightforward as degrees are roughly constant distance
  const dLat = (radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);

  // For longitude: depends on latitude (longitude lines converge at poles)
  const latRad = (center.lat * Math.PI) / 180;
  const dLng =
    (radiusMeters / (EARTH_RADIUS_METERS * Math.cos(latRad))) * (180 / Math.PI);

  // Calculate bounds
  const minLat = clampLat(center.lat - dLat);
  const maxLat = clampLat(center.lat + dLat);
  const minLng = normalizeLng(center.lng - dLng);
  const maxLng = normalizeLng(center.lng + dLng);

  return {
    minLat,
    minLng,
    maxLat,
    maxLng,
  };
}
