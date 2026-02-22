import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable, runInAction } from 'mobx';
import Geolocation from 'react-native-geolocation-service';
import { NEIGHBORING_STATES } from '../data/neighboringStates';
import { distanceMiles } from '../offlineMaps/location/regionDistance';
import { stateFromCoordinates } from '../utils/stateFromCoordinates';

const CACHE_KEY = '@repeaterbook/cache';
const REFETCH_THRESHOLD_MILES = 50;
const DEFAULT_RADIUS_MILES = 50;
const REPEATERBOOK_URL = 'https://www.repeaterbook.com/api/export.php';
const USER_AGENT =
  'TOAST Survival App (toastbyte.studio, support@toastbyte.studio)';

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
  /** All repeaters from all queried states — not distance-filtered. */
  repeaters: Repeater[];
  queryLat: number;
  queryLng: number;
  lastUpdated: string;
  /** Which states were included in this query (for future reference). */
  queriedStates?: string[];
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
  // Explicit check for FM Analog; falls back to 'FM' as the default mode
  // since the vast majority of repeaters are FM and the field may be absent.
  if (row['FM Analog'] === 'Yes' || !row['FM Analog']) return 'FM';
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
 * Fetches all repeaters for a single state from the RepeaterBook API.
 * Returns an empty array on any error (other states' results are unaffected).
 */
async function fetchStateRepeaters(
  state: string,
): Promise<Record<string, string>[]> {
  const url = `${REPEATERBOOK_URL}?state=${encodeURIComponent(state)}&format=json`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const json = await response.json();
  return Array.isArray(json?.results) ? json.results : [];
}

/**
 * Store that fetches and caches local ham radio repeaters from the
 * RepeaterBook API using a state-based query strategy.
 *
 * Behaviour:
 * - On `initialize()`, cached results are loaded immediately.
 * - A live fetch is triggered when there is no cached data, or when the
 *   user's current location is more than 50 miles from the location used
 *   for the previous query.
 * - The user's state is determined from coordinates; all neighbouring states
 *   are queried in parallel to ensure repeaters across state borders are found.
 * - All results are deduplicated and cached without a distance filter so that
 *   the cached data remains useful as the user moves.
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

  /**
   * Repeaters filtered by the selected mode and within DEFAULT_RADIUS_MILES
   * of the last query position, sorted by distance ascending.
   */
  get filteredRepeaters(): Repeater[] {
    let list =
      this.selectedMode === 'All'
        ? this.repeaters
        : this.repeaters.filter((r) => r.mode === this.selectedMode);
    list = list.filter((r) => r.distance <= DEFAULT_RADIUS_MILES);
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
   * Fetch repeaters for the user's current state and all neighbouring states
   * in parallel. Results are merged, deduplicated by repeater ID, and cached
   * without a distance filter so cached data stays useful after the user moves.
   */
  async fetchRepeaters(lat: number, lng: number): Promise<void> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      // 1. Determine the user's state from coordinates.
      const currentState = stateFromCoordinates(lat, lng);
      if (!currentState) {
        throw new Error('Location not in a supported region');
      }

      // 2. Build the list of states to query (current + all neighbours).
      const neighbors = NEIGHBORING_STATES[currentState] ?? [];
      const statesToQuery = [currentState, ...neighbors];

      // 3. Fetch all states in parallel; individual state failures are caught
      //    so one bad response doesn't discard all others.
      const settled = await Promise.allSettled(
        statesToQuery.map((state) => fetchStateRepeaters(state)),
      );

      // Collect rows from fulfilled promises.
      const rawRows: Record<string, string>[] = [];
      const failedStates: string[] = [];
      settled.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          rawRows.push(...result.value);
        } else {
          failedStates.push(statesToQuery[i]);
        }
      });

      // If every single request failed, propagate the first error.
      if (
        rawRows.length === 0 &&
        failedStates.length === statesToQuery.length
      ) {
        const firstSettled = settled[0];
        const firstReason =
          firstSettled.status === 'rejected'
            ? firstSettled.reason instanceof Error
              ? firstSettled.reason.message
              : String(firstSettled.reason)
            : 'Unknown error';
        throw new Error(firstReason);
      }

      // 4. Deduplicate by repeater ID (stateId-rptId).
      const seen = new Set<string>();
      const dedupedRows: Record<string, string>[] = [];
      for (const row of rawRows) {
        const id = `${row['State ID'] ?? ''}-${row['Rptr ID'] ?? ''}`;
        if (!seen.has(id)) {
          seen.add(id);
          dedupedRows.push(row);
        }
      }

      // 5. Map to Repeater objects with distances calculated from current pos.
      //    ALL results are kept (no distance filter) so the cache is reusable
      //    as the user moves within the queried region.
      const repeaters = dedupedRows.map((row) => mapRow(row, lat, lng));
      const lastUpdated = new Date().toISOString();

      const cache: RepeaterCache = {
        repeaters,
        queryLat: lat,
        queryLng: lng,
        lastUpdated,
        queriedStates: statesToQuery,
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
