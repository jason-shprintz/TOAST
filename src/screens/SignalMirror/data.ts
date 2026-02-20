export interface GroundSignal {
  symbol: string;
  meaning: string;
  minSize: string;
  materials: string;
}

/**
 * Internationally recognised ground-to-air distress signals.
 * Based on ICAO Annex 12 and standard SAR conventions.
 */
export const GROUND_TO_AIR_SIGNALS: GroundSignal[] = [
  {
    symbol: 'V',
    meaning: 'Need assistance',
    minSize: '3 m × 3 m',
    materials:
      'Rocks, logs, torn clothing, trampled vegetation, any contrast material',
  },
  {
    symbol: 'X',
    meaning: 'Need medical help',
    minSize: '3 m × 3 m',
    materials: 'Rocks, logs, brightly colored fabric, snow trench',
  },
  {
    symbol: '→',
    meaning: 'Traveling in this direction',
    minSize: '3 m long',
    materials:
      'Rocks, branches, clothing; point arrow toward direction of travel',
  },
  {
    symbol: 'F',
    meaning: 'Need food and water',
    minSize: '3 m × 3 m',
    materials: 'Rocks, logs, sand furrows, trampled grass',
  },
  {
    symbol: 'LL',
    meaning: 'All is well',
    minSize: '3 m × 3 m',
    materials: 'Rocks, logs, clothing, any high-contrast material',
  },
  {
    symbol: '△',
    meaning: 'Safe to land here',
    minSize: '3 m × 3 m',
    materials: 'Rocks, logs, fabric; place in open flat area free of obstacles',
  },
  {
    symbol: 'K',
    meaning: 'Indicate which direction to proceed',
    minSize: '3 m × 3 m',
    materials: 'Rocks, branches, clothing',
  },
  {
    symbol: 'JL',
    meaning: 'Do not understand / confirm our location',
    minSize: '3 m × 3 m',
    materials: 'Rocks, logs, any available material',
  },
];
