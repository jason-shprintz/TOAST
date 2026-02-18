/**
 * Hook for orchestrating tap inspection
 * @format
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { distanceMeters } from '../../geo/geoMath';
import type { TapInspectorResult, TapInspectorFeature } from './types';
import type { GeoIndex } from '../../geoIndex/geoIndexTypes';
import type { MapFeatureRef } from '../../geoIndex/geoIndexTypes';
import type { TerrainService } from '../../terrain/terrainService';

// Default tolerance for tap hit testing (in meters)
const DEFAULT_TOLERANCE_METERS = 40;

// Maximum number of features to return
const MAX_FEATURES = 10;

export interface UseTapInspectorOptions {
  geoIndex: GeoIndex | null;
  terrain: TerrainService | null;
}

export interface UseTapInspectorReturn {
  isOpen: boolean;
  isLoading: boolean;
  error?: string;
  result?: TapInspectorResult;
  openAt(lat: number, lng: number): void;
  close(): void;
}

/**
 * Hook for tap inspector functionality
 * Orchestrates async computation of elevation, slope, and nearby features
 */
export function useTapInspector(
  opts: UseTapInspectorOptions,
): UseTapInspectorReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<TapInspectorResult | undefined>(
    undefined,
  );

  // Store timeout ID for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openAt = useCallback(
    (lat: number, lng: number) => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setIsOpen(true);
      setIsLoading(true);
      setError(undefined);

      // Compute result asynchronously (using setTimeout to avoid blocking UI)
      timeoutRef.current = setTimeout(() => {
        try {
          const { geoIndex, terrain } = opts;

          // Get elevation and slope
          const elevationM = terrain ? terrain.getElevation(lat, lng) : null;
          const slopePercent = terrain ? terrain.getSlope(lat, lng) : null;

          // Get features at point
          let features: TapInspectorFeature[] = [];
          if (geoIndex) {
            const mapFeatures = geoIndex.featuresAtPoint(
              lat,
              lng,
              DEFAULT_TOLERANCE_METERS,
            );

            // Transform and compute distances
            features = mapFeatures
              .map((feature: MapFeatureRef) => {
                const distance = distanceMeters(
                  lat,
                  lng,
                  feature.lat,
                  feature.lng,
                );

                return {
                  kind: feature.kind,
                  id: feature.id,
                  title: feature.name || getFallbackLabel(feature.kind),
                  subtitle: getSubtitle(feature),
                  distanceMeters: distance,
                };
              })
              .sort((a, b) => a.distanceMeters - b.distanceMeters)
              .slice(0, MAX_FEATURES);
          }

          // Set result
          setResult({
            location: { lat, lng },
            elevationM,
            slopePercent,
            features,
          });
          setIsLoading(false);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Failed to load tap details',
          );
          setIsLoading(false);
        }
      }, 0);
    },
    // Only geoIndex and terrain from opts are used, and they're stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opts.geoIndex, opts.terrain],
  );

  const close = useCallback(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(false);
    setError(undefined);
    // Keep result until next open for smooth transitions
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isOpen,
    isLoading,
    error,
    result,
    openAt,
    close,
  };
}

/**
 * Get fallback label for feature kind
 */
function getFallbackLabel(kind: 'water' | 'city' | 'road'): string {
  switch (kind) {
    case 'water':
      return 'Water';
    case 'city':
      return 'City';
    case 'road':
      return 'Road';
  }
}

/**
 * Get subtitle from feature properties
 */
function getSubtitle(feature: MapFeatureRef): string | undefined {
  if (!feature.props) {
    return undefined;
  }

  // Extract relevant property based on kind
  switch (feature.kind) {
    case 'water':
      return feature.props.type as string | undefined;
    case 'city':
      return feature.props.populationTier as string | undefined;
    case 'road':
      return feature.props.class as string | undefined;
    default:
      return undefined;
  }
}
