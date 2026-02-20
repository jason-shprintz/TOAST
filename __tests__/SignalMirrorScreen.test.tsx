/**
 * @format
 */

import { GROUND_TO_AIR_SIGNALS } from '../src/screens/SignalMirror/data';

describe('GroundToAirSignals', () => {
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
