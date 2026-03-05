// Earth radius in meters (WGS84 approximation)
const EARTH_RADIUS_METERS = 6378137;

/**
 * Calculate distance between two geographic coordinates in miles.
 * Uses the equirectangular approximation (fast, accurate for short distances).
 *
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
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const dLat = lat2Rad - lat1Rad;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const x = dLng * Math.cos((lat1Rad + lat2Rad) / 2);
  const y = dLat;
  const meters = Math.sqrt(x * x + y * y) * EARTH_RADIUS_METERS;

  return meters / 1609.344;
}
