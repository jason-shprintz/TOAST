/**
 * Overlay provider implementations
 * @format
 */

import {
  WATER_SCHEMA_VERSION,
  CITY_SCHEMA_VERSION,
  ROAD_SCHEMA_VERSION,
} from '../schemas';
import type {
  OverlayProvider,
  OverlayKind,
  OverlayRequest,
  OverlayFetchProgress,
} from './overlayTypes';

/**
 * Placeholder provider that throws an error
 * Used when no real provider is configured
 */
export class PlaceholderOverlayProvider implements OverlayProvider {
  async fetchOverlay(
    _kind: OverlayKind,
    _req: OverlayRequest,
    _opts?: { onProgress?: (progress: OverlayFetchProgress) => void },
  ): Promise<unknown> {
    throw new Error('Overlay provider not configured');
  }
}

/**
 * Synthetic provider for testing
 * Returns deterministic valid objects for each overlay kind
 */
export class SyntheticOverlayProvider implements OverlayProvider {
  async fetchOverlay(
    kind: OverlayKind,
    req: OverlayRequest,
    opts?: { onProgress?: (progress: OverlayFetchProgress) => void },
  ): Promise<unknown> {
    const generatedAt = new Date().toISOString();

    // Simulate progress reporting
    if (opts?.onProgress) {
      opts.onProgress({ message: `Fetching ${kind}...`, downloadedBytes: 0 });
      opts.onProgress({
        message: `Fetching ${kind}...`,
        downloadedBytes: 100,
        totalBytes: 100,
      });
    }

    switch (kind) {
      case 'water':
        return {
          schemaVersion: WATER_SCHEMA_VERSION,
          generatedAt,
          regionId: req.regionId,
          features: [
            {
              id: 'water-1',
              type: 'river',
              geometry: {
                kind: 'LineString',
                coordinates: [
                  [req.bounds.minLng, req.bounds.minLat],
                  [req.bounds.maxLng, req.bounds.maxLat],
                ],
              },
              properties: {
                name: 'Test River',
                isSeasonal: false,
              },
            },
            {
              id: 'water-2',
              type: 'lake',
              geometry: {
                kind: 'Polygon',
                coordinates: [
                  [
                    [req.bounds.minLng, req.bounds.minLat],
                    [req.bounds.maxLng, req.bounds.minLat],
                    [req.bounds.maxLng, req.bounds.maxLat],
                    [req.bounds.minLng, req.bounds.maxLat],
                    [req.bounds.minLng, req.bounds.minLat],
                  ],
                ],
              },
              properties: {
                name: 'Test Lake',
                isSeasonal: false,
              },
            },
          ],
        };

      case 'cities':
        return {
          schemaVersion: CITY_SCHEMA_VERSION,
          generatedAt,
          regionId: req.regionId,
          features: [
            {
              id: 'city-1',
              geometry: {
                kind: 'Point',
                coordinates: [
                  (req.bounds.minLng + req.bounds.maxLng) / 2,
                  (req.bounds.minLat + req.bounds.maxLat) / 2,
                ],
              },
              properties: {
                name: 'Test City',
                populationTier: 'medium',
                population: 50000,
              },
            },
          ],
        };

      case 'roads':
        return {
          schemaVersion: ROAD_SCHEMA_VERSION,
          generatedAt,
          regionId: req.regionId,
          features: [
            {
              id: 'road-1',
              geometry: {
                kind: 'LineString',
                coordinates: [
                  [req.bounds.minLng, req.bounds.minLat],
                  [
                    (req.bounds.minLng + req.bounds.maxLng) / 2,
                    (req.bounds.minLat + req.bounds.maxLat) / 2,
                  ],
                  [req.bounds.maxLng, req.bounds.maxLat],
                ],
              },
              properties: {
                class: 'highway',
                name: 'Test Highway',
              },
            },
            {
              id: 'road-2',
              geometry: {
                kind: 'LineString',
                coordinates: [
                  [req.bounds.minLng, req.bounds.maxLat],
                  [req.bounds.maxLng, req.bounds.minLat],
                ],
              },
              properties: {
                class: 'trail',
              },
            },
          ],
        };

      default:
        throw new Error(`Unknown overlay kind: ${kind}`);
    }
  }
}
