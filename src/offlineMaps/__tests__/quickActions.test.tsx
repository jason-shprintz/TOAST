/**
 * Tests for Quick Actions functionality
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useQuickActions } from '../ui/actions/useQuickActions';
import type { GeoIndex } from '../geoIndex/geoIndexTypes';
import type { MapFeatureRef } from '../geoIndex/geoIndexTypes';
import type { TerrainService } from '../terrain/terrainService';
import type { TerrainPoint } from '../terrain/terrainTypes';

// Test component that uses the hook
function TestComponent(props: {
  geoIndex: GeoIndex | null;
  terrain: TerrainService | null;
  getUserLocation: () => Promise<{ lat: number; lng: number } | null>;
  getMapCenter?: () => { lat: number; lng: number } | null;
  onStateChange?: (state: ReturnType<typeof useQuickActions>) => void;
}) {
  const quickActions = useQuickActions({
    geoIndex: props.geoIndex,
    terrain: props.terrain,
    getUserLocation: props.getUserLocation,
    getMapCenter: props.getMapCenter,
  });

  React.useEffect(() => {
    props.onStateChange?.(quickActions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    quickActions.markers,
    quickActions.isRunning,
    quickActions.error,
    quickActions.selectedMarker,
    props.onStateChange,
  ]);

  return null;
}

describe('Quick Actions', () => {
  // Mock terrain service
  const createMockTerrain = (
    highestPoint: TerrainPoint | null = {
      lat: 36.2,
      lng: -115.2,
      elevationM: 1500,
    },
  ): TerrainService => ({
    getElevation: jest.fn(() => null),
    getSlope: jest.fn(() => null),
    findHighestPointWithin: jest.fn(() => highestPoint),
  });

  // Mock geo index
  const createMockGeoIndex = (
    waterFeature: MapFeatureRef | null = {
      kind: 'water',
      id: 'water1',
      name: 'Test Lake',
      lat: 36.15,
      lng: -115.15,
      props: { type: 'lake' },
    },
  ): GeoIndex => ({
    load: jest.fn(),
    unload: jest.fn(),
    nearestWater: jest.fn(() => waterFeature),
    nearestCity: jest.fn(() => null),
    featuresAtPoint: jest.fn(() => []),
  });

  // Mock location provider
  const mockGetUserLocation = jest.fn();
  const mockGetMapCenter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserLocation.mockResolvedValue({ lat: 36.17, lng: -115.14 });
    mockGetMapCenter.mockReturnValue({ lat: 36.17, lng: -115.14 });
  });

  describe('useQuickActions hook', () => {
    it('should initialize with empty markers', () => {
      let capturedState: ReturnType<typeof useQuickActions> | undefined;

      ReactTestRenderer.act(() => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={null}
            terrain={null}
            getUserLocation={mockGetUserLocation}
            getMapCenter={mockGetMapCenter}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      expect(capturedState).toBeDefined();
      expect(capturedState!.markers).toEqual([]);
      expect(capturedState!.isRunning).toBe(false);
      expect(capturedState!.error).toBeUndefined();
      expect(capturedState!.selectedMarker).toBeUndefined();
    });

    it('should find nearest water and create marker', async () => {
      const waterFeature: MapFeatureRef = {
        kind: 'water',
        id: 'water1',
        name: 'Test Lake',
        lat: 36.15,
        lng: -115.15,
        props: { type: 'lake' },
      };

      const geoIndex = createMockGeoIndex(waterFeature);
      let capturedState: ReturnType<typeof useQuickActions> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={geoIndex}
            terrain={null}
            getUserLocation={mockGetUserLocation}
            getMapCenter={mockGetMapCenter}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      // Execute action
      await ReactTestRenderer.act(async () => {
        await capturedState!.findNearestWater();
      });

      expect(capturedState!.markers).toHaveLength(1);
      expect(capturedState!.markers[0].kind).toBe('nearestWater');
      expect(capturedState!.markers[0].title).toBe('Nearest Water');
      expect(capturedState!.markers[0].subtitle).toBe('Test Lake');
      expect(capturedState!.markers[0].lat).toBe(36.15);
      expect(capturedState!.markers[0].lng).toBe(-115.15);
      expect(capturedState!.markers[0].distanceMeters).toBeGreaterThan(0);
      expect(capturedState!.selectedMarker).toEqual(capturedState!.markers[0]);
      expect(capturedState!.isRunning).toBe(false);
      expect(capturedState!.error).toBeUndefined();
    });

    it('should handle null water result with error', async () => {
      const geoIndex = createMockGeoIndex(null);
      let capturedState: ReturnType<typeof useQuickActions> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={geoIndex}
            terrain={null}
            getUserLocation={mockGetUserLocation}
            getMapCenter={mockGetMapCenter}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      await ReactTestRenderer.act(async () => {
        await capturedState!.findNearestWater();
      });

      expect(capturedState!.markers).toHaveLength(0);
      expect(capturedState!.error).toBe(
        'No water sources found in your offline area.',
      );
      expect(capturedState!.isRunning).toBe(false);
    });

    it('should find highest elevation and create marker', async () => {
      const highestPoint: TerrainPoint = {
        lat: 36.2,
        lng: -115.2,
        elevationM: 1500,
      };

      const terrain = createMockTerrain(highestPoint);
      let capturedState: ReturnType<typeof useQuickActions> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={null}
            terrain={terrain}
            getUserLocation={mockGetUserLocation}
            getMapCenter={mockGetMapCenter}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      await ReactTestRenderer.act(async () => {
        await capturedState!.findHighestElevation();
      });

      expect(capturedState!.markers).toHaveLength(1);
      expect(capturedState!.markers[0].kind).toBe('highestElevation');
      expect(capturedState!.markers[0].title).toBe('Highest Elevation (5 mi)');
      expect(capturedState!.markers[0].lat).toBe(36.2);
      expect(capturedState!.markers[0].lng).toBe(-115.2);
      expect(capturedState!.markers[0].elevationM).toBe(1500);
      expect(capturedState!.markers[0].subtitle).toBe('Within 5 mile radius');
      expect(capturedState!.selectedMarker).toEqual(capturedState!.markers[0]);
      expect(capturedState!.isRunning).toBe(false);
      expect(capturedState!.error).toBeUndefined();
    });

    it('should handle null highest point result with error', async () => {
      const terrain = createMockTerrain(null);
      let capturedState: ReturnType<typeof useQuickActions> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={null}
            terrain={terrain}
            getUserLocation={mockGetUserLocation}
            getMapCenter={mockGetMapCenter}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      await ReactTestRenderer.act(async () => {
        await capturedState!.findHighestElevation();
      });

      expect(capturedState!.markers).toHaveLength(0);
      expect(capturedState!.error).toBe(
        'Unable to determine highest elevation (DEM not available).',
      );
      expect(capturedState!.isRunning).toBe(false);
    });

    it('should handle missing geoIndex with error', async () => {
      let capturedState: ReturnType<typeof useQuickActions> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={null}
            terrain={null}
            getUserLocation={mockGetUserLocation}
            getMapCenter={mockGetMapCenter}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      await ReactTestRenderer.act(async () => {
        await capturedState!.findNearestWater();
      });

      expect(capturedState!.markers).toHaveLength(0);
      expect(capturedState!.error).toBe('Offline index is still loading.');
      expect(capturedState!.isRunning).toBe(false);
    });

    it('should handle missing terrain with error', async () => {
      let capturedState: ReturnType<typeof useQuickActions> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={null}
            terrain={null}
            getUserLocation={mockGetUserLocation}
            getMapCenter={mockGetMapCenter}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      await ReactTestRenderer.act(async () => {
        await capturedState!.findHighestElevation();
      });

      expect(capturedState!.markers).toHaveLength(0);
      expect(capturedState!.error).toBe('Terrain data is still loading.');
      expect(capturedState!.isRunning).toBe(false);
    });

    it('should fallback to map center when location unavailable', async () => {
      mockGetUserLocation.mockResolvedValue(null);

      const waterFeature: MapFeatureRef = {
        kind: 'water',
        id: 'water1',
        name: 'Test Lake',
        lat: 36.15,
        lng: -115.15,
      };

      const geoIndex = createMockGeoIndex(waterFeature);
      let capturedState: ReturnType<typeof useQuickActions> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={geoIndex}
            terrain={null}
            getUserLocation={mockGetUserLocation}
            getMapCenter={mockGetMapCenter}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      await ReactTestRenderer.act(async () => {
        await capturedState!.findNearestWater();
      });

      expect(capturedState!.markers).toHaveLength(1);
      expect(mockGetMapCenter).toHaveBeenCalled();
      expect(capturedState!.error).toBeUndefined();
    });

    it('should handle no location and no map center with error', async () => {
      mockGetUserLocation.mockResolvedValue(null);

      const geoIndex = createMockGeoIndex();
      let capturedState: ReturnType<typeof useQuickActions> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={geoIndex}
            terrain={null}
            getUserLocation={mockGetUserLocation}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      await ReactTestRenderer.act(async () => {
        await capturedState!.findNearestWater();
      });

      expect(capturedState!.markers).toHaveLength(0);
      expect(capturedState!.error).toBe(
        'Unable to determine a starting point.',
      );
      expect(capturedState!.isRunning).toBe(false);
    });

    it('should clear specific marker', async () => {
      const waterFeature: MapFeatureRef = {
        kind: 'water',
        id: 'water1',
        name: 'Test Lake',
        lat: 36.15,
        lng: -115.15,
      };

      const geoIndex = createMockGeoIndex(waterFeature);
      const terrain = createMockTerrain();
      let capturedState: ReturnType<typeof useQuickActions> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={geoIndex}
            terrain={terrain}
            getUserLocation={mockGetUserLocation}
            getMapCenter={mockGetMapCenter}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      // Add both markers
      await ReactTestRenderer.act(async () => {
        await capturedState!.findNearestWater();
      });

      await ReactTestRenderer.act(async () => {
        await capturedState!.findHighestElevation();
      });

      expect(capturedState!.markers).toHaveLength(2);

      // Clear one marker
      ReactTestRenderer.act(() => {
        capturedState!.clearMarker('nearestWater');
      });

      expect(capturedState!.markers).toHaveLength(1);
      expect(capturedState!.markers[0].kind).toBe('highestElevation');
    });

    it('should clear all markers', async () => {
      const waterFeature: MapFeatureRef = {
        kind: 'water',
        id: 'water1',
        name: 'Test Lake',
        lat: 36.15,
        lng: -115.15,
      };

      const geoIndex = createMockGeoIndex(waterFeature);
      const terrain = createMockTerrain();
      let capturedState: ReturnType<typeof useQuickActions> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={geoIndex}
            terrain={terrain}
            getUserLocation={mockGetUserLocation}
            getMapCenter={mockGetMapCenter}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      // Add both markers
      await ReactTestRenderer.act(async () => {
        await capturedState!.findNearestWater();
      });

      await ReactTestRenderer.act(async () => {
        await capturedState!.findHighestElevation();
      });

      expect(capturedState!.markers).toHaveLength(2);

      // Clear all
      ReactTestRenderer.act(() => {
        capturedState!.clearAll();
      });

      expect(capturedState!.markers).toHaveLength(0);
      expect(capturedState!.selectedMarker).toBeUndefined();
      expect(capturedState!.error).toBeUndefined();
    });

    it('should handle marker press', async () => {
      const waterFeature: MapFeatureRef = {
        kind: 'water',
        id: 'water1',
        name: 'Test Lake',
        lat: 36.15,
        lng: -115.15,
      };

      const geoIndex = createMockGeoIndex(waterFeature);
      let capturedState: ReturnType<typeof useQuickActions> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={geoIndex}
            terrain={null}
            getUserLocation={mockGetUserLocation}
            getMapCenter={mockGetMapCenter}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      await ReactTestRenderer.act(async () => {
        await capturedState!.findNearestWater();
      });

      expect(capturedState!.selectedMarker).toBeDefined();

      // Clear selection
      ReactTestRenderer.act(() => {
        capturedState!.onMarkerPress('');
      });

      // Press marker again
      ReactTestRenderer.act(() => {
        capturedState!.onMarkerPress('nearestWater');
      });

      expect(capturedState!.selectedMarker).toBeDefined();
      expect(capturedState!.selectedMarker?.id).toBe('nearestWater');
    });

    it('should replace existing marker of same kind', async () => {
      const waterFeature1: MapFeatureRef = {
        kind: 'water',
        id: 'water1',
        name: 'Test Lake 1',
        lat: 36.15,
        lng: -115.15,
      };

      const waterFeature2: MapFeatureRef = {
        kind: 'water',
        id: 'water2',
        name: 'Test Lake 2',
        lat: 36.18,
        lng: -115.18,
      };

      const geoIndex = createMockGeoIndex(waterFeature1);
      let capturedState: ReturnType<typeof useQuickActions> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={geoIndex}
            terrain={null}
            getUserLocation={mockGetUserLocation}
            getMapCenter={mockGetMapCenter}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      // First search
      await ReactTestRenderer.act(async () => {
        await capturedState!.findNearestWater();
      });

      expect(capturedState!.markers).toHaveLength(1);
      expect(capturedState!.markers[0].subtitle).toBe('Test Lake 1');

      // Update mock to return different water
      (geoIndex.nearestWater as jest.Mock).mockReturnValue(waterFeature2);

      // Second search
      await ReactTestRenderer.act(async () => {
        await capturedState!.findNearestWater();
      });

      // Should still have only 1 marker (replaced)
      expect(capturedState!.markers).toHaveLength(1);
      expect(capturedState!.markers[0].subtitle).toBe('Test Lake 2');
    });
  });
});
