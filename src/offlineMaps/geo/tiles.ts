/**
 * Slippy map tile calculations for Web Mercator projection
 * @format
 */

/**
 * Convert longitude to tile X coordinate at given zoom level
 */
export function lonToTileX(lng: number, z: number): number {
  const n = Math.pow(2, z);
  return ((lng + 180) / 360) * n;
}

/**
 * Convert latitude to tile Y coordinate at given zoom level
 * Uses Web Mercator (EPSG:3857) projection
 */
export function latToTileY(lat: number, z: number): number {
  const n = Math.pow(2, z);
  const latRad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
}

/**
 * Convert tile X coordinate to longitude
 */
export function tileXToLon(x: number, z: number): number {
  const n = Math.pow(2, z);
  return (x / n) * 360 - 180;
}

/**
 * Convert tile Y coordinate to latitude
 */
export function tileYToLat(y: number, z: number): number {
  const n = Math.pow(2, z);
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  return (latRad * 180) / Math.PI;
}
