const LIGHT_COLORS = {
  TOAST_BROWN: '#C09A6B',
  TOAST_BROWN_GRADIENT: ['#ecb16eff', '#C09A6B'],
  PRIMARY_DARK: '#1F1F1F',
  PRIMARY_LIGHT: '#F2EDE4',
  ACCENT: '#FF8B43',
  SECONDARY_ACCENT: '#8DAA9D',
  BACKGROUND: '#D9C8B0',
  BACKGROUND_GRADIENT: ['#f3dec0ff', '#F2EDE4', '#D9C8B0', '#f3cfa3ff'],
  ERROR: '#d32f2f',
  SUCCESS: '#28a745',
  SUCCESS_LIGHT: '#d4edda',
  ERROR_LIGHT: '#f8d7da',
};

const DARK_COLORS = {
  TOAST_BROWN: '#C09A6B',
  TOAST_BROWN_GRADIENT: ['#8B6F47', '#C09A6B'],
  PRIMARY_DARK: '#E8E8E8',
  PRIMARY_LIGHT: '#1F1F1F',
  ACCENT: '#FF8B43',
  SECONDARY_ACCENT: '#6B8C7E',
  BACKGROUND: '#2A2520',
  BACKGROUND_GRADIENT: ['#352d28ff', '#2A2520', '#1F1F1F', '#3a3330ff'],
  ERROR: '#ef5350',
  SUCCESS: '#66bb6a',
  SUCCESS_LIGHT: '#2d4a30',
  ERROR_LIGHT: '#4a2d2e',
};

export type ThemeColors = typeof LIGHT_COLORS;
// ColorScheme is an alias for ThemeColors, used by useTheme hook for consistency
export type ColorScheme = ThemeColors;

// Default export for backwards compatibility
const COLORS = LIGHT_COLORS;

export default COLORS;
export { LIGHT_COLORS, DARK_COLORS };
