import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable, runInAction } from 'mobx';
import Geolocation from 'react-native-geolocation-service';
import { distanceMiles } from '../offlineMaps/location/regionDistance';

const CACHE_KEY = '@repeaterbook/cache';
const REFETCH_THRESHOLD_MILES = 50;
const DEFAULT_RADIUS_MILES = 50;
const REPEATERBOOK_URL = 'https://www.repeaterbook.com/api/export.php';

export interface Repeater {
  id: string;
  callSign: string;
  frequency: string;
  offset: string;
  tone: string;
  mode: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  operationalStatus: string;
  use: string;
  notes: string;
  lastEdited: string;
  distance: number;
}

export interface RepeaterCache {
  repeaters: Repeater[];
  queryLat: number;
  queryLng: number;
  lastUpdated: string;
}

/**
 * Derives a human-readable mode string from a RepeaterBook API result row.
 */
function deriveMode(row: Record<string, string>): string {
  if (row.DMR === 'Yes') return 'DMR';
  if (row['D-Star'] === 'Yes') return 'D-STAR';
  if (row['System Fusion'] === 'Yes') return 'Fusion';
  if (row['P-25'] === 'Yes' || row['APCO P-25'] === 'Yes') return 'P-25';
  if (row.NXDN === 'Yes') return 'NXDN';
  if (row.M17 === 'Yes') return 'M17';
  if (row.Tetra === 'Yes') return 'TETRA';
  if (row['FM Analog'] === 'Yes') return 'FM';
  return 'FM';
}

/**
 * Maps a raw RepeaterBook API row to a Repeater object.
 */
function mapRow(
  row: Record<string, string>,
  queryLat: number,
  queryLng: number,
): Repeater {
  const lat = parseFloat(row.Lat ?? '0');
  const lng = parseFloat(row.Long ?? '0');
  const dist = distanceMiles(queryLat, queryLng, lat, lng);
  const tone = row.CTCSS || row.PL || row.DCS || '';
  return {
    id: `${row['State ID'] ?? ''}-${row['Rptr ID'] ?? ''}`,
    callSign: row['Call Sign'] ?? '',
    frequency: row.Frequency ?? '',
    offset: row.Offset ?? '',
    tone,
    mode: deriveMode(row),
    city: row['Nearest City'] ?? '',
    state: row.State ?? '',
    lat,
    lng,
    operationalStatus: row['Operational Status'] ?? '',
    use: row.Use ?? '',
    notes: row.Notes ?? '',
    lastEdited: row['Last Edited'] ?? '',
    distance: Math.round(dist * 10) / 10,
  };
}

/**
 * Store that fetches and caches local ham radio repeaters from the
 * RepeaterBook proximity API.
 *
 * Behaviour:
 * - On `initialize()`, cached results are loaded immediately.
 * - A live fetch is triggered when there is no cached data, or when the
 *   user's current location is more than 50 miles from the location used
 *   for the previous query.
 * - The cache is only replaced when a fetch succeeds.
 */
export class RepeaterBookStore {
  repeaters: Repeater[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  lastUpdated: string | null = null;
  isCachedData: boolean = false;
  queryLat: number | null = null;
  queryLng: number | null = null;
  selectedMode: string = 'All';

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get modes(): string[] {
    const set = new Set<string>(['All']);
    for (const r of this.repeaters) {
      if (r.mode) set.add(r.mode);
    }
    return Array.from(set);
  }

  get filteredRepeaters(): Repeater[] {
    const list =
      this.selectedMode === 'All'
        ? this.repeaters
        : this.repeaters.filter((r) => r.mode === this.selectedMode);
    return [...list].sort((a, b) => a.distance - b.distance);
  }

  setSelectedMode(mode: string) {
    this.selectedMode = mode;
  }

  /**
   * Load cached data then fetch from API if needed.
   * Safe to call on every screen mount.
   */
  async initialize(): Promise<void> {
    await this.loadFromCache();
    await this.checkAndFetchIfNeeded();
  }

  /**
   * Load previously cached repeater data from AsyncStorage.
   */
  async loadFromCache(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const cache: RepeaterCache = JSON.parse(raw);
      runInAction(() => {
        this.repeaters = cache.repeaters;
        this.queryLat = cache.queryLat;
        this.queryLng = cache.queryLng;
        this.lastUpdated = cache.lastUpdated;
        this.isCachedData = true;
      });
    } catch {
      // Cache read failure is non-fatal; the app will attempt a live fetch.
    }
  }

  /**
   * Compare current location against the cached query location and trigger a
   * fetch when the user has moved more than REFETCH_THRESHOLD_MILES, or when
   * there is no cached data at all.
   */
  async checkAndFetchIfNeeded(): Promise<void> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const needsFetch =
            this.queryLat === null ||
            this.queryLng === null ||
            this.repeaters.length === 0 ||
            distanceMiles(latitude, longitude, this.queryLat, this.queryLng) >
              REFETCH_THRESHOLD_MILES;

          if (needsFetch) {
            await this.fetchRepeaters(latitude, longitude);
          }
          resolve();
        },
        () => {
          // Location unavailable – keep cached data if present.
          resolve();
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
      );
    });
  }

  /**
   * Fetch repeaters from the RepeaterBook API and update the cache on success.
   */
  async fetchRepeaters(lat: number, lng: number): Promise<void> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const url =
        `${REPEATERBOOK_URL}?lat=${lat}&lng=${lng}` +
        `&distance=${DEFAULT_RADIUS_MILES}&Dunit=m&freq=0&band=%25&mode=%25`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      const rows: Record<string, string>[] = Array.isArray(json?.results)
        ? json.results
        : [];

      const repeaters = rows.map((row) => mapRow(row, lat, lng));
      const lastUpdated = new Date().toISOString();

      const cache: RepeaterCache = {
        repeaters,
        queryLat: lat,
        queryLng: lng,
        lastUpdated,
      };

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));

      runInAction(() => {
        this.repeaters = repeaters;
        this.queryLat = lat;
        this.queryLng = lng;
        this.lastUpdated = lastUpdated;
        this.isCachedData = false;
        this.isLoading = false;
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      runInAction(() => {
        this.error = `Failed to load repeaters: ${message}`;
        this.isLoading = false;
        // Keep isCachedData true when a fetch fails and we still have cached
        // data from loadFromCache.
      });
    }
  }

  dispose(): void {
    // No-op – nothing to clean up.
  }
}
