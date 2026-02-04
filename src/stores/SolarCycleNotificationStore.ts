import { makeAutoObservable, runInAction } from 'mobx';
import * as SunCalc from 'suncalc';
import { SQLiteDatabase } from '../types/database-types';

export type SolarEventType = 'sunrise' | 'sunset';

// Constants for buffer time limits
const MIN_BUFFER_MINUTES = 0;
const MAX_BUFFER_MINUTES = 60;

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
  // Settings - Solar cycle notifications are always enabled
  // These settings are not exposed to users but kept for potential future expansion
  enabled: boolean = true; // Always enabled
  sunriseEnabled: boolean = true;
  sunsetEnabled: boolean = true;
  bufferMinutes: number = 15; // Notify 15 minutes before event

  // Current notifications
  activeNotifications: SolarNotification[] = [];

  // Last calculation
  lastCalculationDate: Date | null = null;
  lastCalculationLocation: { latitude: number; longitude: number } | null =
    null;

  // Observable timestamp to trigger re-renders for dynamic messages
  currentTime: Date = new Date();

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
            enabled INTEGER NOT NULL DEFAULT 1,
            sunrise_enabled INTEGER NOT NULL DEFAULT 1,
            sunset_enabled INTEGER NOT NULL DEFAULT 1,
            buffer_minutes INTEGER NOT NULL DEFAULT 15
          );`,
          [],
          () => {
            // Insert default settings if table is empty
            tx.executeSql(
              `INSERT OR IGNORE INTO solar_notification_settings (id, enabled, sunrise_enabled, sunset_enabled, buffer_minutes)
               VALUES (1, 1, 1, 1, 15);`,
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
      this.bufferMinutes = Math.max(
        MIN_BUFFER_MINUTES,
        Math.min(MAX_BUFFER_MINUTES, minutes),
      ); // Clamp to valid range
    });
    await this.persistSettings();
  }

  /**
   * Calculate sun times for today based on current location.
   * @param latitude - Device latitude (-90 to 90)
   * @param longitude - Device longitude (-180 to 180)
   * @returns Sun times or null if invalid coordinates
   */
  calculateSunTimes(
    latitude: number,
    longitude: number,
  ): { sunrise: Date; sunset: Date } | null {
    // Validate coordinates
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !isFinite(latitude) ||
      !isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      console.error('Invalid coordinates:', { latitude, longitude });
      return null;
    }

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
   * @param latitude - Device latitude (-90 to 90)
   * @param longitude - Device longitude (-180 to 180)
   */
  updateNotifications(latitude: number, longitude: number) {
    // Validate coordinates
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !isFinite(latitude) ||
      !isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      console.error('Invalid coordinates provided to updateNotifications:', {
        latitude,
        longitude,
      });
      return;
    }

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
      this.lastCalculationDate.toDateString() !== now.toDateString() ||
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

    // Sunrise notification - create if event time is in the future
    if (this.sunriseEnabled) {
      const sunriseTime = sunTimes.sunrise;

      // Create notification if the event itself is in the future
      if (sunriseTime > now) {
        const notificationTime = new Date(
          sunriseTime.getTime() - this.bufferMinutes * 60 * 1000,
        );

        newNotifications.push({
          id: `sunrise-${sunriseTime.getTime()}`,
          eventType: 'sunrise',
          eventTime: sunriseTime,
          notificationTime: notificationTime,
          message: '', // Message is generated dynamically
          dismissed: false,
        });
      }
    }

    // Sunset notification - create if event time is in the future
    if (this.sunsetEnabled) {
      const sunsetTime = sunTimes.sunset;

      // Create notification if the event itself is in the future
      if (sunsetTime > now) {
        const notificationTime = new Date(
          sunsetTime.getTime() - this.bufferMinutes * 60 * 1000,
        );

        newNotifications.push({
          id: `sunset-${sunsetTime.getTime()}`,
          eventType: 'sunset',
          eventTime: sunsetTime,
          notificationTime: notificationTime,
          message: '', // Message is generated dynamically
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
   * Returns the next upcoming notification (not yet dismissed).
   * @returns The next notification to display, or null if none.
   */
  getNextNotification(): SolarNotification | null {
    if (!this.enabled || this.activeNotifications.length === 0) {
      return null;
    }

    const now = new Date();

    // Find the next non-dismissed notification (either active or upcoming)
    // Sort by notification time to get the earliest one
    const sortedNotifications = [...this.activeNotifications]
      .filter((n) => !n.dismissed && n.eventTime > now)
      .sort((a, b) => a.eventTime.getTime() - b.eventTime.getTime());

    if (sortedNotifications.length > 0) {
      return sortedNotifications[0];
    }

    return null;
  }

  /**
   * Get a dynamic message for a notification based on time remaining.
   * Uses the currentTime observable to ensure reactivity.
   * @param notification - The notification to get the message for
   * @returns A formatted message string
   */
  getNotificationMessage(notification: SolarNotification): string {
    // Access currentTime to create a dependency for MobX observer
    const now = this.currentTime;
    const timeUntilEvent = notification.eventTime.getTime() - now.getTime();
    const minutesUntilEvent = Math.floor(timeUntilEvent / (60 * 1000));
    const hoursUntilEvent = Math.floor(minutesUntilEvent / 60);

    const eventName =
      notification.eventType === 'sunrise' ? 'Sunrise' : 'Sunset';

    if (hoursUntilEvent > 1) {
      return `${eventName} in ${hoursUntilEvent}h ${minutesUntilEvent % 60}m`;
    } else if (minutesUntilEvent > 0) {
      return `${eventName} in ${minutesUntilEvent}m`;
    } else {
      return `${eventName} now`;
    }
  }

  /**
   * Update the current time to trigger re-renders of dynamic messages.
   * Should be called periodically (e.g., every minute).
   */
  updateCurrentTime() {
    runInAction(() => {
      this.currentTime = new Date();
    });
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
