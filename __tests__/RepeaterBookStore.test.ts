/**
 * @format
 * Tests for RepeaterBookStore
 */

// Silence AsyncStorage/geolocation warnings that appear in tests
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Fix stateFromCoordinates so tests are not sensitive to bounding-box details.
// All tests that hit fetchRepeaters will see: state = 'Florida',
// neighbours = ['Alabama', 'Georgia']  → 3 parallel fetch calls.
jest.mock('../src/utils/stateFromCoordinates', () => ({
  stateFromCoordinates: jest.fn().mockReturnValue('Florida'),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import {
  RepeaterBookStore,
  RepeaterCache,
} from '../src/stores/RepeaterBookStore';
import { stateFromCoordinates } from '../src/utils/stateFromCoordinates';

// Tampa, FL coordinates used throughout
const TEST_LAT = 27.9506;
const TEST_LNG = -82.4572;

// Florida's neighbours from the real data file → 3 total fetch calls
// (Florida + Alabama + Georgia)
const FL_TOTAL_STATES = 3;

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
  Lat: String(TEST_LAT),
  Long: String(TEST_LNG),
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
      lat: TEST_LAT,
      lng: TEST_LNG,
      operationalStatus: 'On-air',
      use: 'OPEN',
      notes: '',
      lastEdited: '2024-01-01',
      distance: 0,
    },
  ],
  queryLat: TEST_LAT,
  queryLng: TEST_LNG,
  lastUpdated: '2024-01-01T00:00:00.000Z',
  queriedStates: ['Florida', 'Alabama', 'Georgia'],
};

/** Helper: mock all three parallel state fetches to return the same rows. */
function mockFetchSuccess(rows: Record<string, string>[] = [makeApiRow()]) {
  const mockResponse = {
    ok: true,
    json: async () => ({ results: rows, count: rows.length }),
  };
  global.fetch = jest.fn().mockResolvedValue(mockResponse as any);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
}

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
    (store as any).repeaters = [
      { ...mockCache.repeaters[0], mode: 'FM' },
      { ...mockCache.repeaters[0], id: 'x', mode: 'DMR' },
    ];
    expect(store.modes).toContain('FM');
    expect(store.modes).toContain('DMR');
  });

  // ── filteredRepeaters ──────────────────────────────────────────────────────

  it('filteredRepeaters returns repeaters within 50 miles when selectedMode is All', () => {
    (store as any).repeaters = mockCache.repeaters; // distance = 0
    expect(store.filteredRepeaters).toHaveLength(1);
  });

  it('filteredRepeaters excludes repeaters beyond 50 miles', () => {
    (store as any).repeaters = [
      { ...mockCache.repeaters[0], id: 'near', distance: 10 },
      { ...mockCache.repeaters[0], id: 'far', distance: 75 },
    ];
    expect(store.filteredRepeaters).toHaveLength(1);
    expect(store.filteredRepeaters[0].id).toBe('near');
  });

  it('filteredRepeaters filters by selectedMode', () => {
    (store as any).repeaters = [
      { ...mockCache.repeaters[0], mode: 'FM', distance: 5 },
      { ...mockCache.repeaters[0], id: 'dmr-1', mode: 'DMR', distance: 5 },
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
    expect(store.queryLat).toBe(TEST_LAT);
    expect(store.queryLng).toBe(TEST_LNG);
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

  it('fetchRepeaters queries current state and all neighbours in parallel', async () => {
    mockFetchSuccess();

    await store.fetchRepeaters(TEST_LAT, TEST_LNG);

    // Florida + Alabama + Georgia = FL_TOTAL_STATES calls
    expect(global.fetch).toHaveBeenCalledTimes(FL_TOTAL_STATES);
  });

  it('fetchRepeaters uses state-based URL (not proximity params)', async () => {
    mockFetchSuccess();

    await store.fetchRepeaters(TEST_LAT, TEST_LNG);

    const calls = (global.fetch as jest.Mock).mock.calls as [string, any][];
    const urls = calls.map(([url]) => url as string);
    expect(urls.some((u) => u.includes('state=Florida'))).toBe(true);
    expect(urls.some((u) => u.includes('state=Alabama'))).toBe(true);
    expect(urls.some((u) => u.includes('state=Georgia'))).toBe(true);
    // Must NOT use the old proximity params
    expect(urls.every((u) => !u.includes('lat='))).toBe(true);
    expect(urls.every((u) => !u.includes('distance='))).toBe(true);
  });

  it('fetchRepeaters sends User-Agent header with app name and email', async () => {
    mockFetchSuccess();

    await store.fetchRepeaters(TEST_LAT, TEST_LNG);

    const calls = (global.fetch as jest.Mock).mock.calls as [string, any][];
    calls.forEach(([, opts]) => {
      expect(opts?.headers?.['User-Agent']).toContain('TOAST');
      expect(opts?.headers?.['User-Agent']).toContain('toastbyte.studio');
    });
  });

  it('fetchRepeaters deduplicates repeaters with same State ID / Rptr ID', async () => {
    // All three state calls return the same repeater row
    mockFetchSuccess([makeApiRow()]);

    await store.fetchRepeaters(TEST_LAT, TEST_LNG);

    // Despite 3 fetch calls each returning 1 row, only 1 unique repeater
    expect(store.repeaters).toHaveLength(1);
  });

  it('fetchRepeaters merges distinct repeaters from multiple states', async () => {
    const row1 = makeApiRow({ 'Rptr ID': '1', 'Call Sign': 'W1TST' });
    const row2 = makeApiRow({ 'Rptr ID': '2', 'Call Sign': 'W2TST' });
    const row3 = makeApiRow({ 'Rptr ID': '3', 'Call Sign': 'W3TST' });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [row1] }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [row2] }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [row3] }),
      } as any);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    await store.fetchRepeaters(TEST_LAT, TEST_LNG);

    expect(store.repeaters).toHaveLength(3);
  });

  it('fetchRepeaters caches all results (not just within 50 miles)', async () => {
    // Row far away (>50mi) — should still be cached
    const farRow = makeApiRow({ Lat: '35.0', Long: '-90.0' }); // ~900 mi away
    mockFetchSuccess([farRow]);

    await store.fetchRepeaters(TEST_LAT, TEST_LNG);

    const savedArg = (AsyncStorage.setItem as jest.Mock).mock
      .calls[0][1] as string;
    const saved: RepeaterCache = JSON.parse(savedArg);
    // All repeaters (including far ones) are in the cache
    expect(saved.repeaters).toHaveLength(1);
    // The cache entry includes queriedStates
    expect(saved.queriedStates).toEqual(
      expect.arrayContaining(['Florida', 'Alabama', 'Georgia']),
    );
  });

  it('fetchRepeaters populates store on success', async () => {
    mockFetchSuccess();

    await store.fetchRepeaters(TEST_LAT, TEST_LNG);

    expect(store.repeaters).toHaveLength(1);
    expect(store.repeaters[0].callSign).toBe('W4TST');
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.isCachedData).toBe(false);
  });

  it('fetchRepeaters sets error when all state queries fail', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as any);

    await store.fetchRepeaters(TEST_LAT, TEST_LNG);

    expect(store.error).toContain('Failed to load repeaters');
    expect(store.isLoading).toBe(false);
  });

  it('fetchRepeaters keeps existing cached data when all queries fail', async () => {
    (store as any).repeaters = mockCache.repeaters;
    (store as any).isCachedData = true;

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as any);

    await store.fetchRepeaters(TEST_LAT, TEST_LNG);

    expect(store.repeaters).toHaveLength(1);
  });

  it('fetchRepeaters sets error when location is outside supported region', async () => {
    (stateFromCoordinates as jest.Mock).mockReturnValueOnce(null);

    await store.fetchRepeaters(48.8566, 2.3522); // Paris, France

    expect(store.error).toContain('not in a supported region');
    expect(store.isLoading).toBe(false);
  });

  it('fetchRepeaters sets error on network failure', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('Network request failed'));

    await store.fetchRepeaters(TEST_LAT, TEST_LNG);

    expect(store.error).toContain('Network request failed');
    expect(store.isLoading).toBe(false);
  });

  it('fetchRepeaters handles empty results from all states', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [], count: 0 }),
    } as any);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    await store.fetchRepeaters(TEST_LAT, TEST_LNG);

    expect(store.repeaters).toHaveLength(0);
    expect(store.error).toBeNull();
  });

  // ── mode detection ─────────────────────────────────────────────────────────

  it('detects DMR mode correctly', async () => {
    mockFetchSuccess([makeApiRow({ DMR: 'Yes', 'FM Analog': 'No' })]);

    await store.fetchRepeaters(TEST_LAT, TEST_LNG);

    expect(store.repeaters[0].mode).toBe('DMR');
  });

  it('detects D-STAR mode correctly', async () => {
    mockFetchSuccess([makeApiRow({ 'D-Star': 'Yes', 'FM Analog': 'No' })]);

    await store.fetchRepeaters(TEST_LAT, TEST_LNG);

    expect(store.repeaters[0].mode).toBe('D-STAR');
  });

  // ── checkAndFetchIfNeeded ──────────────────────────────────────────────────

  it('checkAndFetchIfNeeded fetches when no cache exists', async () => {
    mockFetchSuccess();

    (Geolocation.getCurrentPosition as jest.Mock).mockImplementationOnce(
      (success: any) => {
        success({
          coords: { latitude: TEST_LAT, longitude: TEST_LNG },
          timestamp: Date.now(),
        });
      },
    );

    await store.checkAndFetchIfNeeded();

    expect(global.fetch).toHaveBeenCalledTimes(FL_TOTAL_STATES);
  });

  it('checkAndFetchIfNeeded skips fetch when within threshold', async () => {
    (store as any).repeaters = mockCache.repeaters;
    (store as any).queryLat = TEST_LAT;
    (store as any).queryLng = TEST_LNG;

    global.fetch = jest.fn();

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
    (store as any).repeaters = mockCache.repeaters;
    (store as any).queryLat = TEST_LAT;
    (store as any).queryLng = TEST_LNG;

    mockFetchSuccess();

    (Geolocation.getCurrentPosition as jest.Mock).mockImplementationOnce(
      (success: any) => {
        success({
          coords: { latitude: 30.3322, longitude: -81.6557 }, // Jacksonville, FL
          timestamp: Date.now(),
        });
      },
    );

    await store.checkAndFetchIfNeeded();

    expect(global.fetch).toHaveBeenCalledTimes(FL_TOTAL_STATES);
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
