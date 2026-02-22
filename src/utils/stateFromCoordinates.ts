/**
 * Returns the full US state name for a given (lat, lng) coordinate pair using
 * approximate bounding-box lookup.
 *
 * Accuracy is intentionally limited to whole-state granularity. Because
 * RepeaterBookStore always queries the detected state AND all its neighbours,
 * minor inaccuracies near state borders do not cause repeaters to be missed.
 *
 * Returns `null` when the coordinates do not fall inside any listed state
 * (e.g. open ocean, Canada, Mexico).
 *
 * Coverage: 50 US states + DC.
 */

type StateBounds = {
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

// Approximate minimum bounding rectangles for every US state and DC.
// Sorted loosely by bounding-box area (smallest first) so that when two boxes
// overlap at a border the smaller / more specific state wins.
const STATE_BOUNDS: StateBounds[] = [
  {
    name: 'Rhode Island',
    minLat: 41.15,
    maxLat: 42.01,
    minLng: -71.91,
    maxLng: -71.12,
  },
  {
    name: 'Delaware',
    minLat: 38.45,
    maxLat: 39.84,
    minLng: -75.79,
    maxLng: -75.05,
  },
  {
    name: 'District of Columbia',
    minLat: 38.79,
    maxLat: 38.99,
    minLng: -77.12,
    maxLng: -76.91,
  },
  {
    name: 'Connecticut',
    minLat: 40.95,
    maxLat: 42.05,
    minLng: -73.73,
    maxLng: -71.79,
  },
  {
    name: 'New Jersey',
    minLat: 38.93,
    maxLat: 41.36,
    minLng: -75.56,
    maxLng: -73.89,
  },
  {
    name: 'New Hampshire',
    minLat: 42.7,
    maxLat: 45.31,
    minLng: -72.56,
    maxLng: -70.61,
  },
  {
    name: 'Vermont',
    minLat: 42.73,
    maxLat: 45.02,
    minLng: -73.44,
    maxLng: -71.46,
  },
  {
    name: 'Massachusetts',
    minLat: 41.19,
    maxLat: 42.89,
    minLng: -73.51,
    maxLng: -69.93,
  },
  {
    name: 'Maryland',
    minLat: 37.91,
    maxLat: 39.72,
    minLng: -79.49,
    maxLng: -74.98,
  },
  {
    name: 'Hawaii',
    minLat: 18.91,
    maxLat: 22.24,
    minLng: -160.25,
    maxLng: -154.8,
  },
  {
    name: 'West Virginia',
    minLat: 37.2,
    maxLat: 40.64,
    minLng: -82.64,
    maxLng: -77.72,
  },
  {
    name: 'South Carolina',
    minLat: 32.05,
    maxLat: 35.21,
    minLng: -83.36,
    maxLng: -78.55,
  },
  {
    name: 'Indiana',
    minLat: 37.77,
    maxLat: 41.77,
    minLng: -88.1,
    maxLng: -84.78,
  },
  {
    name: 'Maine',
    minLat: 43.06,
    maxLat: 47.46,
    minLng: -71.08,
    maxLng: -66.95,
  },
  {
    name: 'Tennessee',
    minLat: 34.98,
    maxLat: 36.68,
    minLng: -90.31,
    maxLng: -81.65,
  },
  { name: 'Ohio', minLat: 38.4, maxLat: 42.33, minLng: -84.82, maxLng: -80.52 },
  {
    name: 'Kentucky',
    minLat: 36.5,
    maxLat: 39.15,
    minLng: -89.57,
    maxLng: -81.96,
  },
  {
    name: 'Virginia',
    minLat: 36.54,
    maxLat: 39.47,
    minLng: -83.68,
    maxLng: -75.24,
  },
  {
    name: 'Pennsylvania',
    minLat: 39.72,
    maxLat: 42.27,
    minLng: -80.52,
    maxLng: -74.69,
  },
  {
    name: 'Mississippi',
    minLat: 30.17,
    maxLat: 35.01,
    minLng: -91.65,
    maxLng: -88.1,
  },
  { name: 'Iowa', minLat: 40.38, maxLat: 43.5, minLng: -96.64, maxLng: -90.14 },
  {
    name: 'Louisiana',
    minLat: 28.93,
    maxLat: 33.02,
    minLng: -94.04,
    maxLng: -88.82,
  },
  {
    name: 'Alabama',
    minLat: 30.14,
    maxLat: 35.01,
    minLng: -88.47,
    maxLng: -84.89,
  },
  {
    name: 'Georgia',
    minLat: 30.36,
    maxLat: 35.0,
    minLng: -85.61,
    maxLng: -80.84,
  },
  {
    name: 'North Carolina',
    minLat: 33.84,
    maxLat: 36.59,
    minLng: -84.32,
    maxLng: -75.46,
  },
  {
    name: 'Wisconsin',
    minLat: 42.49,
    maxLat: 47.08,
    minLng: -92.89,
    maxLng: -86.25,
  },
  {
    name: 'Michigan',
    minLat: 41.7,
    maxLat: 48.31,
    minLng: -90.42,
    maxLng: -82.41,
  },
  {
    name: 'Illinois',
    minLat: 36.97,
    maxLat: 42.51,
    minLng: -91.51,
    maxLng: -87.49,
  },
  {
    name: 'Florida',
    minLat: 24.52,
    maxLat: 31.0,
    minLng: -87.63,
    maxLng: -80.03,
  },
  {
    name: 'New York',
    minLat: 40.5,
    maxLat: 45.01,
    minLng: -79.76,
    maxLng: -71.86,
  },
  {
    name: 'Arkansas',
    minLat: 33.0,
    maxLat: 36.5,
    minLng: -94.62,
    maxLng: -89.64,
  },
  {
    name: 'Missouri',
    minLat: 35.99,
    maxLat: 40.61,
    minLng: -95.77,
    maxLng: -89.1,
  },
  {
    name: 'Kansas',
    minLat: 36.99,
    maxLat: 40.0,
    minLng: -102.05,
    maxLng: -94.59,
  },
  {
    name: 'Minnesota',
    minLat: 43.5,
    maxLat: 49.38,
    minLng: -97.24,
    maxLng: -89.49,
  },
  {
    name: 'Nebraska',
    minLat: 40.0,
    maxLat: 43.0,
    minLng: -104.05,
    maxLng: -95.31,
  },
  {
    name: 'Oklahoma',
    minLat: 33.62,
    maxLat: 37.0,
    minLng: -103.0,
    maxLng: -94.43,
  },
  {
    name: 'South Dakota',
    minLat: 42.48,
    maxLat: 45.94,
    minLng: -104.06,
    maxLng: -96.44,
  },
  {
    name: 'North Dakota',
    minLat: 45.93,
    maxLat: 49.0,
    minLng: -104.05,
    maxLng: -96.56,
  },
  {
    name: 'Colorado',
    minLat: 36.99,
    maxLat: 41.0,
    minLng: -109.06,
    maxLng: -102.04,
  },
  {
    name: 'Wyoming',
    minLat: 41.0,
    maxLat: 45.01,
    minLng: -111.05,
    maxLng: -104.05,
  },
  {
    name: 'Utah',
    minLat: 37.0,
    maxLat: 42.0,
    minLng: -114.05,
    maxLng: -109.04,
  },
  {
    name: 'Montana',
    minLat: 44.36,
    maxLat: 49.0,
    minLng: -116.05,
    maxLng: -104.04,
  },
  {
    name: 'New Mexico',
    minLat: 31.33,
    maxLat: 37.0,
    minLng: -109.05,
    maxLng: -103.0,
  },
  {
    name: 'Idaho',
    minLat: 41.99,
    maxLat: 49.0,
    minLng: -117.24,
    maxLng: -111.04,
  },
  {
    name: 'Arizona',
    minLat: 31.33,
    maxLat: 37.0,
    minLng: -114.82,
    maxLng: -109.04,
  },
  {
    name: 'Nevada',
    minLat: 35.0,
    maxLat: 42.0,
    minLng: -120.01,
    maxLng: -114.04,
  },
  {
    name: 'Oregon',
    minLat: 41.99,
    maxLat: 46.26,
    minLng: -124.6,
    maxLng: -116.46,
  },
  {
    name: 'Washington',
    minLat: 45.54,
    maxLat: 49.0,
    minLng: -124.73,
    maxLng: -116.92,
  },
  {
    name: 'California',
    minLat: 32.53,
    maxLat: 42.01,
    minLng: -124.48,
    maxLng: -114.13,
  },
  {
    name: 'Texas',
    minLat: 25.84,
    maxLat: 36.5,
    minLng: -106.65,
    maxLng: -93.51,
  },
  {
    name: 'Alaska',
    minLat: 51.21,
    maxLat: 71.39,
    minLng: -179.15,
    maxLng: -129.98,
  },
];

/**
 * Returns the full US state name for the given coordinates, or `null` if the
 * point does not fall inside any listed bounding box.
 *
 * When multiple bounding boxes contain the point (which happens near borders),
 * the state with the smallest bounding-box area is returned — this generally
 * produces the most accurate result since smaller states have tighter boxes.
 */
export function stateFromCoordinates(lat: number, lng: number): string | null {
  const candidates = STATE_BOUNDS.filter(
    (s) =>
      lat >= s.minLat && lat <= s.maxLat && lng >= s.minLng && lng <= s.maxLng,
  );

  if (candidates.length === 0) return null;

  // Pick smallest bounding box (already sorted that way, but sort again in case
  // order was changed by a future edit).
  candidates.sort((a, b) => {
    const aArea = (a.maxLat - a.minLat) * (a.maxLng - a.minLng);
    const bArea = (b.maxLat - b.minLat) * (b.maxLng - b.minLng);
    return aArea - bArea;
  });

  return candidates[0].name;
}
