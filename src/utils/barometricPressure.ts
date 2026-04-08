/**
 * Utility functions for barometric pressure calculations.
 */

/** Convert hPa to inHg */
export const hpaToInhg = (hpa: number): number => {
  return hpa * 0.0295299830714;
};

/** Trend direction for pressure readings */
export type PressureTrend = 'Rising' | 'Steady' | 'Falling';

/** Thresholds in hPa over the window period to determine trend */
const RISING_THRESHOLD = 1.0;
const FALLING_THRESHOLD = -1.0;

/**
 * Minimum fraction of the selected window that recorded readings must span
 * before a trend is considered meaningful.  A 3 h window requires at least
 * 1.5 h of accumulated data; a 24 h window requires at least 12 h, etc.
 */
export const MIN_WINDOW_COVERAGE = 0.5;

/**
 * Returns true when the provided samples span at least MIN_WINDOW_COVERAGE
 * of the requested window duration.
 *
 * Readings are accumulated passively — every time the user opens the app the
 * sensor is sampled and results are persisted to SQLite.  This function gates
 * trend display so that a trend is only shown once the data is genuinely
 * representative of the chosen time window.
 *
 * @param samples - Chronologically ordered samples inside the window; must
 *   include at least a `timestamp` field (ms since epoch).
 * @param windowMs - Duration of the selected trend window in milliseconds.
 * @returns `true` when there is sufficient coverage to display a reliable trend.
 */
export const hasSufficientDataForTrend = (
  samples: ReadonlyArray<{ timestamp: number }>,
  windowMs: number,
): boolean => {
  if (samples.length < 2) {
    return false;
  }
  const span = samples[samples.length - 1].timestamp - samples[0].timestamp;
  return span >= windowMs * MIN_WINDOW_COVERAGE;
};

/**
 * Determine the pressure trend given an array of timestamped readings.
 * Uses the difference between the most-recent reading and the oldest
 * reading in the provided array.
 *
 * @param readings - Chronologically ordered pressure readings in hPa
 * @returns 'Rising' | 'Steady' | 'Falling'
 */
export const getPressureTrend = (readings: number[]): PressureTrend => {
  if (readings.length < 2) {
    return 'Steady';
  }
  const delta = readings[readings.length - 1] - readings[0];
  if (delta >= RISING_THRESHOLD) {
    return 'Rising';
  }
  if (delta <= FALLING_THRESHOLD) {
    return 'Falling';
  }
  return 'Steady';
};

/**
 * Return a brief weather interpretation string based on the pressure trend.
 */
export const getTrendInterpretation = (trend: PressureTrend): string => {
  switch (trend) {
    case 'Rising':
      return 'Rising pressure may indicate clearing conditions.';
    case 'Falling':
      return 'Falling pressure may indicate incoming weather.';
    case 'Steady':
    default:
      return 'Steady pressure suggests stable conditions.';
  }
};
