/**
 * @format
 */

import { CoreStore } from '../src/stores/CoreStore';

// Mock react-native-geolocation-service
jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
  requestAuthorization: jest.fn(() => Promise.resolve('granted')),
}));

// Mock react-native modules
jest.mock('react-native-torch', () => ({
  switchState: jest.fn(),
}));

jest.mock('react-native-sound', () => {
  const Sound = jest.fn().mockImplementation(() => ({
    play: jest.fn((callback: Function) => callback(true)),
    stop: jest.fn((callback?: Function) => callback && callback()),
    release: jest.fn(),
  })) as jest.Mock & { setCategory: jest.Mock; MAIN_BUNDLE: string };
  Sound.setCategory = jest.fn();
  Sound.MAIN_BUNDLE = '';
  return Sound;
});

jest.mock('react-native-device-info', () => ({
  getBatteryLevel: jest.fn(() => Promise.resolve(0.75)),
  getPowerState: jest.fn(() =>
    Promise.resolve({ batteryState: 'unplugged', charging: false }),
  ),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      type: 'wifi',
    }),
  ),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  NativeModules: {},
  Platform: {
    OS: 'ios',
  },
}));

describe('CoreStore - Morse Code Transmission', () => {
  let coreStore: CoreStore;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    coreStore = new CoreStore();
  });

  afterEach(() => {
    coreStore.stopMorseTransmission();
    coreStore.dispose();
    jest.useRealTimers();
  });

  describe('transmitMorseMessage', () => {
    it('should set isMorseTransmitting to true when transmission starts', () => {
      expect(coreStore.isMorseTransmitting).toBe(false);
      coreStore.transmitMorseMessage('...', false);
      expect(coreStore.isMorseTransmitting).toBe(true);
    });

    it('should generate sequence and complete transmission', () => {
      coreStore.transmitMorseMessage('.', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      // Run through entire sequence
      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });

    it('should handle empty morse code gracefully', () => {
      expect(coreStore.isMorseTransmitting).toBe(false);
      coreStore.transmitMorseMessage('', false);

      // With empty sequence, it should still complete the transmission flow
      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });

    it('should set isMorseTransmitting to false when transmission completes', () => {
      coreStore.transmitMorseMessage('.', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      // Run through entire sequence
      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });

    it('should handle complex morse patterns', () => {
      // SOS pattern: ... --- ...
      coreStore.transmitMorseMessage('... --- ...', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });

    it('should handle morse code with spaces between letters', () => {
      coreStore.transmitMorseMessage('. .', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });

    it('should handle morse code with word separator', () => {
      coreStore.transmitMorseMessage('. / .', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });

    it('should handle morse code with only spaces', () => {
      coreStore.transmitMorseMessage('   ', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });

    it('should handle morse code with multiple word separators', () => {
      coreStore.transmitMorseMessage('/ / /', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });

    it('should handle transmission with tone enabled', () => {
      coreStore.transmitMorseMessage('.', true);
      expect(coreStore.isMorseTransmitting).toBe(true);

      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });

    it('should handle transmission with tone disabled', () => {
      coreStore.transmitMorseMessage('.', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });
  });

  describe('stopMorseTransmission', () => {
    it('should set isMorseTransmitting to false', () => {
      coreStore.transmitMorseMessage('...', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      coreStore.stopMorseTransmission();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });

    it('should clear the morse timer', () => {
      coreStore.transmitMorseMessage('...', false);
      const morseTimer = (coreStore as any).morseTimer;
      expect(morseTimer).not.toBeNull();

      coreStore.stopMorseTransmission();
      expect((coreStore as any).morseTimer).toBeNull();
    });

    it('should be safe to call when no transmission is active', () => {
      expect(() => {
        coreStore.stopMorseTransmission();
      }).not.toThrow();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });

    it('should be safe to call multiple times', () => {
      coreStore.transmitMorseMessage('...', false);
      coreStore.stopMorseTransmission();
      expect(() => {
        coreStore.stopMorseTransmission();
        coreStore.stopMorseTransmission();
      }).not.toThrow();
    });

    it('should stop transmission that is in progress', () => {
      coreStore.transmitMorseMessage('... --- ...', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      // Advance partway through
      jest.advanceTimersByTime(500);
      expect(coreStore.isMorseTransmitting).toBe(true);

      // Stop it
      coreStore.stopMorseTransmission();
      expect(coreStore.isMorseTransmitting).toBe(false);

      // Advancing timers further should not restart
      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });
  });

  describe('Morse transmission integration', () => {
    it('should handle rapid start/stop cycles', () => {
      coreStore.transmitMorseMessage('...', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      coreStore.stopMorseTransmission();
      expect(coreStore.isMorseTransmitting).toBe(false);

      coreStore.transmitMorseMessage('---', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });

    it('should properly handle message with all morse elements', () => {
      // Test with dots, dashes, letter spaces, and word separators
      coreStore.transmitMorseMessage('.- / -...', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });

    it('should handle restarting transmission with different message', () => {
      coreStore.transmitMorseMessage('.', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      // Start a new transmission (should stop the old one first)
      coreStore.transmitMorseMessage('---', false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });

    it('should handle long complex messages', () => {
      // Simulate a longer message with mixed content
      const longMessage = '... --- ... / .... . .-.. .--. / -- .';
      coreStore.transmitMorseMessage(longMessage, false);
      expect(coreStore.isMorseTransmitting).toBe(true);

      jest.runAllTimers();
      expect(coreStore.isMorseTransmitting).toBe(false);
    });
  });
});
