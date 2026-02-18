/**
 * Tests for Download Region Flow
 * @format
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useDownloadRegion } from '../ui/download/useDownloadRegion';
import { estimateRegionSize } from '../ui/download/estimator';
import type { RegionRepository } from '../db/regionRepository';
import type { DownloadManager } from '../download/downloadTypes';
import type { OfflineRegion } from '../types';

// Mock dependencies
const createMockRegionRepo = (): RegionRepository => ({
  init: jest.fn().mockResolvedValue(undefined),
  getActiveRegion: jest.fn().mockResolvedValue(null),
  getRegion: jest.fn().mockResolvedValue(null),
  listRegions: jest.fn().mockResolvedValue([]),
  createRegion: jest.fn().mockResolvedValue(undefined),
  updateRegion: jest.fn().mockResolvedValue(undefined),
  updateRegionStatus: jest.fn().mockResolvedValue(undefined),
  deleteRegion: jest.fn().mockResolvedValue(undefined),
});

const createMockDownloadManager = (): DownloadManager => ({
  start: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined),
  cancel: jest.fn().mockResolvedValue(undefined),
  onProgress: jest.fn().mockReturnValue(() => {}),
  getStatus: jest.fn().mockReturnValue(undefined),
});

const mockGetCurrentLocation = jest
  .fn()
  .mockResolvedValue({ lat: 37.7749, lng: -122.4194 });

describe('Download Region Flow', () => {
  let mockRegionRepo: RegionRepository;
  let mockDownloadManager: DownloadManager;

  beforeEach(() => {
    mockRegionRepo = createMockRegionRepo();
    mockDownloadManager = createMockDownloadManager();
    jest.clearAllMocks();
  });

  describe('useDownloadRegion', () => {
    it('should initialize draft with location', async () => {
      const { result } = renderHook(() =>
        useDownloadRegion({
          regionRepo: mockRegionRepo,
          downloadManager: mockDownloadManager,
          getCurrentLocation: mockGetCurrentLocation,
          defaultRadiusMiles: 25,
        }),
      );

      expect(result.current.status).toBe('idle');

      await act(async () => {
        await result.current.initDraft();
      });

      await waitFor(() => {
        expect(result.current.draft).toBeDefined();
        expect(result.current.draft?.centerLat).toBe(37.7749);
        expect(result.current.draft?.centerLng).toBe(-122.4194);
        expect(result.current.draft?.radiusMiles).toBe(25);
      });
    });

    it('should handle location error', async () => {
      const mockLocationError = jest.fn().mockResolvedValue(null);
      const { result } = renderHook(() =>
        useDownloadRegion({
          regionRepo: mockRegionRepo,
          downloadManager: mockDownloadManager,
          getCurrentLocation: mockLocationError,
        }),
      );

      await act(async () => {
        await result.current.initDraft();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe('Location required to download region');
      });
    });

    it('should run estimate after draft is ready', async () => {
      const { result } = renderHook(() =>
        useDownloadRegion({
          regionRepo: mockRegionRepo,
          downloadManager: mockDownloadManager,
          getCurrentLocation: mockGetCurrentLocation,
          defaultRadiusMiles: 25,
        }),
      );

      await act(async () => {
        await result.current.initDraft();
      });

      await act(async () => {
        await result.current.runEstimate();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('readyToDownload');
        expect(result.current.estimate).toBeDefined();
        expect(result.current.estimate?.tileCount).toBeGreaterThan(0);
        expect(result.current.estimate?.estimatedTotalMB).toBeGreaterThan(0);
      });
    });

    it('should start download and update status', async () => {
      const { result } = renderHook(() =>
        useDownloadRegion({
          regionRepo: mockRegionRepo,
          downloadManager: mockDownloadManager,
          getCurrentLocation: mockGetCurrentLocation,
        }),
      );

      await act(async () => {
        await result.current.initDraft();
        await result.current.runEstimate();
      });

      await act(async () => {
        await result.current.startDownload();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('downloading');
        expect(result.current.jobId).toBeDefined();
        expect(mockRegionRepo.createRegion).toHaveBeenCalled();
        expect(mockDownloadManager.start).toHaveBeenCalled();
      });
    });

    it('should handle pause and resume', async () => {
      const { result } = renderHook(() =>
        useDownloadRegion({
          regionRepo: mockRegionRepo,
          downloadManager: mockDownloadManager,
          getCurrentLocation: mockGetCurrentLocation,
        }),
      );

      await act(async () => {
        await result.current.initDraft();
        await result.current.runEstimate();
        await result.current.startDownload();
      });

      await act(async () => {
        await result.current.pause();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('paused');
        expect(mockDownloadManager.pause).toHaveBeenCalled();
      });

      await act(async () => {
        await result.current.resume();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('downloading');
        expect(mockDownloadManager.resume).toHaveBeenCalled();
      });
    });

    it('should handle cancel', async () => {
      const { result } = renderHook(() =>
        useDownloadRegion({
          regionRepo: mockRegionRepo,
          downloadManager: mockDownloadManager,
          getCurrentLocation: mockGetCurrentLocation,
        }),
      );

      await act(async () => {
        await result.current.initDraft();
        await result.current.runEstimate();
        await result.current.startDownload();
      });

      await act(async () => {
        await result.current.cancel();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('idle');
        expect(mockDownloadManager.cancel).toHaveBeenCalled();
      });
    });

    it('should handle delete temp', async () => {
      const mockRegion: OfflineRegion = {
        id: 'test-region',
        centerLat: 37.7749,
        centerLng: -122.4194,
        radiusMiles: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        status: 'downloading',
      };

      (mockRegionRepo.createRegion as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useDownloadRegion({
          regionRepo: mockRegionRepo,
          downloadManager: mockDownloadManager,
          getCurrentLocation: mockGetCurrentLocation,
        }),
      );

      await act(async () => {
        await result.current.initDraft();
        await result.current.runEstimate();
        await result.current.startDownload();
      });

      await act(async () => {
        await result.current.deleteTemp();
      });

      await waitFor(() => {
        expect(mockRegionRepo.deleteRegion).toHaveBeenCalled();
        expect(result.current.status).toBe('idle');
      });
    });
  });

  describe('estimateRegionSize', () => {
    it('should calculate size estimate for a region', () => {
      const center = { lat: 37.7749, lng: -122.4194 };
      const radiusMiles = 25;

      const estimate = estimateRegionSize(center, radiusMiles);

      expect(estimate).toBeDefined();
      expect(estimate.tileCount).toBeGreaterThan(0);
      expect(estimate.estimatedTilesMB).toBeGreaterThan(0);
      expect(estimate.estimatedDemMB).toBe(120); // DEM_ESTIMATE_MB
      expect(estimate.estimatedMetaMB).toBe(20); // META_ESTIMATE_MB
      expect(estimate.estimatedTotalMB).toBeGreaterThan(0);
      expect(estimate.estimatedTotalMB).toBe(
        estimate.estimatedTilesMB + estimate.estimatedDemMB + estimate.estimatedMetaMB,
      );
    });

    it('should handle different radius values', () => {
      const center = { lat: 37.7749, lng: -122.4194 };

      const estimate10 = estimateRegionSize(center, 10);
      const estimate25 = estimateRegionSize(center, 25);
      const estimate50 = estimateRegionSize(center, 50);

      expect(estimate10.tileCount).toBeLessThan(estimate25.tileCount);
      expect(estimate25.tileCount).toBeLessThan(estimate50.tileCount);
      expect(estimate10.estimatedTotalMB).toBeLessThan(
        estimate25.estimatedTotalMB,
      );
      expect(estimate25.estimatedTotalMB).toBeLessThan(
        estimate50.estimatedTotalMB,
      );
    });
  });
});
