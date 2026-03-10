import { makeAutoObservable, runInAction } from 'mobx';
import {
  fetchSeasonalData,
  getCachedOutlook,
  initCacheTable,
  saveOutlookToCache,
  SeasonalOutlook,
  shouldRefresh,
} from '../services/weatherOutlookService';
import { SQLiteDatabase } from '../types/database-types';

/**
 * MobX store for the seasonal weather outlook feature.
 *
 * Manages fetching, caching, and exposing SEAS5 ensemble forecast data from
 * the Open-Meteo Seasonal Forecast API.  Data is cached in the shared SQLite
 * database and keyed by (lat_1dp, lon_1dp, fetch_month) so nearby locations
 * within the same calendar month share a single cache row.
 *
 * Lifecycle:
 *  - Call `initDatabase(db)` once (from RootStore) to set up the cache table.
 *  - Call `loadOutlook(lat, lon)` whenever the user's location is known.
 */
export class WeatherOutlookStore {
  /** The currently loaded seasonal outlook, or null if not yet fetched. */
  outlook: SeasonalOutlook | null = null;
  /** True while an API request is in flight. */
  isLoading: boolean = false;
  /** Error message from the last failed fetch, or null. */
  error: string | null = null;
  /**
   * True when the displayed data came from cache but a refresh attempt was
   * made and failed (i.e. we are offline).  Shows a "last updated" notice.
   */
  isStale: boolean = false;

  private db: SQLiteDatabase | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  /**
   * Initialize the SQLite cache table.
   * Should be called once on app start after the database is ready.
   *
   * @param db - The shared SQLite database connection
   */
  async initDatabase(db: SQLiteDatabase): Promise<void> {
    this.db = db;
    try {
      await initCacheTable(db);
    } catch (e) {
      console.warn('WeatherOutlookStore: failed to init cache table', e);
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Loads the seasonal outlook for the given coordinates.
   *
   * Strategy:
   * 1. If a cached entry exists and is < 30 days old → use it, skip network.
   * 2. If no cache or cache is stale → fetch from API and update cache.
   * 3. On network failure with stale / no cache → surface cached data with
   *    `isStale = true`; surface an error when there is nothing to show.
   *
   * @param lat - Device latitude
   * @param lon - Device longitude
   */
  async loadOutlook(lat: number, lon: number): Promise<void> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    // 1. Try cache
    const cached = this.db ? await getCachedOutlook(this.db, lat, lon) : null;

    if (cached && !shouldRefresh(cached.fetchedAt)) {
      runInAction(() => {
        this.outlook = cached;
        this.isStale = false;
        this.isLoading = false;
      });
      return;
    }

    // 2. Attempt network fetch
    try {
      const fresh = await fetchSeasonalData(lat, lon);
      if (this.db) {
        await saveOutlookToCache(this.db, fresh);
      }
      runInAction(() => {
        this.outlook = fresh;
        this.isStale = false;
        this.isLoading = false;
      });
    } catch (err) {
      // 3. Degrade gracefully
      const msg =
        err instanceof Error ? err.message : 'Failed to load weather outlook';
      runInAction(() => {
        if (cached) {
          this.outlook = cached;
          this.isStale = true;
          this.error = null;
        } else {
          this.outlook = null;
          this.isStale = false;
          this.error = msg;
        }
        this.isLoading = false;
      });
    }
  }

  /**
   * Returns a brief, human-readable summary of the current month's outlook,
   * suitable for the footer notification rotation.
   * Returns null when no data is available.
   */
  getCurrentMonthSummary(): string | null {
    if (!this.outlook || this.outlook.months.length === 0) {
      return null;
    }
    const first = this.outlook.months[0];
    const precip = first.precipMm;
    const precipDesc = precip > 100 ? 'wet' : precip > 40 ? 'average' : 'dry';
    const tempAvgC = (first.tempMaxC + first.tempMinC) / 2;
    const tempDesc = tempAvgC > 20 ? 'warm' : tempAvgC > 10 ? 'mild' : 'cold';
    return `This month: ${tempDesc} & ${precipDesc}`;
  }

  // ---------------------------------------------------------------------------
  // Dispose
  // ---------------------------------------------------------------------------

  /** Resets store state. */
  dispose(): void {
    this.outlook = null;
    this.isLoading = false;
    this.error = null;
    this.isStale = false;
    this.db = null;
  }
}
