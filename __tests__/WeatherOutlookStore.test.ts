/**
 * @format
 */

import {
  CACHE_MAX_AGE_MS,
  fetchSeasonalData,
  getCachedOutlook,
  initCacheTable,
  parseMonthlyResponse,
  roundCoord,
  saveOutlookToCache,
  SeasonalOutlook,
  shouldRefresh,
  toYearMonth,
} from '../src/services/weatherOutlookService';
import { WeatherOutlookStore } from '../src/stores/WeatherOutlookStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDb = (rows: { data: string }[] = [], executeSqlImpl?: jest.Mock) => ({
  executeSql:
    executeSqlImpl ??
    jest.fn().mockResolvedValue([
      {
        rows: {
          length: rows.length,
          item: (i: number) => rows[i],
        },
      },
    ]),
});

const sampleOutlook: SeasonalOutlook = {
  lat: 36.2,
  lon: -115.1,
  fetchedAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago → fresh
  fetchMonth: toYearMonth(),
  months: [
    {
      month: '2024-03',
      tempMeanC: 13,
      precipMm: 30,
      snowfallCm: 0,
      windSpeedMeanKmh: 25,
      shortwaveRadiationSum: 400,
    },
    {
      month: '2024-04',
      tempMeanC: 18,
      precipMm: 55,
      snowfallCm: 0,
      windSpeedMeanKmh: 35,
      shortwaveRadiationSum: 520,
    },
  ],
};

// ---------------------------------------------------------------------------
// weatherOutlookService unit tests
// ---------------------------------------------------------------------------

describe('roundCoord', () => {
  test('rounds to 1 decimal place', () => {
    expect(roundCoord(36.17)).toBe(36.2);
    expect(roundCoord(-115.14)).toBe(-115.1);
    expect(roundCoord(0)).toBe(0);
    expect(roundCoord(1.05)).toBe(1.1);
  });
});

describe('toYearMonth', () => {
  test('returns YYYY-MM format', () => {
    const result = toYearMonth(new Date('2024-03-15'));
    expect(result).toBe('2024-03');
  });

  test('pads single-digit months with zero', () => {
    const result = toYearMonth(new Date('2024-01-01'));
    expect(result).toBe('2024-01');
  });
});

describe('shouldRefresh', () => {
  test('returns false for a freshly fetched cache entry', () => {
    const recent = new Date(Date.now() - 1000).toISOString();
    expect(shouldRefresh(recent)).toBe(false);
  });

  test('returns true when cache is older than 30 days', () => {
    const old = new Date(Date.now() - CACHE_MAX_AGE_MS - 1000).toISOString();
    expect(shouldRefresh(old)).toBe(true);
  });

  test('returns false exactly at the 30-day threshold', () => {
    const onThreshold = new Date(
      Date.now() - CACHE_MAX_AGE_MS + 5000,
    ).toISOString();
    expect(shouldRefresh(onThreshold)).toBe(false);
  });
});

describe('parseMonthlyResponse', () => {
  test('reads ensemble-mean values directly for one month', () => {
    const monthly: Record<string, unknown> = {
      time: ['2024-03-01'],
      temperature_2m_mean: [20],
      precipitation_mean: [10],
      snowfall_mean: [0],
      wind_speed_10m_mean: [60],
      shortwave_radiation_mean: [200],
    };

    const entries = parseMonthlyResponse(monthly);
    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry.month).toBe('2024-03');
    expect(entry.tempMeanC).toBe(20);
    expect(entry.precipMm).toBe(10);
    expect(entry.windSpeedMeanKmh).toBe(60);
    expect(entry.shortwaveRadiationSum).toBe(200);
  });

  test('handles empty time array', () => {
    expect(parseMonthlyResponse({ time: [] })).toEqual([]);
  });

  test('handles missing variable keys gracefully (returns 0)', () => {
    const monthly: Record<string, unknown> = {
      time: ['2024-03-01'],
    };
    const entries = parseMonthlyResponse(monthly);
    expect(entries).toHaveLength(1);
    expect(entries[0].tempMeanC).toBe(0);
  });

  test('slices YYYY-MM from the time string', () => {
    const monthly: Record<string, unknown> = {
      time: ['2024-06-01'],
    };
    const entries = parseMonthlyResponse(monthly);
    expect(entries[0].month).toBe('2024-06');
  });
});

describe('fetchSeasonalData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws on non-ok HTTP response', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(fetchSeasonalData(36.17, -115.14)).rejects.toThrow(/503/);
  });

  test('throws when response contains no monthly data', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await expect(fetchSeasonalData(36.17, -115.14)).rejects.toThrow(
      /no monthly data/i,
    );
  });

  test('returns SeasonalOutlook with rounded coords on success', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        monthly: {
          time: ['2024-03-01'],
          temperature_2m_mean: [20],
          precipitation_mean: [50],
          snowfall_mean: [0],
          wind_speed_10m_mean: [40],
          shortwave_radiation_mean: [300],
        },
      }),
    });

    const result = await fetchSeasonalData(36.17, -115.14);
    expect(result.lat).toBe(36.2);
    expect(result.lon).toBe(-115.1);
    expect(result.months).toHaveLength(1);
  });
});

describe('SQLite cache helpers', () => {
  test('initCacheTable calls executeSql with CREATE TABLE', async () => {
    const db = makeDb();
    await initCacheTable(db as any);
    expect(db.executeSql).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS'),
    );
  });

  test('getCachedOutlook returns null when no row found', async () => {
    const db = makeDb([]); // empty rows
    const result = await getCachedOutlook(db as any, 36.2, -115.1);
    expect(result).toBeNull();
  });

  test('getCachedOutlook parses and returns cached JSON', async () => {
    const db = makeDb([{ data: JSON.stringify(sampleOutlook) }]);
    const result = await getCachedOutlook(db as any, 36.2, -115.1);
    expect(result).not.toBeNull();
    expect(result?.months).toHaveLength(2);
    expect(result?.lat).toBe(36.2);
  });

  test('getCachedOutlook returns null on executeSql error', async () => {
    const failDb = makeDb(
      [],
      jest.fn().mockRejectedValueOnce(new Error('DB error')),
    );
    const result = await getCachedOutlook(failDb as any, 36.2, -115.1);
    expect(result).toBeNull();
  });

  test('saveOutlookToCache calls executeSql with INSERT OR REPLACE', async () => {
    const db = makeDb();
    await saveOutlookToCache(db as any, sampleOutlook);
    expect(db.executeSql).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE'),
      expect.arrayContaining([
        expect.any(String),
        expect.any(String),
        expect.any(String),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// WeatherOutlookStore tests
// ---------------------------------------------------------------------------

describe('WeatherOutlookStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initial state is empty / not loading', () => {
    const store = new WeatherOutlookStore();
    expect(store.outlook).toBeNull();
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.isStale).toBe(false);
  });

  test('initDatabase creates cache table', async () => {
    const store = new WeatherOutlookStore();
    const db = makeDb();
    await store.initDatabase(db as any);
    expect(db.executeSql).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS'),
    );
  });

  test('loadOutlook uses fresh cached data without network call', async () => {
    const store = new WeatherOutlookStore();
    const db = makeDb([{ data: JSON.stringify(sampleOutlook) }]);
    await store.initDatabase(db as any);

    global.fetch = jest.fn();
    await store.loadOutlook(36.2, -115.1);

    expect(fetch).not.toHaveBeenCalled();
    expect(store.outlook).not.toBeNull();
    expect(store.isLoading).toBe(false);
    expect(store.isStale).toBe(false);
  });

  test('loadOutlook fetches from network when cache is stale', async () => {
    const staleOutlook: SeasonalOutlook = {
      ...sampleOutlook,
      fetchedAt: new Date(Date.now() - CACHE_MAX_AGE_MS - 1000).toISOString(),
    };

    const db = makeDb([{ data: JSON.stringify(staleOutlook) }]);
    const store = new WeatherOutlookStore();
    await store.initDatabase(db as any);

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        monthly: {
          time: ['2024-03-01'],
          temperature_2m_mean: [22],
          precipitation_mean: [40],
          snowfall_mean: [0],
          wind_speed_10m_mean: [30],
          shortwave_radiation_mean: [300],
        },
      }),
    });

    await store.loadOutlook(36.2, -115.1);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(store.outlook).not.toBeNull();
    expect(store.isStale).toBe(false);
    expect(store.isLoading).toBe(false);
  });

  test('loadOutlook degrades gracefully (shows stale cache) when offline', async () => {
    const staleOutlook: SeasonalOutlook = {
      ...sampleOutlook,
      fetchedAt: new Date(Date.now() - CACHE_MAX_AGE_MS - 1000).toISOString(),
    };

    const db = makeDb([{ data: JSON.stringify(staleOutlook) }]);
    const store = new WeatherOutlookStore();
    await store.initDatabase(db as any);

    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network request failed'));

    await store.loadOutlook(36.2, -115.1);

    expect(store.outlook).not.toBeNull(); // stale cached data shown
    expect(store.isStale).toBe(true);
    expect(store.error).toBeNull();
    expect(store.isLoading).toBe(false);
  });

  test('loadOutlook sets error when offline with no cached data', async () => {
    const db = makeDb([]); // no rows
    const store = new WeatherOutlookStore();
    await store.initDatabase(db as any);

    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network request failed'));

    await store.loadOutlook(36.2, -115.1);

    expect(store.outlook).toBeNull();
    expect(store.error).toBeTruthy();
    expect(store.isStale).toBe(false);
    expect(store.isLoading).toBe(false);
  });

  describe('getCurrentMonthSummary', () => {
    test('returns null when no outlook is loaded', () => {
      const store = new WeatherOutlookStore();
      expect(store.getCurrentMonthSummary()).toBeNull();
    });

    test('returns null when outlook has no months', () => {
      const store = new WeatherOutlookStore();
      store.outlook = { ...sampleOutlook, months: [] };
      expect(store.getCurrentMonthSummary()).toBeNull();
    });

    test('returns a non-empty summary string when data is loaded', () => {
      const store = new WeatherOutlookStore();
      store.outlook = sampleOutlook;
      const summary = store.getCurrentMonthSummary();
      expect(typeof summary).toBe('string');
      expect(summary!.length).toBeGreaterThan(0);
    });

    test('describes warm conditions for high average temperature', () => {
      const store = new WeatherOutlookStore();
      store.outlook = {
        ...sampleOutlook,
        months: [
          {
            ...sampleOutlook.months[0],
            tempMeanC: 30,
            precipMm: 20,
          },
        ],
      };
      expect(store.getCurrentMonthSummary()).toMatch(/warm/i);
    });

    test('describes cold conditions for low average temperature', () => {
      const store = new WeatherOutlookStore();
      store.outlook = {
        ...sampleOutlook,
        months: [
          {
            ...sampleOutlook.months[0],
            tempMeanC: -2,
            precipMm: 20,
          },
        ],
      };
      expect(store.getCurrentMonthSummary()).toMatch(/cold/i);
    });

    test('describes wet conditions for high precipitation', () => {
      const store = new WeatherOutlookStore();
      store.outlook = {
        ...sampleOutlook,
        months: [
          {
            ...sampleOutlook.months[0],
            tempMeanC: 10,
            precipMm: 200,
          },
        ],
      };
      expect(store.getCurrentMonthSummary()).toMatch(/wet/i);
    });

    test('describes dry conditions for low precipitation', () => {
      const store = new WeatherOutlookStore();
      store.outlook = {
        ...sampleOutlook,
        months: [
          {
            ...sampleOutlook.months[0],
            tempMaxC: 15,
            tempMinC: 5,
            precipMm: 10,
          },
        ],
      };
      expect(store.getCurrentMonthSummary()).toMatch(/dry/i);
    });
  });

  test('dispose resets all state', () => {
    const store = new WeatherOutlookStore();
    store.outlook = sampleOutlook;
    store.isStale = true;

    store.dispose();

    expect(store.outlook).toBeNull();
    expect(store.isStale).toBe(false);
    expect(store.error).toBeNull();
    expect(store.isLoading).toBe(false);
  });
});
