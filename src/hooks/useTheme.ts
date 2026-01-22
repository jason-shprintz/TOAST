import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../stores';
import { LIGHT_COLORS, DARK_COLORS, ColorScheme } from '../theme/colors';

/**
 * Hook that provides the current theme colors based on the user's theme mode setting.
 * 
 * - If theme mode is 'light', returns light colors
 * - If theme mode is 'dark', returns dark colors
 * - If theme mode is 'system', returns colors based on system color scheme
 * 
 * @returns The current color scheme object
 */
export function useTheme(): ColorScheme {
  const settingsStore = useSettingsStore();
  const systemColorScheme = useColorScheme();
  const [colors, setColors] = useState<ColorScheme>(() => {
    if (settingsStore.themeMode === 'light') {
      return LIGHT_COLORS;
    } else if (settingsStore.themeMode === 'dark') {
      return DARK_COLORS;
    } else {
      return systemColorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    }
  });

  useEffect(() => {
    let newColors: ColorScheme;
    if (settingsStore.themeMode === 'light') {
      newColors = LIGHT_COLORS;
    } else if (settingsStore.themeMode === 'dark') {
      newColors = DARK_COLORS;
    } else {
      newColors = systemColorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    }
    setColors(newColors);
  }, [settingsStore.themeMode, systemColorScheme]);

  return colors;
}
