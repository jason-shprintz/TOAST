/**
 * @format
 */

import {
  ddToMgrs,
  ddToDms,
  dmsToDd,
  mgrsToDD,
  parseDdString,
} from '../src/utils/gridReference';

// Known Las Vegas coordinate from issue acceptance criteria
const LV_LAT = 36.1716;
const LV_LNG = -115.1391;

describe('gridReference utilities', () => {
  // -------------------------------------------------------------------------
  // DD ↔ DMS
  // -------------------------------------------------------------------------

  describe('ddToDms', () => {
    test('converts Las Vegas coordinate to correct DMS', () => {
      const result = ddToDms(LV_LAT, LV_LNG);
      expect(result.latDeg).toBe(36);
      expect(result.latMin).toBe(10);
      expect(result.latSec).toBeCloseTo(17.76, 0);
      expect(result.latDir).toBe('N');
      expect(result.lngDeg).toBe(115);
      expect(result.lngMin).toBe(8);
      expect(result.lngSec).toBeCloseTo(20.76, 0);
      expect(result.lngDir).toBe('W');
    });

    test('formatted string contains expected components', () => {
      const { formatted } = ddToDms(LV_LAT, LV_LNG);
      expect(formatted).toContain('36°');
      expect(formatted).toContain("10'");
      expect(formatted).toContain('N');
      expect(formatted).toContain('115°');
      expect(formatted).toContain("8'");
      expect(formatted).toContain('W');
    });

    test('southern hemisphere coordinate uses S/W dirs', () => {
      const result = ddToDms(-33.8688, 151.2093); // Sydney
      expect(result.latDir).toBe('S');
      expect(result.lngDir).toBe('E');
      expect(result.latDeg).toBe(33);
    });

    test('equator coordinate', () => {
      const result = ddToDms(0, 0);
      expect(result.latDir).toBe('N');
      expect(result.lngDir).toBe('E');
      expect(result.latDeg).toBe(0);
      expect(result.lngDeg).toBe(0);
    });
  });

  describe('dmsToDd', () => {
    test('parses Las Vegas DMS back to original coordinate', () => {
      const dmsStr = "36° 10' 17.76\" N, 115° 8' 20.76\" W";
      const { lat, lng } = dmsToDd(dmsStr);
      expect(lat).toBeCloseTo(LV_LAT, 3);
      expect(lng).toBeCloseTo(LV_LNG, 3);
    });

    test('round-trip DD → DMS → DD', () => {
      const { formatted } = ddToDms(LV_LAT, LV_LNG);
      const { lat, lng } = dmsToDd(formatted);
      expect(lat).toBeCloseTo(LV_LAT, 3);
      expect(lng).toBeCloseTo(LV_LNG, 3);
    });

    test('accepts "deg" instead of degree symbol', () => {
      const { lat, lng } = dmsToDd("36deg 10 17.76 N 115 8 20.76 W");
      expect(lat).toBeCloseTo(LV_LAT, 2);
      expect(lng).toBeCloseTo(LV_LNG, 2);
    });

    test('throws on invalid input', () => {
      expect(() => dmsToDd('not a coordinate')).toThrow();
      expect(() => dmsToDd('abc def ghi jkl')).toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // DD ↔ MGRS
  // -------------------------------------------------------------------------

  describe('ddToMgrs', () => {
    test('converts Las Vegas coordinate to expected MGRS zone', () => {
      const result = ddToMgrs(LV_LAT, LV_LNG);
      // Should be in zone 11S
      expect(result).toMatch(/^11S/);
    });

    test('returns string with expected MGRS format (zone + square + digits)', () => {
      const result = ddToMgrs(LV_LAT, LV_LNG);
      // Format: "NNL LL NNNNN NNNNN"
      expect(result).toMatch(/^\d{1,2}[A-Z] [A-Z]{2} \d{5} \d{5}$/);
    });

    test('throws for latitude out of MGRS range', () => {
      expect(() => ddToMgrs(85, 0)).toThrow();
      expect(() => ddToMgrs(-81, 0)).toThrow();
    });

    test('throws for longitude out of range', () => {
      expect(() => ddToMgrs(0, 181)).toThrow();
    });

    test('known MGRS string for Las Vegas matches expected output', () => {
      const result = ddToMgrs(LV_LAT, LV_LNG);
      // UTM zone 11, band S, column P (easting ~667363), row A (northing ~4004586)
      expect(result).toBe('11S PA 67363 04586');
    });
  });

  describe('mgrsToDD', () => {
    test('converts MGRS back to approximate Las Vegas coordinate', () => {
      const { lat, lng } = mgrsToDD('11S PA 67363 04586');
      expect(lat).toBeCloseTo(LV_LAT, 1);
      expect(lng).toBeCloseTo(LV_LNG, 1);
    });

    test('accepts MGRS string without spaces', () => {
      const { lat, lng } = mgrsToDD('11SPA6736304586');
      expect(lat).toBeCloseTo(LV_LAT, 1);
      expect(lng).toBeCloseTo(LV_LNG, 1);
    });

    test('round-trip DD → MGRS → DD is within ~1m precision', () => {
      const mgrs = ddToMgrs(LV_LAT, LV_LNG);
      const { lat, lng } = mgrsToDD(mgrs);
      // MGRS at 1m precision should be accurate to ~0.00001 degrees
      expect(lat).toBeCloseTo(LV_LAT, 2);
      expect(lng).toBeCloseTo(LV_LNG, 2);
    });

    test('throws on invalid MGRS input', () => {
      expect(() => mgrsToDD('not valid')).toThrow();
      expect(() => mgrsToDD('99Z XX 12345 67890')).toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // parseDdString
  // -------------------------------------------------------------------------

  describe('parseDdString', () => {
    test('parses signed decimal string', () => {
      const { lat, lng } = parseDdString('36.1716, -115.1391');
      expect(lat).toBeCloseTo(LV_LAT, 4);
      expect(lng).toBeCloseTo(LV_LNG, 4);
    });

    test('parses with degree symbol and N/W directions', () => {
      const { lat, lng } = parseDdString(
        '36.1716° N, 115.1391° W',
      );
      expect(lat).toBeCloseTo(LV_LAT, 4);
      expect(lng).toBeCloseTo(LV_LNG, 4);
    });

    test('throws on too-short input', () => {
      expect(() => parseDdString('36.1716')).toThrow();
      expect(() => parseDdString('')).toThrow();
    });
  });
});
