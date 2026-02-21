/**
 * Star navigation utilities for the offline Star Map & Celestial Navigation tool.
 *
 * Provides a minimal embedded star catalog and helper functions for
 * determining hemisphere, season, and which navigational stars/constellations
 * are most relevant at the current time and location.
 *
 * All calculations are offline and require no network connection.
 */

export interface NavigationalStar {
  /** Common name of the star */
  name: string;
  /** Constellation the star belongs to */
  constellation: string;
  /** Right ascension in decimal degrees (0–360) */
  ra: number;
  /** Declination in decimal degrees (-90 to +90) */
  dec: number;
  /** Approximate visual magnitude (lower = brighter) */
  magnitude: number;
  /** Navigation significance of this star */
  significance: string;
  /** Hemisphere where this star is best used for navigation */
  hemisphere: 'northern' | 'southern' | 'both';
}

export interface ConstellationGuide {
  /** Name of the constellation */
  name: string;
  /** Short description of how to find it */
  howToFind: string;
  /** Navigation use for this constellation */
  navigationUse: string;
  /** Hemisphere applicability */
  hemisphere: 'northern' | 'southern' | 'both';
  /** Approximate months (1-based) when the constellation is best visible at night */
  bestMonths: number[];
}

/** Minimal catalog of navigational stars used for celestial navigation */
export const NAVIGATIONAL_STARS: NavigationalStar[] = [
  {
    name: 'Polaris',
    constellation: 'Ursa Minor',
    ra: 37.95,
    dec: 89.26,
    magnitude: 1.98,
    significance:
      'The North Star — always within 1° of true north. Find it to orient yourself in the Northern Hemisphere.',
    hemisphere: 'northern',
  },
  {
    name: 'Sirius',
    constellation: 'Canis Major',
    ra: 101.29,
    dec: -16.72,
    magnitude: -1.46,
    significance:
      'Brightest star in the sky. Rises due east and sets due west, useful for general east–west orientation.',
    hemisphere: 'both',
  },
  {
    name: 'Canopus',
    constellation: 'Carina',
    ra: 95.99,
    dec: -52.7,
    magnitude: -0.72,
    significance:
      'Second brightest star; visible from the Southern Hemisphere. Located roughly south, useful for southern navigation.',
    hemisphere: 'southern',
  },
  {
    name: 'Rigel',
    constellation: 'Orion',
    ra: 78.63,
    dec: -8.2,
    magnitude: 0.13,
    significance:
      "Foot of Orion. Orion's Belt points roughly east–west; Rigel is below the belt on the western side.",
    hemisphere: 'both',
  },
  {
    name: 'Betelgeuse',
    constellation: 'Orion',
    ra: 88.79,
    dec: 7.41,
    magnitude: 0.42,
    significance:
      "Shoulder of Orion. Combined with Rigel, the Orion's Belt line between them gives a true east–west reference.",
    hemisphere: 'both',
  },
  {
    name: 'Acrux',
    constellation: 'Crux (Southern Cross)',
    ra: 186.65,
    dec: -63.1,
    magnitude: 0.77,
    significance:
      'Brightest star of the Southern Cross. The long axis of the Southern Cross points toward the south celestial pole.',
    hemisphere: 'southern',
  },
  {
    name: 'Gacrux',
    constellation: 'Crux (Southern Cross)',
    ra: 187.79,
    dec: -57.11,
    magnitude: 1.59,
    significance:
      'Top of the Southern Cross. Draw a line from Gacrux through Acrux and extend it 4.5× to find the south celestial pole.',
    hemisphere: 'southern',
  },
];

/** Step-by-step constellation guides for celestial navigation */
export const CONSTELLATION_GUIDES: ConstellationGuide[] = [
  {
    name: 'Ursa Major (Big Dipper)',
    howToFind:
      'Look for seven bright stars in the shape of a ladle or plough. The two outer stars of the "bowl" (Dubhe and Merak) are the Pointer Stars.',
    navigationUse:
      'Draw a line through the Pointer Stars (Dubhe to Merak) and extend it about 5× the distance between them — it points directly to Polaris (North Star).',
    hemisphere: 'northern',
    bestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
  {
    name: 'Cassiopeia',
    howToFind:
      'Look for five stars forming a W or M shape. Visible year-round in northern latitudes, on the opposite side of Polaris from the Big Dipper.',
    navigationUse:
      "When the Big Dipper is low on the horizon, use Cassiopeia instead. The middle point of the W's open side points toward Polaris.",
    hemisphere: 'northern',
    bestMonths: [1, 2, 3, 10, 11, 12],
  },
  {
    name: "Orion's Belt",
    howToFind:
      'Three bright stars in a straight line close together in Orion. One of the most recognisable patterns in the sky.',
    navigationUse:
      "Orion's Belt rises almost exactly due east and sets almost exactly due west anywhere on Earth — a reliable east–west reference year-round.",
    hemisphere: 'both',
    bestMonths: [12, 1, 2, 3],
  },
  {
    name: 'Crux (Southern Cross)',
    howToFind:
      'Four bright stars forming a cross, tilted to one side. The two Pointer Stars (Alpha and Beta Centauri) are nearby and help confirm the identification.',
    navigationUse:
      'Extend the long axis of the cross (Gacrux to Acrux) by 4.5 times its length to locate the south celestial pole. Drop a vertical line from that point to the horizon to find true south.',
    hemisphere: 'southern',
    bestMonths: [3, 4, 5, 6, 7, 8],
  },
  {
    name: 'Scorpius',
    howToFind:
      'J-shaped curve of bright stars with the bright reddish Antares at its heart. Visible in the southern sky from temperate and tropical latitudes.',
    navigationUse:
      'The tail of Scorpius curves toward the south and can help confirm a southerly bearing. Antares rises roughly in the southeast.',
    hemisphere: 'southern',
    bestMonths: [5, 6, 7, 8],
  },
];

/**
 * Determine the observer's hemisphere based on latitude.
 *
 * @param latitude - Observer's latitude in decimal degrees
 * @returns 'northern' if latitude >= 0, 'southern' if latitude < 0
 */
export function getHemisphere(latitude: number): 'northern' | 'southern' {
  return latitude >= 0 ? 'northern' : 'southern';
}

/**
 * Return the current astronomical season for a given date and hemisphere.
 *
 * Seasons are determined by approximate calendar dates:
 *   - Spring:  Mar 20 – Jun 20
 *   - Summer:  Jun 21 – Sep 21
 *   - Autumn:  Sep 22 – Dec 20
 *   - Winter:  Dec 21 – Mar 19
 *
 * Seasons are reversed in the Southern Hemisphere.
 *
 * @param date - The current date
 * @param hemisphere - 'northern' or 'southern'
 * @returns Season name
 */
export function getCurrentSeason(
  date: Date,
  hemisphere: 'northern' | 'southern',
): string {
  const month = date.getUTCMonth() + 1; // 1-based
  const day = date.getUTCDate();

  let northernSeason: string;
  if (month < 3 || (month === 3 && day < 20)) {
    northernSeason = 'Winter';
  } else if (month < 6 || (month === 6 && day <= 20)) {
    northernSeason = 'Spring';
  } else if (month < 9 || (month === 9 && day <= 21)) {
    northernSeason = 'Summer';
  } else if (month < 12 || (month === 12 && day <= 20)) {
    northernSeason = 'Autumn';
  } else {
    northernSeason = 'Winter';
  }

  if (hemisphere === 'southern') {
    const opposites: Record<string, string> = {
      Winter: 'Summer',
      Spring: 'Autumn',
      Summer: 'Winter',
      Autumn: 'Spring',
    };
    return opposites[northernSeason];
  }

  return northernSeason;
}

/**
 * Return navigational stars visible from the given hemisphere.
 *
 * @param hemisphere - 'northern' or 'southern'
 * @returns Array of NavigationalStar objects relevant to that hemisphere
 */
export function getStarsForHemisphere(
  hemisphere: 'northern' | 'southern',
): NavigationalStar[] {
  return NAVIGATIONAL_STARS.filter(
    (s) => s.hemisphere === hemisphere || s.hemisphere === 'both',
  );
}

/**
 * Return constellation guides relevant to the given hemisphere and current month.
 *
 * @param hemisphere - 'northern' or 'southern'
 * @param month - Current month (1-based)
 * @returns Array of ConstellationGuide objects sorted by relevance
 */
export function getConstellationGuides(
  hemisphere: 'northern' | 'southern',
  month: number,
): ConstellationGuide[] {
  return CONSTELLATION_GUIDES.filter(
    (g) =>
      (g.hemisphere === hemisphere || g.hemisphere === 'both') &&
      g.bestMonths.includes(month),
  );
}

/**
 * Return the primary navigation instructions for finding north or south
 * based on the observer's hemisphere and the current season/month.
 *
 * @param hemisphere - 'northern' or 'southern'
 * @param month - Current month (1-based), used to recommend the best constellation
 * @returns Array of step-by-step instruction strings
 */
export function getNavigationInstructions(
  hemisphere: 'northern' | 'southern',
  month: number,
): string[] {
  if (hemisphere === 'northern') {
    // Oct–Mar: Cassiopeia is high, Big Dipper may be low
    const useCassiopeia = month >= 10 || month <= 3;
    return [
      'Step 1: Let your eyes adjust to the dark for at least 10 minutes.',
      useCassiopeia
        ? 'Step 2: Find Cassiopeia — the W or M shape high in the northern sky.'
        : 'Step 2: Find the Big Dipper — the ladle-shaped group of seven stars in the northern sky.',
      useCassiopeia
        ? 'Step 3: The open side of the W points toward Polaris, roughly equal in distance to the width of the W.'
        : 'Step 3: Identify the two outer stars of the bowl (Dubhe & Merak — the Pointer Stars).',
      useCassiopeia
        ? 'Step 4: Polaris is the moderately bright star where the W opens to.'
        : 'Step 4: Draw an imaginary line from Merak through Dubhe and extend it about 5× the gap — that is Polaris.',
      'Step 5: Polaris is within 1° of true north. Face it and you are facing north.',
      'Step 6: Extend your arms — your right hand points east, your left hand points west. Behind you is south.',
    ];
  } else {
    // Southern Hemisphere — use the Southern Cross
    // Southern Cross is best Mar–Aug
    const crossVisible = month >= 3 && month <= 8;
    return [
      'Step 1: Let your eyes adjust to the dark for at least 10 minutes.',
      crossVisible
        ? 'Step 2: Find the Southern Cross (Crux) — four bright stars forming a tilted cross, with two bright Pointer Stars (Alpha & Beta Centauri) nearby.'
        : 'Step 2: Find the Southern Cross (Crux) — it may be low on the horizon this time of year; look south.',
      'Step 3: Identify the long axis of the cross: Gacrux (top) and Acrux (bottom — the brightest).',
      'Step 4: Extend an imaginary line from Gacrux through Acrux by 4.5 times the length of the cross.',
      'Step 5: The point where that line ends marks the south celestial pole (no bright star is there).',
      'Step 6: Drop a vertical line straight down from that point to the horizon — that is true south.',
      'Step 7: Face south; your left hand points east, your right hand points west. Behind you is north.',
    ];
  }
}
