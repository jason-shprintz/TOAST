/**
 * Tests for Tap Inspector functionality
 * @format
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useTapInspector } from '../ui/inspector/useTapInspector';
import type { GeoIndex } from '../geoIndex/geoIndexTypes';
import type { TerrainService } from '../terrain/terrainService';
import type { MapFeatureRef } from '../geoIndex/geoIndexTypes';

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
  const createMockGeoIndex = (
    features: MapFeatureRef[] = [],
  ): GeoIndex => ({
    load: jest.fn(),
    unload: jest.fn(),
    nearestWater: jest.fn(() => null),
    nearestCity: jest.fn(() => null),
    featuresAtPoint: jest.fn(() => features),
  });

  describe('useTapInspector hook', () => {
    it('should initialize with closed state', () => {
      const { result } = renderHook(() =>
        useTapInspector({
          geoIndex: null,
          terrain: null,
        }),
      );

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.result).toBeUndefined();
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

      const { result, waitForNextUpdate } = renderHook(() =>
        useTapInspector({ geoIndex, terrain }),
      );

      act(() => {
        result.current.openAt(36.17, -115.14);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.isLoading).toBe(true);

      await waitForNextUpdate();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.result).toBeDefined();
      expect(result.current.result?.location).toEqual({
        lat: 36.17,
        lng: -115.14,
      });
      expect(result.current.result?.elevationM).toBe(1000);
      expect(result.current.result?.slopePercent).toBe(10);
      expect(result.current.result?.features).toHaveLength(2);
      expect(result.current.result?.features[0].title).toBe('Test Lake');
      expect(result.current.result?.features[0].subtitle).toBe('lake');
      expect(result.current.result?.features[1].title).toBe('Test City');
      expect(result.current.result?.features[1].subtitle).toBe('large');
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

      const { result, waitForNextUpdate } = renderHook(() =>
        useTapInspector({ geoIndex, terrain }),
      );

      act(() => {
        result.current.openAt(36.17, -115.14);
      });

      await waitForNextUpdate();

      expect(result.current.result?.elevationM).toBeNull();
      expect(result.current.result?.slopePercent).toBeNull();
      expect(result.current.result?.features).toHaveLength(1);
    });

    it('should handle missing services gracefully', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useTapInspector({
          geoIndex: null,
          terrain: null,
        }),
      );

      act(() => {
        result.current.openAt(36.17, -115.14);
      });

      await waitForNextUpdate();

      expect(result.current.result).toBeDefined();
      expect(result.current.result?.elevationM).toBeNull();
      expect(result.current.result?.slopePercent).toBeNull();
      expect(result.current.result?.features).toEqual([]);
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

      const { result, waitForNextUpdate } = renderHook(() =>
        useTapInspector({ geoIndex, terrain }),
      );

      act(() => {
        result.current.openAt(36.17, -115.14);
      });

      await waitForNextUpdate();

      expect(result.current.result?.features).toHaveLength(3);
      // Should be sorted by distance
      expect(result.current.result?.features[0].title).toBe('Near City');
      expect(result.current.result?.features[2].title).toBe('Far Lake');
    });

    it('should close and reset state', async () => {
      const terrain = createMockTerrain(1000, 10);
      const geoIndex = createMockGeoIndex([]);

      const { result, waitForNextUpdate } = renderHook(() =>
        useTapInspector({ geoIndex, terrain }),
      );

      act(() => {
        result.current.openAt(36.17, -115.14);
      });

      await waitForNextUpdate();

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.error).toBeUndefined();
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

      const { result, waitForNextUpdate } = renderHook(() =>
        useTapInspector({ geoIndex, terrain }),
      );

      act(() => {
        result.current.openAt(36.17, -115.14);
      });

      await waitForNextUpdate();

      expect(result.current.result?.features).toHaveLength(1);
      expect(result.current.result?.features[0].title).toBe('Water');
    });
  });
});
