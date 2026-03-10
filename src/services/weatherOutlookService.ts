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
  /** Ensemble-mean average temperature in °C */
  tempMeanC: number;
  /** Ensemble-mean total precipitation in mm */
  precipMm: number;
  /** Ensemble-mean total snowfall in cm */
  snowfallCm: number;
  /** Ensemble-mean average wind speed in km/h */
  windSpeedMeanKmh: number;
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
  'temperature_2m_mean',
  'precipitation_mean',
  'snowfall_mean',
  'wind_speed_10m_mean',
  'shortwave_radiation_mean',
];
/** Cache is valid for 30 days in milliseconds. */
export const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const TABLE_NAME = 'seasonal_outlook_cache_v2';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Rounds a coordinate to 1 decimal place for cache bucketing. */
export function roundCoord(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Returns an "YYYY-MM" string for the given Date (defaults to now). */
export function toYearMonth(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
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

// ---------------------------------------------------------------------------
// API parsing
// ---------------------------------------------------------------------------

/** Reads a value at index t from a monthly variable array; returns 0 if absent or NaN. */
function monthlyValue(
  monthly: Record<string, unknown>,
  key: string,
  t: number,
): number {
  const arr = monthly[key] as number[] | undefined;
  if (!arr || arr[t] == null || isNaN(arr[t])) return 0;
  return arr[t];
}

/**
 * Given the raw Open-Meteo `monthly` object, build monthly outlook entries.
 * The API returns ensemble-mean values directly as simple arrays.
 */
export function parseMonthlyResponse(
  monthly: Record<string, unknown>,
): MonthlyOutlookEntry[] {
  const times = (monthly.time as string[]) ?? [];
  const entries: MonthlyOutlookEntry[] = [];

  for (let t = 0; t < times.length; t++) {
    entries.push({
      month: times[t].slice(0, 7), // "YYYY-MM"
      tempMeanC: monthlyValue(monthly, 'temperature_2m_mean', t),
      precipMm: monthlyValue(monthly, 'precipitation_mean', t),
      snowfallCm: monthlyValue(monthly, 'snowfall_mean', t),
      windSpeedMeanKmh: monthlyValue(monthly, 'wind_speed_10m_mean', t),
      shortwaveRadiationSum: monthlyValue(
        monthly,
        'shortwave_radiation_mean',
        t,
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
