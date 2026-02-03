import { makeAutoObservable, runInAction } from 'mobx';
import * as SunCalc from 'suncalc';
import { SQLiteDatabase } from '../types/database-types';

export type SolarEventType = 'sunrise' | 'sunset';

export interface SolarNotificationSettings {
  enabled: boolean;
  sunriseEnabled: boolean;
  sunsetEnabled: boolean;
  bufferMinutes: number; // Minutes before event to notify
}

export interface SolarNotification {
  id: string;
  eventType: SolarEventType;
  eventTime: Date;
  notificationTime: Date;
  message: string;
  dismissed: boolean;
}

/**
 * Store for managing solar cycle notifications (sunrise/sunset alerts).
 * Calculates daily sun times based on device location and manages notification state.
 */
export class SolarCycleNotificationStore {
  // Settings
  enabled: boolean = false;
  sunriseEnabled: boolean = true;
  sunsetEnabled: boolean = true;
  bufferMinutes: number = 15; // Notify 15 minutes before event

  // Current notifications
  activeNotifications: SolarNotification[] = [];

  // Last calculation
  lastCalculationDate: Date | null = null;
  lastCalculationLocation: { latitude: number; longitude: number } | null =
    null;

  private db: SQLiteDatabase | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  /**
   * Initialize the database table for solar cycle notification settings.
   * @param database - The SQLite database instance
   */
  async initDatabase(database: SQLiteDatabase) {
    this.db = database;

    return new Promise<void>((resolve, reject) => {
      this.db!.transaction((tx: any) => {
        // Create settings table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS solar_notification_settings (
            id INTEGER PRIMARY KEY,
            enabled INTEGER NOT NULL DEFAULT 0,
            sunrise_enabled INTEGER NOT NULL DEFAULT 1,
            sunset_enabled INTEGER NOT NULL DEFAULT 1,
            buffer_minutes INTEGER NOT NULL DEFAULT 15
          );`,
          [],
          () => {
            // Insert default settings if table is empty
            tx.executeSql(
              `INSERT OR IGNORE INTO solar_notification_settings (id, enabled, sunrise_enabled, sunset_enabled, buffer_minutes)
               VALUES (1, 0, 1, 1, 15);`,
              [],
              () => {
                resolve();
              },
              (_: any, error: any) => {
                console.error(
                  'Error inserting default solar notification settings:',
                  error,
                );
                reject(error);
                return false;
              },
            );
          },
          (_: any, error: any) => {
            console.error(
              'Error creating solar notification settings table:',
              error,
            );
            reject(error);
            return false;
          },
        );
      });
    });
  }

  /**
   * Load settings from the database.
   */
  async loadSettings() {
    if (!this.db) {
      console.warn('Database not initialized for solar notification settings');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      this.db!.transaction((tx: any) => {
        tx.executeSql(
          'SELECT * FROM solar_notification_settings WHERE id = 1;',
          [],
          (_: any, results: any) => {
            if (results.rows.length > 0) {
              const row = results.rows.item(0);
              runInAction(() => {
                this.enabled = row.enabled === 1;
                this.sunriseEnabled = row.sunrise_enabled === 1;
                this.sunsetEnabled = row.sunset_enabled === 1;
                this.bufferMinutes = row.buffer_minutes;
              });
            }
            resolve();
          },
          (_: any, error: any) => {
            console.error('Error loading solar notification settings:', error);
            reject(error);
            return false;
          },
        );
      });
    });
  }

  /**
   * Persist current settings to the database.
   */
  private async persistSettings() {
    if (!this.db) {
      console.warn('Database not initialized for solar notification settings');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      this.db!.transaction((tx: any) => {
        tx.executeSql(
          `UPDATE solar_notification_settings 
           SET enabled = ?, sunrise_enabled = ?, sunset_enabled = ?, buffer_minutes = ?
           WHERE id = 1;`,
          [
            this.enabled ? 1 : 0,
            this.sunriseEnabled ? 1 : 0,
            this.sunsetEnabled ? 1 : 0,
            this.bufferMinutes,
          ],
          () => {
            resolve();
          },
          (_: any, error: any) => {
            console.error(
              'Error persisting solar notification settings:',
              error,
            );
            reject(error);
            return false;
          },
        );
      });
    });
  }

  /**
   * Enable or disable solar cycle notifications.
   */
  async setEnabled(enabled: boolean) {
    runInAction(() => {
      this.enabled = enabled;
    });
    await this.persistSettings();
  }

  /**
   * Enable or disable sunrise notifications.
   */
  async setSunriseEnabled(enabled: boolean) {
    runInAction(() => {
      this.sunriseEnabled = enabled;
    });
    await this.persistSettings();
  }

  /**
   * Enable or disable sunset notifications.
   */
  async setSunsetEnabled(enabled: boolean) {
    runInAction(() => {
      this.sunsetEnabled = enabled;
    });
    await this.persistSettings();
  }

  /**
   * Set the buffer time in minutes before the event to notify.
   */
  async setBufferMinutes(minutes: number) {
    runInAction(() => {
      this.bufferMinutes = Math.max(0, Math.min(60, minutes)); // Clamp to 0-60 minutes
    });
    await this.persistSettings();
  }

  /**
   * Calculate sun times for today based on current location.
   * @param latitude - Device latitude
   * @param longitude - Device longitude
   */
  calculateSunTimes(
    latitude: number,
    longitude: number,
  ): { sunrise: Date; sunset: Date } | null {
    try {
      const now = new Date();
      const times = SunCalc.getTimes(now, latitude, longitude);

      return {
        sunrise: times.sunrise,
        sunset: times.sunset,
      };
    } catch (error) {
      console.error('Error calculating sun times:', error);
      return null;
    }
  }

  /**
   * Update notifications based on current location and time.
   * Should be called when location changes or periodically.
   * @param latitude - Device latitude
   * @param longitude - Device longitude
   */
  updateNotifications(latitude: number, longitude: number) {
    if (!this.enabled) {
      runInAction(() => {
        this.activeNotifications = [];
      });
      return;
    }

    const now = new Date();
    const sunTimes = this.calculateSunTimes(latitude, longitude);

    if (!sunTimes) {
      return;
    }

    // Check if we need to recalculate (new day or significant location change)
    const needsRecalculation =
      !this.lastCalculationDate ||
      this.lastCalculationDate.getDate() !== now.getDate() ||
      !this.lastCalculationLocation ||
      Math.abs(this.lastCalculationLocation.latitude - latitude) > 0.1 ||
      Math.abs(this.lastCalculationLocation.longitude - longitude) > 0.1;

    if (!needsRecalculation) {
      return;
    }

    // Update last calculation tracking
    runInAction(() => {
      this.lastCalculationDate = now;
      this.lastCalculationLocation = { latitude, longitude };
    });

    // Create new notifications
    const newNotifications: SolarNotification[] = [];

    // Sunrise notification
    if (this.sunriseEnabled) {
      const sunriseTime = sunTimes.sunrise;
      const notificationTime = new Date(
        sunriseTime.getTime() - this.bufferMinutes * 60 * 1000,
      );

      // Only create notification if it's in the future
      if (notificationTime > now) {
        newNotifications.push({
          id: `sunrise-${sunriseTime.getTime()}`,
          eventType: 'sunrise',
          eventTime: sunriseTime,
          notificationTime: notificationTime,
          message: `Sunrise in ${this.bufferMinutes} minutes`,
          dismissed: false,
        });
      }
    }

    // Sunset notification
    if (this.sunsetEnabled) {
      const sunsetTime = sunTimes.sunset;
      const notificationTime = new Date(
        sunsetTime.getTime() - this.bufferMinutes * 60 * 1000,
      );

      // Only create notification if it's in the future
      if (notificationTime > now) {
        newNotifications.push({
          id: `sunset-${sunsetTime.getTime()}`,
          eventType: 'sunset',
          eventTime: sunsetTime,
          notificationTime: notificationTime,
          message: `Sunset in ${this.bufferMinutes} minutes`,
          dismissed: false,
        });
      }
    }

    runInAction(() => {
      this.activeNotifications = newNotifications;
    });
  }

  /**
   * Get the next pending notification that should be shown.
   * @returns The next notification to display, or null if none.
   */
  getNextNotification(): SolarNotification | null {
    if (!this.enabled || this.activeNotifications.length === 0) {
      return null;
    }

    const now = new Date();

    // Find the first non-dismissed notification whose notification time has passed
    for (const notification of this.activeNotifications) {
      if (!notification.dismissed && notification.notificationTime <= now) {
        return notification;
      }
    }

    return null;
  }

  /**
   * Dismiss a notification by ID.
   */
  dismissNotification(id: string) {
    runInAction(() => {
      const notification = this.activeNotifications.find((n) => n.id === id);
      if (notification) {
        notification.dismissed = true;
      }
    });
  }

  /**
   * Clear all notifications.
   */
  clearAllNotifications() {
    runInAction(() => {
      this.activeNotifications = [];
    });
  }

  /**
   * Dispose of resources.
   */
  dispose() {
    this.db = null;
    runInAction(() => {
      this.activeNotifications = [];
      this.lastCalculationDate = null;
      this.lastCalculationLocation = null;
    });
  }
}
