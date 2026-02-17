/**
 * Geometry and geodesy math utilities for offline maps
 * @format
 */

// Earth radius in meters (WGS84 approximation)
export const EARTH_RADIUS_METERS = 6378137;

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
  // Handle the modulo for negative numbers properly
  lng = ((lng % 360) + 360) % 360;
  // Convert from [0, 360) to [-180, 180]
  if (lng > 180) lng -= 360;
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

/**
 * Calculate distance between two points using equirectangular approximation
 * Fast approximation suitable for small distances (< 1000km)
 */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const dLat = lat2Rad - lat1Rad;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  // Equirectangular approximation
  const x = dLng * Math.cos((lat1Rad + lat2Rad) / 2);
  const y = dLat;
  const distance = Math.sqrt(x * x + y * y) * EARTH_RADIUS_METERS;

  return distance;
}
