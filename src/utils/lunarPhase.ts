/**
 * Get the lunar phase name based on the phase value from SunCalc.
 * @param phase - Phase value from 0 to 1 (0/1 = new moon, 0.5 = full moon)
 * @returns The name of the lunar phase
 */
export const getLunarPhaseName = (phase: number): string => {
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
};
