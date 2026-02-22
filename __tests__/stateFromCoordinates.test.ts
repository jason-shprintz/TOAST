/**
 * @format
 * Tests for stateFromCoordinates utility
 */

import { stateFromCoordinates } from '../src/utils/stateFromCoordinates';

describe('stateFromCoordinates', () => {
  it('returns Florida for Tampa coordinates', () => {
    expect(stateFromCoordinates(27.9506, -82.4572)).toBe('Florida');
  });

  it('returns Nevada for Las Vegas coordinates', () => {
    expect(stateFromCoordinates(36.1699, -115.1398)).toBe('Nevada');
  });

  it('returns California for Los Angeles coordinates', () => {
    expect(stateFromCoordinates(34.0522, -118.2437)).toBe('California');
  });

  it('returns Texas for Dallas coordinates', () => {
    expect(stateFromCoordinates(32.7767, -96.797)).toBe('Texas');
  });

  it('returns New York for Albany coordinates', () => {
    expect(stateFromCoordinates(42.6526, -73.7562)).toBe('New York');
  });

  it('returns null for coordinates in the ocean', () => {
    expect(stateFromCoordinates(25.0, -70.0)).toBeNull();
  });

  it('returns null for coordinates outside the US (Paris)', () => {
    expect(stateFromCoordinates(48.8566, 2.3522)).toBeNull();
  });

  it('returns District of Columbia for Washington DC coordinates', () => {
    expect(stateFromCoordinates(38.9072, -77.0369)).toBe(
      'District of Columbia',
    );
  });

  it('returns Hawaii for Honolulu coordinates', () => {
    expect(stateFromCoordinates(21.3069, -157.8583)).toBe('Hawaii');
  });

  it('returns Alaska for Anchorage coordinates', () => {
    expect(stateFromCoordinates(61.2181, -149.9003)).toBe('Alaska');
  });
});
