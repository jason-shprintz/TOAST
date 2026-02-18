/**
 * Tests for Tap Inspector functionality
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useTapInspector } from '../ui/inspector/useTapInspector';
import type { GeoIndex } from '../geoIndex/geoIndexTypes';
import type { MapFeatureRef } from '../geoIndex/geoIndexTypes';
import type { TerrainService } from '../terrain/terrainService';

// Test component that uses the hook
function TestComponent({
  geoIndex,
  terrain,
  onStateChange,
}: {
  geoIndex: GeoIndex | null;
  terrain: TerrainService | null;
  onStateChange?: (state: ReturnType<typeof useTapInspector>) => void;
}) {
  const inspector = useTapInspector({ geoIndex, terrain });

  React.useEffect(() => {
    onStateChange?.(inspector);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    inspector.isOpen,
    inspector.isLoading,
    inspector.result,
    inspector.error,
    onStateChange,
  ]);

  return null;
}

describe('Tap Inspector', () => {
  // Mock terrain service
  const createMockTerrain = (
    elevation: number | null = 1000,
    slope: number | null = 10,
  ): TerrainService => ({
    getElevation: jest.fn(() => elevation),
    getSlope: jest.fn(() => slope),
    findHighestPointWithin: jest.fn(() => null),
  });

  // Mock geo index
  const createMockGeoIndex = (features: MapFeatureRef[] = []): GeoIndex => ({
    load: jest.fn(),
    unload: jest.fn(),
    nearestWater: jest.fn(() => null),
    nearestCity: jest.fn(() => null),
    featuresAtPoint: jest.fn(() => features),
  });

  describe('useTapInspector hook', () => {
    it('should initialize with closed state', () => {
      let capturedState: ReturnType<typeof useTapInspector> | undefined;

      ReactTestRenderer.act(() => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={null}
            terrain={null}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      expect(capturedState).toBeDefined();
      expect(capturedState!.isOpen).toBe(false);
      expect(capturedState!.isLoading).toBe(false);
      expect(capturedState!.error).toBeUndefined();
      expect(capturedState!.result).toBeUndefined();
    });

    it('should open and populate result with elevation, slope, and features', async () => {
      const mockFeatures: MapFeatureRef[] = [
        {
          kind: 'water',
          id: 'water1',
          name: 'Test Lake',
          lat: 36.17,
          lng: -115.14,
          props: { type: 'lake' },
        },
        {
          kind: 'city',
          id: 'city1',
          name: 'Test City',
          lat: 36.171,
          lng: -115.141,
          props: { populationTier: 'large' },
        },
      ];

      const terrain = createMockTerrain(1000, 10);
      const geoIndex = createMockGeoIndex(mockFeatures);

      let capturedState: ReturnType<typeof useTapInspector> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={geoIndex}
            terrain={terrain}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      // Open at a location
      await ReactTestRenderer.act(async () => {
        capturedState!.openAt(36.17, -115.14);
        // Wait for async update
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(capturedState!.result).toBeDefined();
      expect(capturedState!.result?.location).toEqual({
        lat: 36.17,
        lng: -115.14,
      });
      expect(capturedState!.result?.elevationM).toBe(1000);
      expect(capturedState!.result?.slopePercent).toBe(10);
      expect(capturedState!.result?.features).toHaveLength(2);
      expect(capturedState!.result?.features[0].title).toBe('Test Lake');
      expect(capturedState!.result?.features[0].subtitle).toBe('lake');
      expect(capturedState!.result?.features[1].title).toBe('Test City');
      expect(capturedState!.result?.features[1].subtitle).toBe('large');
    });

    it('should handle null elevation and slope', async () => {
      const mockFeatures: MapFeatureRef[] = [
        {
          kind: 'road',
          id: 'road1',
          name: 'Test Road',
          lat: 36.17,
          lng: -115.14,
          props: { class: 'highway' },
        },
      ];

      const terrain = createMockTerrain(null, null);
      const geoIndex = createMockGeoIndex(mockFeatures);

      let capturedState: ReturnType<typeof useTapInspector> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={geoIndex}
            terrain={terrain}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      await ReactTestRenderer.act(async () => {
        capturedState!.openAt(36.17, -115.14);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(capturedState!.result?.elevationM).toBeNull();
      expect(capturedState!.result?.slopePercent).toBeNull();
      expect(capturedState!.result?.features).toHaveLength(1);
    });

    it('should handle missing services gracefully', async () => {
      let capturedState: ReturnType<typeof useTapInspector> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={null}
            terrain={null}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      await ReactTestRenderer.act(async () => {
        capturedState!.openAt(36.17, -115.14);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(capturedState!.result).toBeDefined();
      expect(capturedState!.result?.elevationM).toBeNull();
      expect(capturedState!.result?.slopePercent).toBeNull();
      expect(capturedState!.result?.features).toEqual([]);
    });

    it('should sort features by distance ascending', async () => {
      const mockFeatures: MapFeatureRef[] = [
        {
          kind: 'water',
          id: 'water1',
          name: 'Far Lake',
          lat: 36.2, // Far away
          lng: -115.2,
        },
        {
          kind: 'city',
          id: 'city1',
          name: 'Near City',
          lat: 36.17, // Very close
          lng: -115.14,
        },
        {
          kind: 'road',
          id: 'road1',
          name: 'Mid Road',
          lat: 36.18, // Medium distance
          lng: -115.15,
        },
      ];

      const terrain = createMockTerrain(1000, 10);
      const geoIndex = createMockGeoIndex(mockFeatures);

      let capturedState: ReturnType<typeof useTapInspector> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={geoIndex}
            terrain={terrain}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      await ReactTestRenderer.act(async () => {
        capturedState!.openAt(36.17, -115.14);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(capturedState!.result?.features).toHaveLength(3);
      // Should be sorted by distance
      expect(capturedState!.result?.features[0].title).toBe('Near City');
      expect(capturedState!.result?.features[2].title).toBe('Far Lake');
    });

    it('should close and reset state', async () => {
      const terrain = createMockTerrain(1000, 10);
      const geoIndex = createMockGeoIndex([]);

      let capturedState: ReturnType<typeof useTapInspector> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={geoIndex}
            terrain={terrain}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      await ReactTestRenderer.act(async () => {
        capturedState!.openAt(36.17, -115.14);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(capturedState!.isOpen).toBe(true);

      ReactTestRenderer.act(() => {
        capturedState!.close();
      });

      expect(capturedState!.isOpen).toBe(false);
      expect(capturedState!.error).toBeUndefined();
    });

    it('should handle features without names gracefully', async () => {
      const mockFeatures: MapFeatureRef[] = [
        {
          kind: 'water',
          id: 'water1',
          lat: 36.17,
          lng: -115.14,
          // No name property
        },
      ];

      const terrain = createMockTerrain(1000, 10);
      const geoIndex = createMockGeoIndex(mockFeatures);

      let capturedState: ReturnType<typeof useTapInspector> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            geoIndex={geoIndex}
            terrain={terrain}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );
      });

      await ReactTestRenderer.act(async () => {
        capturedState!.openAt(36.17, -115.14);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(capturedState!.result?.features).toHaveLength(1);
      expect(capturedState!.result?.features[0].title).toBe('Water');
    });
  });
});
