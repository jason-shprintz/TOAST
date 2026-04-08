/**
 * @format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationsStore } from '../src/stores/NotificationsStore';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('NotificationsStore', () => {
  let store: NotificationsStore;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: nothing stored yet
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined as any);
    store = new NotificationsStore();
  });

  describe('initial state', () => {
    test('starts with empty hiddenKeys', () => {
      expect(store.hiddenKeys.size).toBe(0);
    });

    test('isLoaded starts false', () => {
      expect(store.isLoaded).toBe(false);
    });
  });

  describe('loadHiddenKeys()', () => {
    test('sets isLoaded=true after loading when storage is empty', async () => {
      await store.loadHiddenKeys();
      expect(store.isLoaded).toBe(true);
    });

    test('populates hiddenKeys from AsyncStorage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify(['solar-sunrise-123', 'pantry-item1-expired']),
      );
      await store.loadHiddenKeys();
      expect(store.hiddenKeys.size).toBe(2);
      expect(store.hiddenKeys.has('solar-sunrise-123')).toBe(true);
      expect(store.hiddenKeys.has('pantry-item1-expired')).toBe(true);
    });

    test('handles AsyncStorage read error gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('read error'));
      await expect(store.loadHiddenKeys()).resolves.not.toThrow();
      expect(store.isLoaded).toBe(true);
      expect(store.hiddenKeys.size).toBe(0);
    });
  });

  describe('isHidden()', () => {
    test('returns false for unknown keys', () => {
      expect(store.isHidden('unknown-key')).toBe(false);
    });

    test('returns true after hideNotification', () => {
      store.hideNotification('solar-sunrise-123');
      expect(store.isHidden('solar-sunrise-123')).toBe(true);
    });
  });

  describe('hideNotification()', () => {
    test('adds key to hiddenKeys', () => {
      store.hideNotification('pantry-item1-30day');
      expect(store.hiddenKeys.has('pantry-item1-30day')).toBe(true);
    });

    test('persists to AsyncStorage', async () => {
      store.hideNotification('astro-lunar-eclipse-1');
      // Allow microtask queue to flush
      await Promise.resolve();
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@notifications/hidden_keys',
        JSON.stringify(['astro-lunar-eclipse-1']),
      );
    });

    test('is idempotent for already-hidden keys', () => {
      store.hideNotification('weather-monthly-outlook');
      store.hideNotification('weather-monthly-outlook');
      expect(store.hiddenKeys.size).toBe(1);
    });

    test('handles AsyncStorage write error gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('write error'));
      expect(() => store.hideNotification('key')).not.toThrow();
    });
  });

  describe('unhideNotification()', () => {
    test('removes key from hiddenKeys', () => {
      store.hideNotification('solar-sunrise-123');
      store.unhideNotification('solar-sunrise-123');
      expect(store.hiddenKeys.has('solar-sunrise-123')).toBe(false);
    });

    test('persists removal to AsyncStorage', async () => {
      store.hideNotification('key-a');
      store.hideNotification('key-b');
      mockAsyncStorage.setItem.mockClear();
      store.unhideNotification('key-a');
      await Promise.resolve();
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@notifications/hidden_keys',
        JSON.stringify(['key-b']),
      );
    });

    test('is a no-op for unknown keys', () => {
      expect(() => store.unhideNotification('nonexistent')).not.toThrow();
      expect(store.hiddenKeys.size).toBe(0);
    });
  });

  describe('clearHiddenKeys()', () => {
    test('empties hiddenKeys', () => {
      store.hideNotification('a');
      store.hideNotification('b');
      store.clearHiddenKeys();
      expect(store.hiddenKeys.size).toBe(0);
    });

    test('persists empty array to AsyncStorage', async () => {
      store.hideNotification('a');
      mockAsyncStorage.setItem.mockClear();
      store.clearHiddenKeys();
      await Promise.resolve();
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@notifications/hidden_keys',
        JSON.stringify([]),
      );
    });
  });
});
