/**
 * Weather Outlook Service
 *
 * Fetches and caches monthly SEAS5 (seasonal forecast) data from the
 * Open-Meteo Seasonal Forecast API.  No API key required.
 *
 * Cache strategy:
 *  - Keyed by (lat rounded to 1 dp, lon rounded to 1 dp, fetch_month)
 *  - Cached rows are valid for 30 days (aligns with the SEAS5 monthly update cycle)
 *  - Offline / failure: returns cached data and sets an `isStale` flag
 */

import { SQLiteDatabase } from '../types/database-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One month of processed ensemble-mean forecast values. */
export interface MonthlyOutlookEntry {
  /** ISO date string for the first day of this forecast month, e.g. "2024-03" */
  month: string;
  /** Ensemble-mean daily maximum temperature in °C */
  tempMaxC: number;
  /** Ensemble-mean daily minimum temperature in °C */
  tempMinC: number;
  /** Ensemble-mean total precipitation in mm */
  precipMm: number;
  /** Ensemble-mean total snowfall in cm */
  snowfallCm: number;
  /** Ensemble-mean maximum wind speed in km/h */
  windSpeedMaxKmh: number;
  /** Ensemble-mean total shortwave radiation in MJ/m² */
  shortwaveRadiationSum: number;
}

/** The full seasonal outlook for a location. */
export interface SeasonalOutlook {
  /** Rounded latitude used as cache key (1 decimal place) */
  lat: number;
  /** Rounded longitude used as cache key (1 decimal place) */
  lon: number;
  /** ISO date-time string of when this data was fetched */
  fetchedAt: string;
  /** ISO "YYYY-MM" of the month when the data was fetched */
  fetchMonth: string;
  /** Monthly forecast entries, up to 7 months */
  months: MonthlyOutlookEntry[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEASONAL_API_BASE = 'https://seasonal-api.open-meteo.com/v1/seasonal';
const MONTHLY_VARIABLES = [
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'snowfall_sum',
  'wind_speed_10m_max',
  'shortwave_radiation_sum',
];
const ENSEMBLE_MEMBER_COUNT = 51;
/** Cache is valid for 30 days in milliseconds. */
export const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const TABLE_NAME = 'seasonal_outlook_cache';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Rounds a coordinate to 1 decimal place for cache bucketing. */
export function roundCoord(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Returns an "YYYY-MM" string for the given Date (defaults to now). */
export function toYearMonth(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Returns true when the cached outlook should be refreshed.
 * @param cachedAt - ISO date-time string of the last fetch
 */
export function shouldRefresh(cachedAt: string): boolean {
  const fetchedMs = new Date(cachedAt).getTime();
  return Date.now() - fetchedMs > CACHE_MAX_AGE_MS;
}

/**
 * Computes the arithmetic mean of an array of numbers.
 * Returns 0 for empty arrays.
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ---------------------------------------------------------------------------
// API parsing
// ---------------------------------------------------------------------------

/**
 * Given the raw Open-Meteo `monthly` object, compute ensemble-mean monthly
 * entries for each of the returned months.
 */
export function parseMonthlyResponse(
  monthly: Record<string, unknown>,
): MonthlyOutlookEntry[] {
  const times = (monthly.time as string[]) ?? [];
  const entries: MonthlyOutlookEntry[] = [];

  for (let t = 0; t < times.length; t++) {
    const memberValues = (
      variable: string,
      memberCount: number,
    ): number[] => {
      const vals: number[] = [];
      for (let m = 1; m <= memberCount; m++) {
        const key = `${variable}_member${String(m).padStart(2, '0')}`;
        const arr = monthly[key] as number[] | undefined;
        if (arr && arr[t] != null && !isNaN(arr[t])) {
          vals.push(arr[t]);
        }
      }
      return vals;
    };

    entries.push({
      month: times[t].slice(0, 7), // "YYYY-MM"
      tempMaxC: mean(memberValues('temperature_2m_max', ENSEMBLE_MEMBER_COUNT)),
      tempMinC: mean(memberValues('temperature_2m_min', ENSEMBLE_MEMBER_COUNT)),
      precipMm: mean(
        memberValues('precipitation_sum', ENSEMBLE_MEMBER_COUNT),
      ),
      snowfallCm: mean(
        memberValues('snowfall_sum', ENSEMBLE_MEMBER_COUNT),
      ),
      windSpeedMaxKmh: mean(
        memberValues('wind_speed_10m_max', ENSEMBLE_MEMBER_COUNT),
      ),
      shortwaveRadiationSum: mean(
        memberValues('shortwave_radiation_sum', ENSEMBLE_MEMBER_COUNT),
      ),
    });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Network fetch
// ---------------------------------------------------------------------------

/**
 * Fetches SEAS5 seasonal forecast data for the given coordinates.
 * Throws on network or HTTP error.
 */
export async function fetchSeasonalData(
  lat: number,
  lon: number,
): Promise<SeasonalOutlook> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    monthly: MONTHLY_VARIABLES.join(','),
    models: 'seas5',
  });

  const url = `${SEASONAL_API_BASE}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Open-Meteo seasonal API error: ${response.status} ${response.statusText}`,
    );
  }

  const json = (await response.json()) as { monthly?: Record<string, unknown> };

  if (!json.monthly) {
    throw new Error('Open-Meteo seasonal API returned no monthly data');
  }

  const now = new Date();
  return {
    lat: roundCoord(lat),
    lon: roundCoord(lon),
    fetchedAt: now.toISOString(),
    fetchMonth: toYearMonth(now),
    months: parseMonthlyResponse(json.monthly),
  };
}

// ---------------------------------------------------------------------------
// SQLite cache
// ---------------------------------------------------------------------------

/** Initialises the cache table if it does not already exist. */
export async function initCacheTable(db: SQLiteDatabase): Promise<void> {
  await db.executeSql(
    `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
       cache_key   TEXT PRIMARY KEY NOT NULL,
       fetched_at  TEXT NOT NULL,
       data        TEXT NOT NULL
     )`,
  );
}

/** Cache key string for a rounded lat/lon + fetch month. */
function cacheKey(lat: number, lon: number, month: string): string {
  return `${roundCoord(lat)}_${roundCoord(lon)}_${month}`;
}

/**
 * Reads the cached SeasonalOutlook from SQLite.
 * Returns null if no cached entry exists.
 */
export async function getCachedOutlook(
  db: SQLiteDatabase,
  lat: number,
  lon: number,
): Promise<SeasonalOutlook | null> {
  try {
    const key = cacheKey(lat, lon, toYearMonth());
    const [result] = await db.executeSql(
      `SELECT data FROM ${TABLE_NAME} WHERE cache_key = ?`,
      [key],
    );
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows.item(0) as { data: string };
    return JSON.parse(row.data) as SeasonalOutlook;
  } catch {
    return null;
  }
}

/**
 * Persists a SeasonalOutlook to the SQLite cache.
 */
export async function saveOutlookToCache(
  db: SQLiteDatabase,
  outlook: SeasonalOutlook,
): Promise<void> {
  const key = cacheKey(outlook.lat, outlook.lon, outlook.fetchMonth);
  await db.executeSql(
    `INSERT OR REPLACE INTO ${TABLE_NAME} (cache_key, fetched_at, data)
     VALUES (?, ?, ?)`,
    [key, outlook.fetchedAt, JSON.stringify(outlook)],
  );
}
