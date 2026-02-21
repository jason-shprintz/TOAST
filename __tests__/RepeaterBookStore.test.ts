/**
 * @format
 * Tests for RepeaterBookStore
 */

// Silence AsyncStorage warnings that appear in tests
jest.spyOn(console, 'warn').mockImplementation(() => {});

import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import {
  RepeaterBookStore,
  RepeaterCache,
} from '../src/stores/RepeaterBookStore';

// Silence network-related errors in tests
jest.spyOn(console, 'error').mockImplementation(() => {});

const CACHE_KEY = '@repeaterbook/cache';

/** A minimal valid repeater row as returned by the RepeaterBook API */
const makeApiRow = (overrides: Record<string, string> = {}) => ({
  'State ID': '12',
  'Rptr ID': '9999',
  'Call Sign': 'W4TST',
  Frequency: '147.015',
  Offset: '+0.600',
  CTCSS: '100.0',
  PL: '100.0',
  DCS: '',
  'Nearest City': 'Tampa',
  State: 'FL',
  Lat: '27.9506',
  Long: '-82.4572',
  'Operational Status': 'On-air',
  Use: 'OPEN',
  Notes: '',
  'Last Edited': '2024-01-01',
  'FM Analog': 'Yes',
  DMR: 'No',
  'D-Star': 'No',
  'System Fusion': 'No',
  'P-25': 'No',
  NXDN: 'No',
  'APCO P-25': 'No',
  M17: 'No',
  Tetra: 'No',
  ...overrides,
});

const mockCache: RepeaterCache = {
  repeaters: [
    {
      id: '12-9999',
      callSign: 'W4TST',
      frequency: '147.015',
      offset: '+0.600',
      tone: '100.0',
      mode: 'FM',
      city: 'Tampa',
      state: 'FL',
      lat: 27.9506,
      lng: -82.4572,
      operationalStatus: 'On-air',
      use: 'OPEN',
      notes: '',
      lastEdited: '2024-01-01',
      distance: 5.2,
    },
  ],
  queryLat: 27.9506,
  queryLng: -82.4572,
  lastUpdated: '2024-01-01T00:00:00.000Z',
};

describe('RepeaterBookStore', () => {
  let store: RepeaterBookStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new RepeaterBookStore();
  });

  afterEach(() => {
    store.dispose();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it('starts with empty repeaters list', () => {
    expect(store.repeaters).toEqual([]);
  });

  it('starts with isLoading false', () => {
    expect(store.isLoading).toBe(false);
  });

  it('starts with no error', () => {
    expect(store.error).toBeNull();
  });

  it('starts with selectedMode All', () => {
    expect(store.selectedMode).toBe('All');
  });

  // ── setSelectedMode ────────────────────────────────────────────────────────

  it('setSelectedMode updates selectedMode', () => {
    store.setSelectedMode('DMR');
    expect(store.selectedMode).toBe('DMR');
  });

  // ── modes computed ─────────────────────────────────────────────────────────

  it('modes always includes All', () => {
    expect(store.modes).toContain('All');
  });

  it('modes includes unique modes from repeaters', () => {
    // Manually inject repeaters for this test
    (store as any).repeaters = [
      { ...mockCache.repeaters[0], mode: 'FM' },
      { ...mockCache.repeaters[0], id: 'x', mode: 'DMR' },
    ];
    expect(store.modes).toContain('FM');
    expect(store.modes).toContain('DMR');
  });

  // ── filteredRepeaters ──────────────────────────────────────────────────────

  it('filteredRepeaters returns all repeaters when selectedMode is All', () => {
    (store as any).repeaters = mockCache.repeaters;
    expect(store.filteredRepeaters).toHaveLength(1);
  });

  it('filteredRepeaters filters by selectedMode', () => {
    (store as any).repeaters = [
      { ...mockCache.repeaters[0], mode: 'FM' },
      { ...mockCache.repeaters[0], id: 'dmr-1', mode: 'DMR' },
    ];
    store.setSelectedMode('DMR');
    expect(store.filteredRepeaters).toHaveLength(1);
    expect(store.filteredRepeaters[0].mode).toBe('DMR');
  });

  it('filteredRepeaters sorts by distance ascending', () => {
    (store as any).repeaters = [
      { ...mockCache.repeaters[0], id: 'far', distance: 40 },
      { ...mockCache.repeaters[0], id: 'near', distance: 5 },
    ];
    const sorted = store.filteredRepeaters;
    expect(sorted[0].distance).toBeLessThan(sorted[1].distance);
  });

  // ── loadFromCache ──────────────────────────────────────────────────────────

  it('loadFromCache populates store from AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(mockCache),
    );

    await store.loadFromCache();

    expect(store.repeaters).toHaveLength(1);
    expect(store.repeaters[0].callSign).toBe('W4TST');
    expect(store.queryLat).toBe(27.9506);
    expect(store.queryLng).toBe(-82.4572);
    expect(store.lastUpdated).toBe('2024-01-01T00:00:00.000Z');
    expect(store.isCachedData).toBe(true);
  });

  it('loadFromCache handles missing cache gracefully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await store.loadFromCache();
    expect(store.repeaters).toEqual([]);
  });

  it('loadFromCache handles corrupt cache gracefully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('not-json{{{');
    await store.loadFromCache();
    expect(store.repeaters).toEqual([]);
  });

  // ── fetchRepeaters ─────────────────────────────────────────────────────────

  it('fetchRepeaters sends User-Agent header', async () => {
    const apiResponse = { results: [makeApiRow()], count: 1 };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => apiResponse,
    } as any);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    await store.fetchRepeaters(27.9506, -82.4572);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('TOAST'),
        }),
      }),
    );
  });

  it('fetchRepeaters populates repeaters on success', async () => {
    const apiResponse = { results: [makeApiRow()], count: 1 };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => apiResponse,
    } as any);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    await store.fetchRepeaters(27.9506, -82.4572);

    expect(store.repeaters).toHaveLength(1);
    expect(store.repeaters[0].callSign).toBe('W4TST');
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.isCachedData).toBe(false);
  });

  it('fetchRepeaters saves data to AsyncStorage on success', async () => {
    const apiResponse = { results: [makeApiRow()], count: 1 };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => apiResponse,
    } as any);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    await store.fetchRepeaters(27.9506, -82.4572);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      CACHE_KEY,
      expect.stringContaining('W4TST'),
    );
  });

  it('fetchRepeaters sets error and keeps existing data on HTTP error', async () => {
    // Pre-populate with cached data
    (store as any).repeaters = mockCache.repeaters;
    (store as any).isCachedData = true;

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as any);

    await store.fetchRepeaters(27.9506, -82.4572);

    expect(store.error).toContain('Failed to load repeaters');
    expect(store.isLoading).toBe(false);
    // Existing data preserved
    expect(store.repeaters).toHaveLength(1);
  });

  it('fetchRepeaters sets error on network failure', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network request failed'));

    await store.fetchRepeaters(27.9506, -82.4572);

    expect(store.error).toContain('Network request failed');
    expect(store.isLoading).toBe(false);
  });

  it('fetchRepeaters handles empty results array', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], count: 0 }),
    } as any);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    await store.fetchRepeaters(27.9506, -82.4572);

    expect(store.repeaters).toHaveLength(0);
    expect(store.error).toBeNull();
  });

  // ── mode detection ─────────────────────────────────────────────────────────

  it('detects DMR mode correctly', async () => {
    const apiResponse = {
      results: [makeApiRow({ DMR: 'Yes', 'FM Analog': 'No' })],
      count: 1,
    };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => apiResponse,
    } as any);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    await store.fetchRepeaters(27.9506, -82.4572);

    expect(store.repeaters[0].mode).toBe('DMR');
  });

  it('detects D-STAR mode correctly', async () => {
    const apiResponse = {
      results: [makeApiRow({ 'D-Star': 'Yes', 'FM Analog': 'No' })],
      count: 1,
    };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => apiResponse,
    } as any);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    await store.fetchRepeaters(27.9506, -82.4572);

    expect(store.repeaters[0].mode).toBe('D-STAR');
  });

  // ── checkAndFetchIfNeeded ──────────────────────────────────────────────────

  it('checkAndFetchIfNeeded fetches when no cache exists', async () => {
    const apiResponse = { results: [makeApiRow()], count: 1 };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => apiResponse,
    } as any);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    // Mock location same as mock cache location
    (Geolocation.getCurrentPosition as jest.Mock).mockImplementationOnce(
      (success: any) => {
        success({
          coords: { latitude: 27.9506, longitude: -82.4572 },
          timestamp: Date.now(),
        });
      },
    );

    await store.checkAndFetchIfNeeded();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('checkAndFetchIfNeeded skips fetch when location is within threshold', async () => {
    // Populate cache at the same location
    (store as any).repeaters = mockCache.repeaters;
    (store as any).queryLat = 27.9506;
    (store as any).queryLng = -82.4572;

    global.fetch = jest.fn();

    // Return location very close to query location
    (Geolocation.getCurrentPosition as jest.Mock).mockImplementationOnce(
      (success: any) => {
        success({
          coords: { latitude: 27.951, longitude: -82.458 },
          timestamp: Date.now(),
        });
      },
    );

    await store.checkAndFetchIfNeeded();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('checkAndFetchIfNeeded re-fetches when user moved more than 50 miles', async () => {
    // Cache at Tampa, FL
    (store as any).repeaters = mockCache.repeaters;
    (store as any).queryLat = 27.9506;
    (store as any).queryLng = -82.4572;

    const apiResponse = { results: [makeApiRow()], count: 1 };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => apiResponse,
    } as any);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    // Mock location ~200 miles away (near Orlando → Jacksonville-ish)
    (Geolocation.getCurrentPosition as jest.Mock).mockImplementationOnce(
      (success: any) => {
        success({
          coords: { latitude: 30.3322, longitude: -81.6557 }, // Jacksonville, FL
          timestamp: Date.now(),
        });
      },
    );

    await store.checkAndFetchIfNeeded();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('checkAndFetchIfNeeded handles location error gracefully', async () => {
    global.fetch = jest.fn();

    (Geolocation.getCurrentPosition as jest.Mock).mockImplementationOnce(
      (_success: any, error: any) => {
        error({ code: 1, message: 'Permission denied' });
      },
    );

    await store.checkAndFetchIfNeeded();

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
