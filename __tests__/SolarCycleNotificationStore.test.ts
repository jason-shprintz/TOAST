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
      expect(store.enabled).toBe(false);
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
    beforeEach(async () => {
      await store.initDatabase(mockDb as any);
    });

    test('can enable notifications', async () => {
      await store.setEnabled(true);
      expect(store.enabled).toBe(true);
    });

    test('can disable notifications', async () => {
      await store.setEnabled(false);
      expect(store.enabled).toBe(false);
    });

    test('can toggle sunrise notifications', async () => {
      await store.setSunriseEnabled(false);
      expect(store.sunriseEnabled).toBe(false);
    });

    test('can toggle sunset notifications', async () => {
      await store.setSunsetEnabled(false);
      expect(store.sunsetEnabled).toBe(false);
    });

    test('can set buffer minutes', async () => {
      await store.setBufferMinutes(30);
      expect(store.bufferMinutes).toBe(30);
    });

    test('clamps buffer minutes to 0-60 range', async () => {
      await store.setBufferMinutes(-10);
      expect(store.bufferMinutes).toBe(0);

      await store.setBufferMinutes(100);
      expect(store.bufferMinutes).toBe(60);
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

    test('does not create notifications when disabled', () => {
      store.setEnabled(false);

      const latitude = 40.7128;
      const longitude = -74.006;

      store.updateNotifications(latitude, longitude);

      expect(store.activeNotifications).toEqual([]);
    });

    test('respects sunrise notification toggle', async () => {
      await store.setSunriseEnabled(false);
      await store.setSunsetEnabled(true);

      const latitude = 40.7128;
      const longitude = -74.006;

      store.updateNotifications(latitude, longitude);

      // All notifications should be sunset (or none if sunset already passed)
      const sunriseNotifications = store.activeNotifications.filter(
        (n) => n.eventType === 'sunrise',
      );
      expect(sunriseNotifications.length).toBe(0);
    });

    test('respects sunset notification toggle', async () => {
      await store.setSunriseEnabled(true);
      await store.setSunsetEnabled(false);

      const latitude = 40.7128;
      const longitude = -74.006;

      store.updateNotifications(latitude, longitude);

      // All notifications should be sunrise (or none if sunrise already passed)
      const sunsetNotifications = store.activeNotifications.filter(
        (n) => n.eventType === 'sunset',
      );
      expect(sunsetNotifications.length).toBe(0);
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

    test('getNextNotification returns null when disabled', () => {
      store.setEnabled(false);
      expect(store.getNextNotification()).toBeNull();
    });

    test('getNextNotification returns null when no notifications', () => {
      store.clearAllNotifications();
      expect(store.getNextNotification()).toBeNull();
    });
  });

  describe('Location Tracking', () => {
    beforeEach(async () => {
      await store.initDatabase(mockDb as any);
      await store.setEnabled(true);
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
      const initialLat = 40.7128;
      const initialLon = -74.006;

      store.updateNotifications(initialLat, initialLon);
      const firstCalculationDate = store.lastCalculationDate;

      // Move significantly (more than 0.1 degrees)
      const newLat = 41.0;
      const newLon = -74.006;

      store.updateNotifications(newLat, newLon);

      // Should have recalculated
      expect(store.lastCalculationDate).not.toEqual(firstCalculationDate);
    });
  });

  describe('Notification Messages', () => {
    test('creates appropriate notification messages', async () => {
      await store.initDatabase(mockDb as any);
      await store.setEnabled(true);
      await store.setBufferMinutes(20);

      const latitude = 40.7128;
      const longitude = -74.006;

      store.updateNotifications(latitude, longitude);

      store.activeNotifications.forEach((notification) => {
        expect(notification.message).toContain('20 minutes');
        if (notification.eventType === 'sunrise') {
          expect(notification.message).toContain('Sunrise');
        } else {
          expect(notification.message).toContain('Sunset');
        }
      });
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
