/**
 * Marker formatters for offline map
 * @format
 */

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

/**
 * Convert meters to feet
 */
export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

/**
 * Format elevation for display
 */
export function formatElevation(meters: number): string {
  const feet = Math.round(metersToFeet(meters));
  return `${Math.round(meters)} m (${feet} ft)`;
}
