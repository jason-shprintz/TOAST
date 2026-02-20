/**
 * Utility functions for barometric pressure calculations.
 */

/** Convert hPa to inHg */
export const hpaToInhg = (hpa: number): number => {
  return hpa * 0.02953;
};

/** Trend direction for pressure readings */
export type PressureTrend = 'Rising' | 'Steady' | 'Falling';

/** Thresholds in hPa over the window period to determine trend */
const RISING_THRESHOLD = 1.0;
const FALLING_THRESHOLD = -1.0;

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
