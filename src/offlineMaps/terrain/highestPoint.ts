/**
 * Highest point search within a radius
 * @format
 */

import type { TerrainPoint, HighestPointOptions } from './terrainTypes';

// Earth radius in meters (WGS84)
const EARTH_RADIUS_METERS = 6378137;

/**
 * Calculate distance between two points using equirectangular approximation.
 * Fast and accurate enough for distances <= 20km.
 *
 * @param lat1 - Latitude of first point in degrees
 * @param lng1 - Longitude of first point in degrees
 * @param lat2 - Latitude of second point in degrees
 * @param lng2 - Longitude of second point in degrees
 * @returns Distance in meters
 */
function equirectangularDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const lng1Rad = (lng1 * Math.PI) / 180;
  const lng2Rad = (lng2 * Math.PI) / 180;

  const x = (lng2Rad - lng1Rad) * Math.cos((lat1Rad + lat2Rad) / 2);
  const y = lat2Rad - lat1Rad;

  return EARTH_RADIUS_METERS * Math.sqrt(x * x + y * y);
}

/**
 * Find the highest point within a circular radius.
 * Uses grid scan approach with configurable step size.
 *
 * @param getElevation - Function to query elevation at a lat/lng
 * @param centerLat - Center latitude
 * @param centerLng - Center longitude
 * @param opts - Search options (radius, step size, max samples)
 * @param bounds - DEM bounds to clip search area
 * @returns Highest terrain point found, or null if none
 */
export function findHighestPointInRadius(
  getElevation: (lat: number, lng: number) => number | null,
  centerLat: number,
  centerLng: number,
  opts: HighestPointOptions,
  bounds: { minLat: number; minLng: number; maxLat: number; maxLng: number },
): TerrainPoint | null {
  const { radiusMeters, maxSamples = 50000 } = opts;
  let { stepMeters } = opts;

  // Convert radius to degree bounds
  const latRad = (centerLat * Math.PI) / 180;
  const dLat = (radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const dLng =
    (radiusMeters / (EARTH_RADIUS_METERS * Math.cos(latRad))) * (180 / Math.PI);

  // Create bounding box for search
  let minLat = Math.max(centerLat - dLat, bounds.minLat);
  let maxLat = Math.min(centerLat + dLat, bounds.maxLat);
  let minLng = Math.max(centerLng - dLng, bounds.minLng);
  let maxLng = Math.min(centerLng + dLng, bounds.maxLng);

  // If no step size provided, use a default
  if (!stepMeters) {
    stepMeters = 60; // Default step size
  }

  // Calculate initial number of samples
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;

  // Convert step meters to degrees (approximate)
  const stepLatDeg = (stepMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const stepLngDeg =
    (stepMeters / (EARTH_RADIUS_METERS * Math.cos(latRad))) * (180 / Math.PI);

  let latSteps = Math.ceil(latSpan / stepLatDeg) + 1;
  let lngSteps = Math.ceil(lngSpan / stepLngDeg) + 1;
  let totalSamples = latSteps * lngSteps;

  // If too many samples, increase step size automatically
  if (totalSamples > maxSamples) {
    const scaleFactor = Math.sqrt(totalSamples / maxSamples);
    stepMeters *= scaleFactor;

    // Recalculate with new step size
    const newStepLatDeg = (stepMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
    const newStepLngDeg =
      (stepMeters / (EARTH_RADIUS_METERS * Math.cos(latRad))) * (180 / Math.PI);

    latSteps = Math.ceil(latSpan / newStepLatDeg) + 1;
    lngSteps = Math.ceil(lngSpan / newStepLngDeg) + 1;
  }

  // Track highest point found
  let highestPoint: TerrainPoint | null = null;
  let maxElevation = -Infinity;

  // Grid scan
  for (let i = 0; i < latSteps; i++) {
    const lat = minLat + (i / (latSteps - 1)) * latSpan;

    for (let j = 0; j < lngSteps; j++) {
      const lng = minLng + (j / (lngSteps - 1)) * lngSpan;

      // Check if point is within circular radius
      const distance = equirectangularDistance(centerLat, centerLng, lat, lng);
      if (distance > radiusMeters) {
        continue;
      }

      // Get elevation
      const elevation = getElevation(lat, lng);
      if (elevation === null) {
        continue;
      }

      // Update highest point if this is higher
      if (elevation > maxElevation) {
        maxElevation = elevation;
        highestPoint = {
          lat,
          lng,
          elevationM: elevation,
        };
      }
    }
  }

  return highestPoint;
}
