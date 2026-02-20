/**
 * @format
 */

import {
  GROUND_TO_AIR_SIGNALS,
  SOS_SEQUENCE,
} from '../src/screens/SignalMirror/data';

describe('SignalMirror', () => {
  describe('SOS_SEQUENCE', () => {
    it('should have 18 steps', () => {
      expect(SOS_SEQUENCE).toHaveLength(18);
    });

    it('every step should be a [boolean, number] tuple', () => {
      SOS_SEQUENCE.forEach(([isOn, duration]) => {
        expect(typeof isOn).toBe('boolean');
        expect(typeof duration).toBe('number');
        expect(duration).toBeGreaterThan(0);
      });
    });

    it('should start with three short flashes (S)', () => {
      // First flash: on for 200 ms
      expect(SOS_SEQUENCE[0]).toEqual([true, 200]);
      // Gap after first flash
      expect(SOS_SEQUENCE[1]).toEqual([false, 200]);
      // Second flash: on for 200 ms
      expect(SOS_SEQUENCE[2]).toEqual([true, 200]);
      // Gap after second flash
      expect(SOS_SEQUENCE[3]).toEqual([false, 200]);
      // Third flash: on for 200 ms
      expect(SOS_SEQUENCE[4]).toEqual([true, 200]);
    });

    it('should have three long flashes (O) in the middle', () => {
      // O starts at index 6
      expect(SOS_SEQUENCE[6]).toEqual([true, 600]);
      expect(SOS_SEQUENCE[8]).toEqual([true, 600]);
      expect(SOS_SEQUENCE[10]).toEqual([true, 600]);
    });

    it('should end with three short flashes (S) followed by a long pause', () => {
      // Last flash at index 16
      expect(SOS_SEQUENCE[16]).toEqual([true, 200]);
      // Long post-cycle pause
      expect(SOS_SEQUENCE[17]).toEqual([false, 2000]);
    });

    it('should have all "on" steps as true and all "off" steps as false', () => {
      const onSteps = SOS_SEQUENCE.filter(([isOn]) => isOn);
      const offSteps = SOS_SEQUENCE.filter(([isOn]) => !isOn);

      // 9 flashes total (3 + 3 + 3)
      expect(onSteps).toHaveLength(9);
      // 9 gaps between and after flashes
      expect(offSteps).toHaveLength(9);
    });

    it('short flashes should be 200 ms', () => {
      // S = indices 0, 2, 4 (on) and 12, 14, 16 (on)
      const shortFlashes = [0, 2, 4, 12, 14, 16].map((i) => SOS_SEQUENCE[i]);
      shortFlashes.forEach(([, duration]) => {
        expect(duration).toBe(200);
      });
    });

    it('long flashes should be 600 ms', () => {
      // O = indices 6, 8, 10 (on)
      const longFlashes = [6, 8, 10].map((i) => SOS_SEQUENCE[i]);
      longFlashes.forEach(([, duration]) => {
        expect(duration).toBe(600);
      });
    });
  });

  describe('GROUND_TO_AIR_SIGNALS', () => {
    it('should define at least 8 signals', () => {
      expect(GROUND_TO_AIR_SIGNALS.length).toBeGreaterThanOrEqual(8);
    });

    it('every signal should have required fields', () => {
      GROUND_TO_AIR_SIGNALS.forEach((signal) => {
        expect(typeof signal.symbol).toBe('string');
        expect(signal.symbol.length).toBeGreaterThan(0);
        expect(typeof signal.meaning).toBe('string');
        expect(signal.meaning.length).toBeGreaterThan(0);
        expect(typeof signal.minSize).toBe('string');
        expect(signal.minSize.length).toBeGreaterThan(0);
        expect(typeof signal.materials).toBe('string');
        expect(signal.materials.length).toBeGreaterThan(0);
      });
    });

    it('should include V (need assistance)', () => {
      const v = GROUND_TO_AIR_SIGNALS.find((s) => s.symbol === 'V');
      expect(v).toBeDefined();
      expect(v?.meaning).toMatch(/assist/i);
    });

    it('should include X (need medical help)', () => {
      const x = GROUND_TO_AIR_SIGNALS.find((s) => s.symbol === 'X');
      expect(x).toBeDefined();
      expect(x?.meaning).toMatch(/medical/i);
    });

    it('should include LL (all is well)', () => {
      const ll = GROUND_TO_AIR_SIGNALS.find((s) => s.symbol === 'LL');
      expect(ll).toBeDefined();
      expect(ll?.meaning).toMatch(/well/i);
    });

    it('each signal minSize should mention metres', () => {
      GROUND_TO_AIR_SIGNALS.forEach((signal) => {
        expect(signal.minSize).toMatch(/m/i);
      });
    });
  });
});
