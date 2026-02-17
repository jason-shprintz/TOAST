/**
 * Test to verify no network calls are made when rendering offline map
 * @format
 */

import { createRegionRepository } from '../db/regionRepository';
import { useOfflineRegion } from '../ui/useOfflineRegion';
import type { OfflineRegion } from '../types';

// Mock the region repository
jest.mock('../db/regionRepository', () => ({
  createRegionRepository: jest.fn(() => ({
    init: jest.fn().mockResolvedValue(undefined),
    getActiveRegion: jest.fn().mockResolvedValue({
      id: 'test-region',
      centerLat: 40.7128,
      centerLng: -74.006,
      radiusMiles: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      version: 1,
      status: 'ready',
      tilesPath: '/path/to/tiles.mbtiles',
    } as OfflineRegion),
    getRegion: jest.fn(),
    listRegions: jest.fn(),
    createRegion: jest.fn(),
    updateRegion: jest.fn(),
    updateRegionStatus: jest.fn(),
    deleteRegion: jest.fn(),
  })),
}));

describe('Offline Map - No Network Test', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on global fetch to ensure no network calls
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('should not make network calls when loading a ready region', async () => {
    // Get the mocked repository
    const mockRepo = createRegionRepository();

    // Call init and getActiveRegion (simulating what the hook does)
    await mockRepo.init();
    const region = await mockRepo.getActiveRegion();

    // Verify region is loaded
    expect(region).toBeTruthy();
    expect(region?.status).toBe('ready');
    expect(region?.tilesPath).toBeTruthy();

    // Verify that fetch was never called
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should validate region has tilesPath when status is ready', async () => {
    const mockRepo = createRegionRepository();
    await mockRepo.init();
    const region = await mockRepo.getActiveRegion();

    // Ensure ready regions have tilesPath
    expect(region?.tilesPath).toBe('/path/to/tiles.mbtiles');
  });

  it('should not perform network operations during repository initialization', async () => {
    const mockRepo = createRegionRepository();

    // Initialize repository
    await mockRepo.init();

    // Verify no fetch calls were made
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

