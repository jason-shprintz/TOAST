/**
 * Formatting utilities for Tap Inspector
 * @format
 */

/**
 * Format latitude and longitude to 4-5 decimal places
 */
export function formatLatLng(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/**
 * Format meters to meters and feet
 */
export function formatMetersFeet(m: number): string {
  const feet = m * 3.28084;
  return `${Math.round(m)} m (${Math.round(feet)} ft)`;
}

/**
 * Format distance based on magnitude
 * - < 1000m: show meters + feet
 * - >= 1000m: show km + miles
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    const feet = meters * 3.28084;
    return `${Math.round(meters)} m (${Math.round(feet)} ft)`;
  } else {
    const km = meters / 1000;
    const miles = meters / 1609.344;
    return `${km.toFixed(2)} km (${miles.toFixed(2)} mi)`;
  }
}

/**
 * Format slope as percentage
 */
export function formatSlope(pct: number): string {
  return `${Math.round(pct)}%`;
}

/**
 * Format elevation with thousands separator and feet conversion
 */
export function formatElevation(m: number): string {
  const feet = m * 3.28084;
  const mFormatted = m.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
  const ftFormatted = feet.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
  return `${mFormatted} m (${ftFormatted} ft)`;
}
