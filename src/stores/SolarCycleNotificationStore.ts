import { makeAutoObservable, runInAction } from 'mobx';
import * as SunCalc from 'suncalc';
import { SQLiteDatabase } from '../types/database-types';

export type SolarEventType = 'sunrise' | 'sunset' | 'dawn' | 'dusk';

// Location change threshold for recalculating sun times
// Set to 0.01 degrees (~1.1km at equator) to balance accuracy with performance
// Sun times change by approximately 1 minute per 15km of east-west movement
// and 4 minutes per degree of north-south movement at mid-latitudes
const LOCATION_CHANGE_THRESHOLD_DEGREES = 0.01;

export interface SolarNotificationSettings {
  enabled: boolean;
  sunriseEnabled: boolean;
  sunsetEnabled: boolean;
  dawnEnabled: boolean;
  duskEnabled: boolean;
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
  // These internal settings are not user-configurable but kept for code flexibility
  // Future expansion: if settings become configurable, add setters and UI
  enabled: boolean = true; // Always enabled, not user-configurable
  sunriseEnabled: boolean = true; // Always track sunrise
  sunsetEnabled: boolean = true; // Always track sunset
  dawnEnabled: boolean = true; // Always track dawn
  duskEnabled: boolean = true; // Always track dusk
  bufferMinutes: number = 15; // Internal default, not user-configurable

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
   * Initialize the database (currently not used for settings persistence).
   * Reserved for future expansion if settings become user-configurable.
   * @param database - The SQLite database instance
   */
  async initDatabase(database: SQLiteDatabase) {
    this.db = database;
    // Database initialization simplified - settings are not persisted
    // since they are always-on and not user-configurable
  }

  /**
   * Load settings (currently no-op since settings are hardcoded).
   * Reserved for future expansion if settings become user-configurable.
   */
  async loadSettings() {
    // No-op: Settings are hardcoded as always-on
    // This method is kept for API compatibility with RootStore
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
  ): { sunrise: Date; sunset: Date; dawn: Date; dusk: Date } | null {
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

      const { sunrise, sunset, dawn, dusk } = times;

      // Validate that all returned times are valid Date objects.
      // In polar regions during certain times of year, suncalc may return
      // Invalid Date objects when the sun doesn't rise, set, or experience dawn/dusk.
      const events: Array<{ name: SolarEventType; value: Date }> = [
        { name: 'sunrise', value: sunrise },
        { name: 'sunset', value: sunset },
        { name: 'dawn', value: dawn },
        { name: 'dusk', value: dusk },
      ];

      for (const event of events) {
        if (!(event.value instanceof Date) || isNaN(event.value.getTime())) {
          console.warn('Invalid sun time calculated:', {
            event: event.name,
            latitude,
            longitude,
            value: event.value,
          });
          return null;
        }
      }

      return {
        sunrise,
        sunset,
        dawn,
        dusk,
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
    // Location threshold is ~1.1km to provide accurate times while minimizing recalculations
    const needsRecalculation =
      !this.lastCalculationDate ||
      this.lastCalculationDate.toDateString() !== now.toDateString() ||
      !this.lastCalculationLocation ||
      Math.abs(this.lastCalculationLocation.latitude - latitude) >
        LOCATION_CHANGE_THRESHOLD_DEGREES ||
      Math.abs(this.lastCalculationLocation.longitude - longitude) >
        LOCATION_CHANGE_THRESHOLD_DEGREES;

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

      // Validate that sunrise time is a valid Date object
      // In polar regions, suncalc may return Invalid Date when sunrise doesn't occur
      if (!isNaN(sunriseTime.getTime()) && sunriseTime > now) {
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

      // Validate that sunset time is a valid Date object
      // In polar regions, suncalc may return Invalid Date when sunset doesn't occur
      if (!isNaN(sunsetTime.getTime()) && sunsetTime > now) {
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

    // Dawn notification - create if event time is in the future
    if (this.dawnEnabled) {
      const dawnTime = sunTimes.dawn;

      // Validate that dawn time is a valid Date object
      // In polar regions, suncalc may return Invalid Date when dawn doesn't occur
      if (!isNaN(dawnTime.getTime()) && dawnTime > now) {
        const notificationTime = new Date(
          dawnTime.getTime() - this.bufferMinutes * 60 * 1000,
        );

        newNotifications.push({
          id: `dawn-${dawnTime.getTime()}`,
          eventType: 'dawn',
          eventTime: dawnTime,
          notificationTime: notificationTime,
          message: '', // Message is generated dynamically
          dismissed: false,
        });
      }
    }

    // Dusk notification - create if event time is in the future
    if (this.duskEnabled) {
      const duskTime = sunTimes.dusk;

      // Validate that dusk time is a valid Date object
      // In polar regions, suncalc may return Invalid Date when dusk doesn't occur
      if (!isNaN(duskTime.getTime()) && duskTime > now) {
        const notificationTime = new Date(
          duskTime.getTime() - this.bufferMinutes * 60 * 1000,
        );

        newNotifications.push({
          id: `dusk-${duskTime.getTime()}`,
          eventType: 'dusk',
          eventTime: duskTime,
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

    const eventNameMap: Record<SolarEventType, string> = {
      sunrise: 'Sunrise',
      sunset: 'Sunset',
      dawn: 'Dawn',
      dusk: 'Dusk',
    };

    const eventName = eventNameMap[notification.eventType];

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
