import { makeAutoObservable, runInAction } from 'mobx';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { SQLiteDatabase } from '../types/database-types';

export interface PressureSample {
  pressure: number; // hPa
  timestamp: number; // ms since epoch
}

const MAX_HISTORY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_SAMPLES = 1440; // 1 per minute × 60 min × 24 h

const BarometerNative = NativeModules.RNSensorsBarometer;

/**
 * Manages the device barometer sensor, persisting readings to SQLite so that
 * pressure history is available from the moment the user opens the Barometric
 * Pressure screen, regardless of how recently the screen was last visited.
 *
 * Lifecycle:
 *  - start(db)  called from StoreProvider after the database is initialised
 *  - stop()     called from StoreProvider cleanup (app unmount / store reset)
 */
export class BarometerStore {
  currentPressure: number | null = null;
  history: PressureSample[] = [];
  available: boolean = true;
  loading: boolean = true;
  error: string | null = null;

  private db: SQLiteDatabase | null = null;
  private subscription: { remove: () => void } | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async start(db: SQLiteDatabase): Promise<void> {
    this.db = db;

    if (!BarometerNative) {
      runInAction(() => {
        this.available = false;
        this.loading = false;
        this.error = 'Barometer not available on this device.';
      });
      return;
    }

    await this.initTable();
    await this.loadHistory();
    await this.subscribe();
  }

  stop(): void {
    this.subscription?.remove();
    this.subscription = null;
    BarometerNative?.stopUpdates?.();
  }

  private async initTable(): Promise<void> {
    if (!this.db) {
      return;
    }
    try {
      await this.db.executeSql(
        `CREATE TABLE IF NOT EXISTS pressure_history (
           pressure  REAL    NOT NULL,
           timestamp INTEGER NOT NULL
         )`,
      );
      await this.db.executeSql(
        `CREATE INDEX IF NOT EXISTS idx_pressure_ts
           ON pressure_history (timestamp)`,
      );
    } catch (e) {
      console.warn('BarometerStore: failed to create table', e);
    }
  }

  private async loadHistory(): Promise<void> {
    if (!this.db) {
      return;
    }
    try {
      const cutoff = Date.now() - MAX_HISTORY_MS;
      const res = await this.db.executeSql(
        'SELECT pressure, timestamp FROM pressure_history WHERE timestamp >= ? ORDER BY timestamp ASC',
        [cutoff],
      );
      const rows = res[0].rows;
      const loaded: PressureSample[] = [];
      for (let i = 0; i < rows.length; i++) {
        loaded.push(rows.item(i));
      }
      runInAction(() => {
        this.history = loaded;
        if (loaded.length > 0) {
          this.currentPressure = loaded[loaded.length - 1].pressure;
          this.loading = false;
        }
      });
    } catch (e) {
      console.warn('BarometerStore: failed to load history', e);
    }
  }

  private async subscribe(): Promise<void> {
    try {
      await BarometerNative.isAvailable();
    } catch {
      runInAction(() => {
        this.available = false;
        this.loading = false;
        this.error = 'Barometer not available on this device.';
      });
      return;
    }

    const emitter = new NativeEventEmitter(BarometerNative);
    this.subscription = emitter.addListener(
      'RNSensorsBarometer',
      ({ pressure: p, timestamp }: { pressure: number; timestamp: number }) => {
        this.handleReading({ pressure: p, timestamp: timestamp ?? Date.now() });
      },
    );
    BarometerNative.startUpdates();
  }

  private async handleReading(sample: PressureSample): Promise<void> {
    runInAction(() => {
      this.currentPressure = sample.pressure;
      this.loading = false;
      this.available = true;
      const next = [...this.history, sample];
      this.history =
        next.length > MAX_SAMPLES
          ? next.slice(next.length - MAX_SAMPLES)
          : next;
    });

    if (!this.db) {
      return;
    }
    try {
      await this.db.executeSql(
        'INSERT INTO pressure_history (pressure, timestamp) VALUES (?, ?)',
        [sample.pressure, sample.timestamp],
      );
      // Prune rows beyond the 24 h retention window
      await this.db.executeSql(
        'DELETE FROM pressure_history WHERE timestamp < ?',
        [Date.now() - MAX_HISTORY_MS],
      );
    } catch (e) {
      console.warn('BarometerStore: failed to persist reading', e);
    }
  }
}
