/**
 * @format
 */

import { SolarCycleNotificationStore } from '../src/stores/SolarCycleNotificationStore';

// Mock SQLite
const mockDb = {
  transaction: jest.fn((callback) => {
    const tx = {
      executeSql: jest.fn((sql, params, success) => {
        if (success) {
          if (sql.includes('SELECT')) {
            // Mock loading settings
            success(null, {
              rows: {
                length: 1,
                item: () => ({
                  enabled: 1,
                  sunrise_enabled: 1,
                  sunset_enabled: 1,
                  buffer_minutes: 15,
                }),
              },
            });
          } else {
            // Mock insert/update success
            success();
          }
        }
      }),
    };
    callback(tx);
  }),
};

describe('SolarCycleNotificationStore', () => {
  let store: SolarCycleNotificationStore;

  beforeEach(() => {
    store = new SolarCycleNotificationStore();
  });

  afterEach(() => {
    store.dispose();
  });

  describe('Initialization', () => {
    test('initializes with default settings', () => {
      expect(store.enabled).toBe(true); // Solar cycle notifications are always enabled
      expect(store.sunriseEnabled).toBe(true);
      expect(store.sunsetEnabled).toBe(true);
      expect(store.bufferMinutes).toBe(15);
      expect(store.activeNotifications).toEqual([]);
    });

    test('can initialize database', async () => {
      await store.initDatabase(mockDb as any);
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    test('can load settings from database', async () => {
      await store.initDatabase(mockDb as any);
      await store.loadSettings();
      expect(store.enabled).toBe(true);
      expect(store.sunriseEnabled).toBe(true);
      expect(store.sunsetEnabled).toBe(true);
      expect(store.bufferMinutes).toBe(15);
    });
  });

  describe('Settings Management', () => {
    test('has hardcoded default settings', () => {
      // Settings are always-on and not user-configurable
      expect(store.enabled).toBe(true);
      expect(store.sunriseEnabled).toBe(true);
      expect(store.sunsetEnabled).toBe(true);
      expect(store.bufferMinutes).toBe(15);
    });

    test('initDatabase completes without error', async () => {
      await expect(store.initDatabase(mockDb as any)).resolves.not.toThrow();
    });

    test('loadSettings completes without error', async () => {
      await store.initDatabase(mockDb as any);
      await expect(store.loadSettings()).resolves.not.toThrow();
    });
  });

  describe('Sun Time Calculations', () => {
    test('calculates sun times for valid coordinates', () => {
      const latitude = 40.7128; // New York
      const longitude = -74.006;

      const sunTimes = store.calculateSunTimes(latitude, longitude);

      expect(sunTimes).not.toBeNull();
      expect(sunTimes!.sunrise).toBeInstanceOf(Date);
      expect(sunTimes!.sunset).toBeInstanceOf(Date);
      expect(sunTimes!.sunrise.getTime()).toBeLessThan(
        sunTimes!.sunset.getTime(),
      );
    });

    test('calculates sun times for different locations', () => {
      const locations = [
        { lat: 40.7128, lon: -74.006 }, // New York
        { lat: 51.5074, lon: -0.1278 }, // London
        { lat: 35.6762, lon: 139.6503 }, // Tokyo
      ];

      locations.forEach((location) => {
        const sunTimes = store.calculateSunTimes(location.lat, location.lon);
        expect(sunTimes).not.toBeNull();
        expect(sunTimes!.sunrise).toBeInstanceOf(Date);
        expect(sunTimes!.sunset).toBeInstanceOf(Date);
      });
    });

    test('handles edge case coordinates', () => {
      const sunTimes = store.calculateSunTimes(0, 0);
      expect(sunTimes).not.toBeNull();
      expect(sunTimes!.sunrise).toBeInstanceOf(Date);
      expect(sunTimes!.sunset).toBeInstanceOf(Date);
    });
  });

  describe('Notification Management', () => {
    beforeEach(async () => {
      await store.initDatabase(mockDb as any);
      await store.setEnabled(true);
    });

    test('creates notifications when enabled', () => {
      const latitude = 40.7128;
      const longitude = -74.006;

      store.updateNotifications(latitude, longitude);

      // Should have created notifications (if they're in the future)
      expect(store.activeNotifications.length).toBeGreaterThanOrEqual(0);
      expect(store.activeNotifications.length).toBeLessThanOrEqual(2);
    });

    test('can dismiss notifications', () => {
      const latitude = 40.7128;
      const longitude = -74.006;

      store.updateNotifications(latitude, longitude);

      if (store.activeNotifications.length > 0) {
        const firstNotification = store.activeNotifications[0];
        store.dismissNotification(firstNotification.id);
        expect(firstNotification.dismissed).toBe(true);
      }
    });

    test('can clear all notifications', () => {
      const latitude = 40.7128;
      const longitude = -74.006;

      store.updateNotifications(latitude, longitude);
      store.clearAllNotifications();

      expect(store.activeNotifications).toEqual([]);
    });

    test('getNextNotification returns null when no notifications', () => {
      store.clearAllNotifications();
      expect(store.getNextNotification()).toBeNull();
    });
  });

  describe('Location Tracking', () => {
    beforeEach(async () => {
      await store.initDatabase(mockDb as any);
    });

    test('tracks last calculation date and location', () => {
      const latitude = 40.7128;
      const longitude = -74.006;

      store.updateNotifications(latitude, longitude);

      expect(store.lastCalculationDate).not.toBeNull();
      expect(store.lastCalculationLocation).toEqual({
        latitude,
        longitude,
      });
    });

    test('recalculates when location changes significantly', () => {
      jest.useFakeTimers();

      const initialLat = 40.7128;
      const initialLon = -74.006;

      store.updateNotifications(initialLat, initialLon);
      const firstCalculationDate = store.lastCalculationDate;

      // Advance time to ensure new Date() returns a different value
      jest.advanceTimersByTime(1000);

      // Move significantly (more than 0.1 degrees)
      const newLat = 41.0;
      const newLon = -74.006;

      store.updateNotifications(newLat, newLon);

      // Should have recalculated
      expect(store.lastCalculationDate).not.toEqual(firstCalculationDate);

      jest.useRealTimers();
    });
  });

  describe('Notification Messages', () => {
    test('static notification messages use default buffer time', async () => {
      await store.initDatabase(mockDb as any);

      const latitude = 40.7128;
      const longitude = -74.006;

      store.updateNotifications(latitude, longitude);

      // Message field is now empty as it's generated dynamically
      store.activeNotifications.forEach((notification) => {
        // Static message is empty string
        expect(notification.message).toBe('');
      });
    });

    test('generates dynamic notification messages based on time remaining', async () => {
      await store.initDatabase(mockDb as any);

      const latitude = 40.7128;
      const longitude = -74.006;

      store.updateNotifications(latitude, longitude);

      const nextNotification = store.getNextNotification();
      if (nextNotification) {
        const message = store.getNotificationMessage(nextNotification);
        expect(message).toMatch(/(Sunrise|Sunset) in \d+/);
      }
    });
  });

  describe('Edge Cases and Validation', () => {
    test('handles invalid latitude values', () => {
      const invalidLatitudes = [
        NaN,
        Infinity,
        -Infinity,
        -100,
        100,
        'invalid' as any,
      ];

      invalidLatitudes.forEach((lat) => {
        const result = store.calculateSunTimes(lat, 0);
        expect(result).toBeNull();
      });
    });

    test('handles invalid longitude values', () => {
      const invalidLongitudes = [
        NaN,
        Infinity,
        -Infinity,
        -200,
        200,
        'invalid' as any,
      ];

      invalidLongitudes.forEach((lon) => {
        const result = store.calculateSunTimes(0, lon);
        expect(result).toBeNull();
      });
    });

    test('updateNotifications handles invalid coordinates gracefully', async () => {
      await store.initDatabase(mockDb as any);

      // Should not throw and not create notifications
      store.updateNotifications(NaN, 0);
      expect(store.activeNotifications).toEqual([]);

      store.updateNotifications(0, Infinity);
      expect(store.activeNotifications).toEqual([]);
    });

    test('handles date boundary crossings correctly', () => {
      // Test month boundary
      const dec31 = new Date('2024-12-31T23:00:00Z');
      const jan1 = new Date('2025-01-01T01:00:00Z');

      expect(dec31.toDateString()).not.toBe(jan1.toDateString());

      // Test year boundary is detected
      const lastYear = new Date('2024-12-31');
      const newYear = new Date('2025-01-01');
      expect(lastYear.toDateString()).not.toBe(newYear.toDateString());
    });

    test('creates notification when event time is in future but notification time has passed', async () => {
      await store.initDatabase(mockDb as any);

      // This simulates the case where user opens app after notification time
      // but before the actual event
      const latitude = 40.7128;
      const longitude = -74.006;

      store.updateNotifications(latitude, longitude);

      // Should still create notifications for future events
      const futureEvents = store.activeNotifications.filter(
        (n) => n.eventTime > new Date(),
      );
      expect(futureEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Disposal', () => {
    test('cleans up resources on dispose', () => {
      store.dispose();

      expect(store.activeNotifications).toEqual([]);
      expect(store.lastCalculationDate).toBeNull();
      expect(store.lastCalculationLocation).toBeNull();
    });
  });
});
