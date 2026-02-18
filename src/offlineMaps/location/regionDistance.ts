/**
 * Distance calculations for region location checking
 * @format
 */

import { distanceMeters as calculateDistanceMeters } from '../geo/geoMath';

/**
 * Calculate distance between two points in meters using equirectangular approximation
 * @param lat1 First point latitude in degrees
 * @param lng1 First point longitude in degrees
 * @param lat2 Second point latitude in degrees
 * @param lng2 Second point longitude in degrees
 * @returns Distance in meters
 */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  return calculateDistanceMeters(lat1, lng1, lat2, lng2);
}

/**
 * Convert meters to miles
 * @param meters Distance in meters
 * @returns Distance in miles
 */
export function metersToMiles(meters: number): number {
  return meters / 1609.344;
}

/**
 * Calculate distance between two points in miles
 * @param lat1 First point latitude in degrees
 * @param lng1 First point longitude in degrees
 * @param lat2 Second point latitude in degrees
 * @param lng2 Second point longitude in degrees
 * @returns Distance in miles
 */
export function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const meters = distanceMeters(lat1, lng1, lat2, lng2);
  return metersToMiles(meters);
}
