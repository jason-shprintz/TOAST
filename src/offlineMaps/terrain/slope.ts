/**
 * Slope calculation using finite differences
 * @format
 */

// Earth radius in meters (WGS84)
const EARTH_RADIUS_METERS = 6378137;

/**
 * Compute slope at a point using finite difference gradient approximation.
 * Returns slope as percent grade (e.g., 10 = 10% grade).
 *
 * @param getElevation - Function to query elevation at a lat/lng
 * @param lat - Latitude of the point
 * @param lng - Longitude of the point
 * @param sampleDistanceMeters - Distance in meters for sampling neighbors
 * @returns Slope in percent grade, or null if cannot be computed
 */
export function computeSlopePercent(
  getElevation: (lat: number, lng: number) => number | null,
  lat: number,
  lng: number,
  sampleDistanceMeters: number,
): number | null {
  // Get center elevation
  const centerElev = getElevation(lat, lng);
  if (centerElev === null) {
    return null;
  }

  // Convert sample distance to degree offsets
  const latRad = (lat * Math.PI) / 180;
  const dLatDeg =
    (sampleDistanceMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const dLngDeg =
    (sampleDistanceMeters / (EARTH_RADIUS_METERS * Math.cos(latRad))) *
    (180 / Math.PI);

  // Sample elevations at four neighbors
  const northLat = lat + dLatDeg;
  const southLat = lat - dLatDeg;
  const eastLng = lng + dLngDeg;
  const westLng = lng - dLngDeg;

  const northElev = getElevation(northLat, lng);
  const southElev = getElevation(southLat, lng);
  const eastElev = getElevation(lat, eastLng);
  const westElev = getElevation(lat, westLng);

  // Try to compute gradients with central differences
  let dzdy: number | null = null;
  let dzdx: number | null = null;

  // Compute dz/dy (north-south gradient)
  if (northElev !== null && southElev !== null) {
    // Central difference
    dzdy = (northElev - southElev) / (2 * sampleDistanceMeters);
  } else if (northElev !== null) {
    // Forward difference using north only
    dzdy = (northElev - centerElev) / sampleDistanceMeters;
  } else if (southElev !== null) {
    // Forward difference using south only
    dzdy = (centerElev - southElev) / sampleDistanceMeters;
  }

  // Compute dz/dx (east-west gradient)
  if (eastElev !== null && westElev !== null) {
    // Central difference
    dzdx = (eastElev - westElev) / (2 * sampleDistanceMeters);
  } else if (eastElev !== null) {
    // Forward difference using east only
    dzdx = (eastElev - centerElev) / sampleDistanceMeters;
  } else if (westElev !== null) {
    // Forward difference using west only
    dzdx = (centerElev - westElev) / sampleDistanceMeters;
  }

  // If we couldn't compute either gradient, return null
  if (dzdy === null && dzdx === null) {
    return null;
  }

  // If only one gradient is available, use it
  if (dzdy === null) {
    dzdy = 0;
  }
  if (dzdx === null) {
    dzdx = 0;
  }

  // Compute gradient magnitude
  const gradientMagnitude = Math.sqrt(dzdx * dzdx + dzdy * dzdy);

  // Convert to percent grade
  return gradientMagnitude * 100;
}
