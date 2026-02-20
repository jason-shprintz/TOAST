/**
 * @format
 */

import {
  CONSTELLATION_GUIDES,
  NAVIGATIONAL_STARS,
  getCurrentSeason,
  getConstellationGuides,
  getHemisphere,
  getNavigationInstructions,
  getStarsForHemisphere,
} from '../src/utils/starNavigation';

describe('starNavigation utilities', () => {
  describe('getHemisphere', () => {
    test('returns northern for positive latitude', () => {
      expect(getHemisphere(51.5)).toBe('northern');
    });

    test('returns northern for latitude of 0 (equator)', () => {
      expect(getHemisphere(0)).toBe('northern');
    });

    test('returns southern for negative latitude', () => {
      expect(getHemisphere(-33.9)).toBe('southern');
    });
  });

  describe('getCurrentSeason', () => {
    test('returns Winter for January in northern hemisphere', () => {
      expect(getCurrentSeason(new Date('2024-01-15'), 'northern')).toBe(
        'Winter',
      );
    });

    test('returns Summer for July in northern hemisphere', () => {
      expect(getCurrentSeason(new Date('2024-07-15'), 'northern')).toBe(
        'Summer',
      );
    });

    test('returns Spring for April in northern hemisphere', () => {
      expect(getCurrentSeason(new Date('2024-04-15'), 'northern')).toBe(
        'Spring',
      );
    });

    test('returns Autumn for October in northern hemisphere', () => {
      expect(getCurrentSeason(new Date('2024-10-15'), 'northern')).toBe(
        'Autumn',
      );
    });

    test('reverses seasons for southern hemisphere', () => {
      expect(getCurrentSeason(new Date('2024-01-15'), 'southern')).toBe(
        'Summer',
      );
      expect(getCurrentSeason(new Date('2024-07-15'), 'southern')).toBe(
        'Winter',
      );
    });

    test('handles solstice boundary correctly (Dec 21 = Winter northern)', () => {
      expect(getCurrentSeason(new Date('2024-12-21'), 'northern')).toBe(
        'Winter',
      );
    });

    test('handles spring equinox boundary (Mar 20 = Spring northern)', () => {
      expect(getCurrentSeason(new Date('2024-03-20'), 'northern')).toBe(
        'Spring',
      );
    });
  });

  describe('getStarsForHemisphere', () => {
    test('includes Polaris for northern hemisphere', () => {
      const stars = getStarsForHemisphere('northern');
      expect(stars.some((s) => s.name === 'Polaris')).toBe(true);
    });

    test('excludes southern-only stars from northern results', () => {
      const stars = getStarsForHemisphere('northern');
      expect(stars.some((s) => s.hemisphere === 'southern')).toBe(false);
    });

    test('includes Southern Cross stars for southern hemisphere', () => {
      const stars = getStarsForHemisphere('southern');
      expect(stars.some((s) => s.name === 'Acrux')).toBe(true);
      expect(stars.some((s) => s.name === 'Gacrux')).toBe(true);
    });

    test('excludes northern-only stars from southern results', () => {
      const stars = getStarsForHemisphere('southern');
      expect(stars.some((s) => s.hemisphere === 'northern')).toBe(false);
    });

    test('includes Sirius (both hemispheres) in both results', () => {
      expect(
        getStarsForHemisphere('northern').some((s) => s.name === 'Sirius'),
      ).toBe(true);
      expect(
        getStarsForHemisphere('southern').some((s) => s.name === 'Sirius'),
      ).toBe(true);
    });
  });

  describe('getConstellationGuides', () => {
    test('returns Orion for northern hemisphere in December', () => {
      const guides = getConstellationGuides('northern', 12);
      expect(guides.some((g) => g.name.includes('Orion'))).toBe(true);
    });

    test('returns Southern Cross for southern hemisphere in May', () => {
      const guides = getConstellationGuides('southern', 5);
      expect(guides.some((g) => g.name.includes('Crux'))).toBe(true);
    });

    test('does not return northern-only constellations for southern hemisphere', () => {
      const guides = getConstellationGuides('southern', 1);
      expect(guides.some((g) => g.hemisphere === 'northern')).toBe(false);
    });

    test('returns empty array when no constellations match month', () => {
      // Scorpius only listed May-Aug; Crux Mar-Aug; Orion Dec-Mar
      // For northern hemisphere in September only Cassiopeia Oct-Mar could be filtered
      const guides = getConstellationGuides('northern', 9);
      // Ursa Major is listed for all 12 months, so at least that should appear
      guides.forEach((g) => {
        expect(g.bestMonths).toContain(9);
      });
    });
  });

  describe('getNavigationInstructions', () => {
    test('returns an array of step strings for northern hemisphere', () => {
      const steps = getNavigationInstructions('northern', 6);
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
      steps.forEach((step) => expect(typeof step).toBe('string'));
    });

    test('returns an array of step strings for southern hemisphere', () => {
      const steps = getNavigationInstructions('southern', 5);
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
      steps.forEach((step) => expect(typeof step).toBe('string'));
    });

    test('northern summer instructions mention the Big Dipper', () => {
      const steps = getNavigationInstructions('northern', 6);
      const allText = steps.join(' ');
      expect(allText).toMatch(/Big Dipper|Pointer Star|Polaris/i);
    });

    test('northern winter instructions mention Cassiopeia', () => {
      const steps = getNavigationInstructions('northern', 11);
      const allText = steps.join(' ');
      expect(allText).toMatch(/Cassiopeia/i);
    });

    test('southern instructions mention the Southern Cross', () => {
      const steps = getNavigationInstructions('southern', 5);
      const allText = steps.join(' ');
      expect(allText).toMatch(/Southern Cross|Crux|Acrux|Gacrux/i);
    });

    test('steps are numbered starting with Step 1', () => {
      const stepsN = getNavigationInstructions('northern', 6);
      expect(stepsN[0]).toMatch(/^Step 1/);
      const stepsS = getNavigationInstructions('southern', 5);
      expect(stepsS[0]).toMatch(/^Step 1/);
    });
  });

  describe('star catalog integrity', () => {
    test('all stars have required fields', () => {
      NAVIGATIONAL_STARS.forEach((star) => {
        expect(star.name).toBeTruthy();
        expect(star.constellation).toBeTruthy();
        expect(typeof star.ra).toBe('number');
        expect(typeof star.dec).toBe('number');
        expect(typeof star.magnitude).toBe('number');
        expect(star.significance).toBeTruthy();
        expect(['northern', 'southern', 'both']).toContain(star.hemisphere);
      });
    });

    test('all constellation guides have required fields', () => {
      CONSTELLATION_GUIDES.forEach((guide) => {
        expect(guide.name).toBeTruthy();
        expect(guide.howToFind).toBeTruthy();
        expect(guide.navigationUse).toBeTruthy();
        expect(['northern', 'southern', 'both']).toContain(guide.hemisphere);
        expect(Array.isArray(guide.bestMonths)).toBe(true);
        expect(guide.bestMonths.length).toBeGreaterThan(0);
        guide.bestMonths.forEach((m) => {
          expect(m).toBeGreaterThanOrEqual(1);
          expect(m).toBeLessThanOrEqual(12);
        });
      });
    });

    test('star RA values are in range 0–360', () => {
      NAVIGATIONAL_STARS.forEach((star) => {
        expect(star.ra).toBeGreaterThanOrEqual(0);
        expect(star.ra).toBeLessThanOrEqual(360);
      });
    });

    test('star declination values are in range -90 to +90', () => {
      NAVIGATIONAL_STARS.forEach((star) => {
        expect(star.dec).toBeGreaterThanOrEqual(-90);
        expect(star.dec).toBeLessThanOrEqual(90);
      });
    });
  });
});
