/**
 * Hook for quick action functionality
 * @format
 */

import { useCallback, useState } from 'react';
import { distanceMeters } from '../../geo/geoMath';
import { formatElevation } from '../markers/markerFormatters';
import type { GeoIndex } from '../../geoIndex/geoIndexTypes';
import type { TerrainService } from '../../terrain/terrainService';
import type { MapMarker, MarkerKind } from '../markers/types';

// 5 miles in meters
const FIVE_MILES_METERS = 8046.72;

export interface UseQuickActionsOptions {
  geoIndex: GeoIndex | null;
  terrain: TerrainService | null;
  getUserLocation: () => Promise<{ lat: number; lng: number } | null>;
  getMapCenter?: () => { lat: number; lng: number } | null;
}

export interface UseQuickActionsReturn {
  markers: MapMarker[];
  isRunning: boolean;
  error?: string;
  selectedMarker?: MapMarker;

  findNearestWater(): Promise<void>;
  findHighestElevation(): Promise<void>;

  clearMarker(kind: MarkerKind): void;
  clearAll(): void;

  onMarkerPress(markerId: string): void;
}

/**
 * Hook for quick actions functionality
 * Handles finding nearest water and highest elevation
 */
export function useQuickActions(
  opts: UseQuickActionsOptions,
): UseQuickActionsReturn {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | undefined>(
    undefined,
  );

  const { geoIndex, terrain, getUserLocation, getMapCenter } = opts;

  /**
   * Get origin point for queries (prefer user location, fallback to map center)
   */
  const getOriginPoint = useCallback(async (): Promise<{
    lat: number;
    lng: number;
  } | null> => {
    try {
      const userLocation = await getUserLocation();
      if (userLocation) {
        return userLocation;
      }
    } catch {
      // Ignore location errors, fall through to map center
    }

    if (getMapCenter) {
      return getMapCenter();
    }

    return null;
  }, [getUserLocation, getMapCenter]);

  /**
   * Find nearest water feature
   */
  const findNearestWater = useCallback(async () => {
    setIsRunning(true);
    setError(undefined);

    try {
      // Check if geoIndex is available
      if (!geoIndex) {
        setError('Offline index is still loading.');
        setIsRunning(false);
        return;
      }

      // Get origin point
      const origin = await getOriginPoint();
      if (!origin) {
        setError('Unable to determine a starting point.');
        setIsRunning(false);
        return;
      }

      // Find nearest water
      const waterFeature = geoIndex.nearestWater(origin.lat, origin.lng);
      if (!waterFeature) {
        setError('No water sources found in your offline area.');
        setIsRunning(false);
        return;
      }

      // Calculate distance
      const distance = distanceMeters(
        origin.lat,
        origin.lng,
        waterFeature.lat,
        waterFeature.lng,
      );

      // Create marker
      const marker: MapMarker = {
        id: 'nearestWater',
        kind: 'nearestWater',
        lat: waterFeature.lat,
        lng: waterFeature.lng,
        title: 'Nearest Water',
        subtitle: waterFeature.name || waterFeature.props?.type,
        distanceMeters: distance,
      };

      // Update markers (replace existing nearestWater marker)
      setMarkers((prev) => {
        const filtered = prev.filter((m) => m.kind !== 'nearestWater');
        return [...filtered, marker];
      });

      // Select the new marker
      setSelectedMarker(marker);
      setIsRunning(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to find nearest water',
      );
      setIsRunning(false);
    }
  }, [geoIndex, getOriginPoint]);

  /**
   * Find highest elevation within 5 miles
   */
  const findHighestElevation = useCallback(async () => {
    setIsRunning(true);
    setError(undefined);

    try {
      // Check if terrain service is available
      if (!terrain) {
        setError('Terrain data is still loading.');
        setIsRunning(false);
        return;
      }

      // Get origin point
      const origin = await getOriginPoint();
      if (!origin) {
        setError('Unable to determine a starting point.');
        setIsRunning(false);
        return;
      }

      // Find highest point within radius
      const highestPoint = terrain.findHighestPointWithin(
        origin.lat,
        origin.lng,
        { radiusMeters: FIVE_MILES_METERS },
      );

      if (!highestPoint) {
        setError('Unable to determine highest elevation (DEM not available).');
        setIsRunning(false);
        return;
      }

      // Create marker
      const marker: MapMarker = {
        id: 'highestElevation',
        kind: 'highestElevation',
        lat: highestPoint.lat,
        lng: highestPoint.lng,
        title: 'Highest Elevation (5 mi)',
        subtitle: formatElevation(highestPoint.elevationM),
        elevationM: highestPoint.elevationM,
      };

      // Update markers (replace existing highestElevation marker)
      setMarkers((prev) => {
        const filtered = prev.filter((m) => m.kind !== 'highestElevation');
        return [...filtered, marker];
      });

      // Select the new marker
      setSelectedMarker(marker);
      setIsRunning(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to find highest elevation',
      );
      setIsRunning(false);
    }
  }, [terrain, getOriginPoint]);

  /**
   * Clear a specific marker
   */
  const clearMarker = useCallback((kind: MarkerKind) => {
    setMarkers((prev) => prev.filter((m) => m.kind !== kind));
    setSelectedMarker((prev) => (prev?.kind === kind ? undefined : prev));
  }, []);

  /**
   * Clear all markers
   */
  const clearAll = useCallback(() => {
    setMarkers([]);
    setSelectedMarker(undefined);
    setError(undefined);
  }, []);

  /**
   * Handle marker press
   */
  const onMarkerPress = useCallback((markerId: string) => {
    setMarkers((prev) => {
      const marker = prev.find((m) => m.id === markerId);
      if (marker) {
        setSelectedMarker(marker);
      }
      return prev;
    });
  }, []);

  return {
    markers,
    isRunning,
    error,
    selectedMarker,
    findNearestWater,
    findHighestElevation,
    clearMarker,
    clearAll,
    onMarkerPress,
  };
}
