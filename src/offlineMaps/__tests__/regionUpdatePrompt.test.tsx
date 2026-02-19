/**
 * Tests for Region Update Prompt functionality
 * @format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useRegionUpdatePrompt } from '../location/useRegionUpdatePrompt';
import type { OfflineRegion } from '../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Test component that uses the hook
function TestComponent({
  region,
  getCurrentLocation,
  thresholdMiles,
  cooldownHours,
  onAccept,
  onStateChange,
}: {
  region: OfflineRegion | null;
  getCurrentLocation: () => Promise<{ lat: number; lng: number } | null>;
  thresholdMiles?: number;
  cooldownHours?: number;
  onAccept?: () => void;
  onStateChange?: (state: ReturnType<typeof useRegionUpdatePrompt>) => void;
}) {
  const prompt = useRegionUpdatePrompt(
    {
      region,
      getCurrentLocation,
      thresholdMiles,
      cooldownHours,
    },
    onAccept,
  );

  React.useEffect(() => {
    onStateChange?.(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt.shouldShow, prompt.isChecking, prompt.error, onStateChange]);

  return null;
}

describe('Region Update Prompt', () => {
  const mockGetCurrentLocation = jest.fn();
  const mockOnAccept = jest.fn();

  // Create a mock region
  const createMockRegion = (
    centerLat: number,
    centerLng: number,
    status: 'ready' | 'idle' = 'ready',
    id: string = 'test-region-1',
  ): OfflineRegion => ({
    id,
    centerLat,
    centerLng,
    radiusMiles: 25,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    version: 1,
    status,
    storageSizeMB: 100,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('useRegionUpdatePrompt hook', () => {
    it('should not show prompt when region is null', async () => {
      let capturedState: ReturnType<typeof useRegionUpdatePrompt> | undefined;

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            region={null}
            getCurrentLocation={mockGetCurrentLocation}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );

        // Wait for any async operations
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(capturedState).toBeDefined();
      expect(capturedState!.shouldShow).toBe(false);
      expect(capturedState!.isChecking).toBe(false);
      expect(mockGetCurrentLocation).not.toHaveBeenCalled();
    });

    it('should not show prompt when region status is not ready', async () => {
      let capturedState: ReturnType<typeof useRegionUpdatePrompt> | undefined;
      const region = createMockRegion(37.7749, -122.4194, 'idle');

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            region={region}
            getCurrentLocation={mockGetCurrentLocation}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );

        // Wait for any async operations
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(capturedState).toBeDefined();
      expect(capturedState!.shouldShow).toBe(false);
      expect(mockGetCurrentLocation).not.toHaveBeenCalled();
    });

    it('should not show prompt when user is within threshold', async () => {
      let capturedState: ReturnType<typeof useRegionUpdatePrompt> | undefined;

      // Region center: San Francisco (37.7749, -122.4194)
      const region = createMockRegion(37.7749, -122.4194);

      // User location: ~10 miles away (still in SF area)
      mockGetCurrentLocation.mockResolvedValue({
        lat: 37.8749,
        lng: -122.4194,
      });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            region={region}
            getCurrentLocation={mockGetCurrentLocation}
            thresholdMiles={50}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );

        // Wait for async distance check
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(capturedState).toBeDefined();
      expect(capturedState!.shouldShow).toBe(false);
      expect(mockGetCurrentLocation).toHaveBeenCalled();
    });

    it('should show prompt when user is outside threshold', async () => {
      let capturedState: ReturnType<typeof useRegionUpdatePrompt> | undefined;

      // Region center: San Francisco (37.7749, -122.4194)
      const region = createMockRegion(37.7749, -122.4194);

      // User location: Las Vegas (~400 miles away)
      mockGetCurrentLocation.mockResolvedValue({
        lat: 36.1699,
        lng: -115.1398,
      });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            region={region}
            getCurrentLocation={mockGetCurrentLocation}
            thresholdMiles={50}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );

        // Wait for async distance check
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(capturedState).toBeDefined();
      expect(capturedState!.shouldShow).toBe(true);
      expect(mockGetCurrentLocation).toHaveBeenCalled();
    });

    it('should not show prompt when cooldown is active', async () => {
      let capturedState: ReturnType<typeof useRegionUpdatePrompt> | undefined;

      // Region center: San Francisco
      const region = createMockRegion(37.7749, -122.4194);

      // User location: Las Vegas (far away)
      mockGetCurrentLocation.mockResolvedValue({
        lat: 36.1699,
        lng: -115.1398,
      });

      // Cooldown: last shown 1 hour ago (should still be in cooldown for 24h default)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        oneHourAgo.toString(),
      );

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            region={region}
            getCurrentLocation={mockGetCurrentLocation}
            thresholdMiles={50}
            cooldownHours={24}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(capturedState).toBeDefined();
      expect(capturedState!.shouldShow).toBe(false);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        'offline_region_update_prompt_last_shown',
      );
    });

    it('should show prompt when cooldown has expired', async () => {
      let capturedState: ReturnType<typeof useRegionUpdatePrompt> | undefined;

      // Region center: San Francisco
      const region = createMockRegion(37.7749, -122.4194);

      // User location: Las Vegas (far away)
      mockGetCurrentLocation.mockResolvedValue({
        lat: 36.1699,
        lng: -115.1398,
      });

      // Cooldown: last shown 25 hours ago (should be expired for 24h cooldown)
      const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        twentyFiveHoursAgo.toString(),
      );

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            region={region}
            getCurrentLocation={mockGetCurrentLocation}
            thresholdMiles={50}
            cooldownHours={24}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(capturedState).toBeDefined();
      expect(capturedState!.shouldShow).toBe(true);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        'offline_region_update_prompt_last_shown',
      );
    });

    it('should save cooldown timestamp when dismiss is called', async () => {
      let capturedState: ReturnType<typeof useRegionUpdatePrompt> | undefined;

      // Region center: San Francisco
      const region = createMockRegion(37.7749, -122.4194);

      // User location: Las Vegas (far away)
      mockGetCurrentLocation.mockResolvedValue({
        lat: 36.1699,
        lng: -115.1398,
      });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            region={region}
            getCurrentLocation={mockGetCurrentLocation}
            thresholdMiles={50}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );

        // Wait for async distance check
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(capturedState).toBeDefined();
      expect(capturedState!.shouldShow).toBe(true);

      // Call dismiss
      await ReactTestRenderer.act(async () => {
        capturedState!.dismiss();
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_region_update_prompt_last_shown',
        expect.any(String),
      );
      expect(capturedState!.shouldShow).toBe(false);
    });

    it('should call onAccept and save cooldown when accept is called', async () => {
      let capturedState: ReturnType<typeof useRegionUpdatePrompt> | undefined;

      // Region center: San Francisco
      const region = createMockRegion(37.7749, -122.4194);

      // User location: Las Vegas (far away)
      mockGetCurrentLocation.mockResolvedValue({
        lat: 36.1699,
        lng: -115.1398,
      });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            region={region}
            getCurrentLocation={mockGetCurrentLocation}
            thresholdMiles={50}
            onAccept={mockOnAccept}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );

        // Wait for async distance check
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(capturedState).toBeDefined();
      expect(capturedState!.shouldShow).toBe(true);

      // Call accept
      await ReactTestRenderer.act(async () => {
        capturedState!.accept();
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(mockOnAccept).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_region_update_prompt_last_shown',
        expect.any(String),
      );
      expect(capturedState!.shouldShow).toBe(false);
    });

    it('should not show prompt when location is unavailable', async () => {
      let capturedState: ReturnType<typeof useRegionUpdatePrompt> | undefined;

      const region = createMockRegion(37.7749, -122.4194);

      // Location unavailable (returns null)
      mockGetCurrentLocation.mockResolvedValue(null);

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            region={region}
            getCurrentLocation={mockGetCurrentLocation}
            thresholdMiles={50}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(capturedState).toBeDefined();
      expect(capturedState!.shouldShow).toBe(false);
      expect(mockGetCurrentLocation).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      let capturedState: ReturnType<typeof useRegionUpdatePrompt> | undefined;

      const region = createMockRegion(37.7749, -122.4194);

      // Location throws error
      mockGetCurrentLocation.mockRejectedValue(
        new Error('Location permission denied'),
      );

      // Suppress expected console.error from the hook's error handler
      jest.spyOn(console, 'error').mockImplementation(() => {});

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <TestComponent
            region={region}
            getCurrentLocation={mockGetCurrentLocation}
            thresholdMiles={50}
            onStateChange={(state) => {
              capturedState = state;
            }}
          />,
        );

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(capturedState).toBeDefined();
      expect(capturedState!.shouldShow).toBe(false);
      expect(capturedState!.error).toBe('Location permission denied');

      jest.restoreAllMocks();
    });

    it('should rerun distance check when region id changes', async () => {
      const capturedStates: Array<ReturnType<typeof useRegionUpdatePrompt>> =
        [];

      // User location near San Francisco
      mockGetCurrentLocation.mockResolvedValue({
        lat: 37.7749,
        lng: -122.4194,
      });

      const region1 = createMockRegion(
        37.7749,
        -122.4194,
        'ready',
        'region-sf',
      );
      const region2 = createMockRegion(40.7128, -74.006, 'ready', 'region-nyc'); // New York, far away

      let testRenderer: ReactTestRenderer.ReactTestRenderer;

      // First render with region1 (nearby, should not show prompt)
      await ReactTestRenderer.act(async () => {
        testRenderer = ReactTestRenderer.create(
          <TestComponent
            region={region1}
            getCurrentLocation={mockGetCurrentLocation}
            thresholdMiles={50}
            onStateChange={(state) => {
              capturedStates.push(state);
            }}
          />,
        );

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Update with region2 (far away, should show prompt)
      await ReactTestRenderer.act(async () => {
        testRenderer!.update(
          <TestComponent
            region={region2}
            getCurrentLocation={mockGetCurrentLocation}
            thresholdMiles={50}
            onStateChange={(state) => {
              capturedStates.push(state);
            }}
          />,
        );

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Ensure we captured state for both regions
      expect(capturedStates.length).toBeGreaterThanOrEqual(2);

      const firstState = capturedStates[0];
      const lastState = capturedStates[capturedStates.length - 1];

      // Initially near the region: no prompt
      expect(firstState!.shouldShow).toBe(false);

      // After region id changes to a far-away region: prompt should show
      expect(lastState!.shouldShow).toBe(true);

      // Location check should have been performed again for the new region
      expect(mockGetCurrentLocation).toHaveBeenCalledTimes(2);
    });
  });
});
